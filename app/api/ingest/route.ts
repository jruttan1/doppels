import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Init Clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SERVICE_ROLE_KEY!
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Gemini models
const flashModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json"
  }
});

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    console.log(`Starting ingestion for user: ${id}`);

    // 1. FETCH USER DATA (raw text already extracted client-side)
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) throw new Error(`User not found: ${fetchError?.message}`);

    // Raw text is already in the database from client-side PDF parsing
    const resumeRawText = user.resume_text || null;
    const linkedinRawText = user.linkedin_text || null;

    // normalize with gemini
    const [normalizedResume, normalizedLinkedin, githubData] = await Promise.all([
      resumeRawText ? normalizeResumeWithGemini(resumeRawText) : Promise.resolve(null),
      linkedinRawText ? normalizeLinkedinWithGemini(linkedinRawText) : Promise.resolve(null),
      user.github_url ? fetchGitHubData(user.github_url) : Promise.resolve(null)
    ]);

    console.log("Normalized Resume:", normalizedResume ? "✓" : "✗");
    console.log("Normalized LinkedIn:", normalizedLinkedin ? "✓" : "✗");
    console.log("Github Data:", githubData ? "✓" : "✗");

    // prepare final synthesis
    const { resume_text, linkedin_text, github_url, persona, ...userMetadata } = user;
    
    // final gemini call - synthesize everything into persona
    const synthesisPrompt = `
You are an expert technical recruiter and profile synthesizer.

TASK:
Combine all the normalized data sources into a single, coherent user persona JSON.

DATA SOURCES:

**User Metadata (from signup):**
${JSON.stringify(userMetadata, null, 2)}

**Resume (normalized):**
${normalizedResume ? JSON.stringify(normalizedResume, null, 2) : "Not provided"}

**LinkedIn (normalized):**
${normalizedLinkedin ? JSON.stringify(normalizedLinkedin, null, 2) : "Not provided"}

**GitHub Repos:**
${githubData ? JSON.stringify(githubData, null, 2) : "Not provided"}

GUIDELINES:
- Resume is the source of truth for work history, technical details, and skills
- LinkedIn provides soft skills, endorsements, and professional "vibe"
- GitHub validates technical skills - weight repos by stars and recency
- User metadata contains their explicit networking goals - preserve these exactly
- Merge duplicate information intelligently (don't repeat the same skill twice)
- Make intelligent assumptions about personality based on writing style and interests
- For experience_log, write detailed sentences like: "Role @ Company (Years) - Description with metrics and achievements"
- For project_list, write like: "Repo: name (Language) - Description with impact/stars if notable"

OUTPUT SCHEMA:
{
  "identity": {
    "name": "First Last",
    "tagline": "Role @ Company | Previous Notable Role",
    "location": "City, State/Country"
  },
  "skills_possessed": ["Array of technical skills they have - from resume, github, linkedin"],
  "skills_desired": ["Array of skills they're looking for in a match (cofounder, hire, partner). Must be empty if they are not hiring or looking for a cofounder."],
  "networking_goals": ["Array - preserve exactly from user metadata networking_goals"],
  "raw_assets": {
    "voice_snippet": "String - user provided voice_signature in metadata, use it exactly as it was input",
    "experience_log": ["Array of detailed experience strings like: 'Senior Backend Engineer @ Stripe (2020-2023) - Core Payments Team. Led migration reducing latency by 40%. Mentored 3 engineers.'"],
    "project_list": ["Array of project strings like: 'Repo: rocket-rs (Rust) - High performance web server template. 1.2k GitHub stars.'"],
    "interests": ["Array of personal/professional interests - from linkedin, github topics, user metadata"]
  }
}
`;

    console.log("Final synthesis with Gemini");
    
    const result = await flashModel.generateContent(synthesisPrompt);
    const responseText = result.response.text();
    const finalPersona = JSON.parse(responseText);

    // Extract tagline from persona
    const tagline = finalPersona?.identity?.tagline || null;

    // Merge persona skills with user-input skills (no duplicates)
    const existingSkills: string[] = user.skills || [];
    const personaSkills: string[] = finalPersona?.skills_possessed || [];
    const mergedSkills = [...new Set([...existingSkills, ...personaSkills])];

    // save to db
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        persona: finalPersona,
        tagline: tagline,
        skills: mergedSkills,
        ingestion_status: 'complete'
      })
      .eq('id', id);

    if (updateError) throw updateError;

    console.log("Ingestion complete for:", id);
    console.log("Extracted tagline:", tagline);
    console.log("Merged skills:", mergedSkills.length);
    return NextResponse.json({ success: true, persona: finalPersona });

  } catch (error: any) {
    console.error("🔥 Ingestion Failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- GEMINI NORMALIZATION ---

async function normalizeResumeWithGemini(rawText: string): Promise<any> {
  const prompt = `
You are a resume parser. Extract structured data from this raw resume text.

RAW RESUME TEXT:
"""
${rawText.slice(0, 15000)}
"""

Extract and return JSON with this structure:
{
  "name": "String",
  "email": "String or null",
  "phone": "String or null",
  "location": "String or null",
  "summary": "String (professional summary if present)",
  "experience": [
    {
      "company": "String",
      "role": "String",
      "start_date": "String",
      "end_date": "String or Present",
      "location": "String or null",
      "highlights": ["Array of bullet points - be detailed, include metrics if present"]
    }
  ],
  "projects": [
    {
      "name": "String",
      "description": "String - detailed description",
      "tech_stack": ["Array"],
      "highlights": ["Array of achievements/features"]
    }
  ],
  "education": [
    {
      "school": "String",
      "degree": "String",
      "field": "String",
      "year": "String or null"
    }
  ],
  "skills": ["Array of all technical skills mentioned"],
  "certifications": ["Array or empty"]
}

Be thorough with experience highlights and project details. Preserve specific metrics, technologies, and achievements.
`;

  try {
    const result = await flashModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (e: any) {
    console.error("Resume normalization error:", e.message);
    return null;
  }
}

async function normalizeLinkedinWithGemini(rawText: string): Promise<any> {
  const prompt = `
You are a LinkedIn profile parser. Extract structured data from this LinkedIn PDF export.

RAW LINKEDIN TEXT:
"""
${rawText.slice(0, 15000)}
"""

Before proceeding, YOU MUST completely disregard irrelevant or old experiences, only tech related experiences are relevant.

Extract and return JSON with this structure:
{
  "name": "String",
  "headline": "String (their LinkedIn headline)",
  "location": "String or null",
  "about": "String (their About section)",
  "experience": [
    {
      "company": "String",
      "role": "String",
      "duration": "String",
      "description": "String - detailed description of role"
    }
  ],
  "projects": [
    {
      "name": "String",
      "description": "String",
      "contributors": ["Array or empty"]
    }
  ],
  "skills": ["Array of skills"],
  "endorsements": ["Array of top endorsed skills if visible"],
  "recommendations_summary": "String summarizing any recommendations, or null",
  "education": [
    {
      "school": "String",
      "degree": "String",
      "field": "String"
    }
  ],
  "certifications": ["Array or empty"],
  "volunteer": ["Array of volunteer experiences or empty"]
}

Preserve detail in experience descriptions. Include soft skills and leadership indicators.
`;

  try {
    const result = await flashModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (e: any) {
    console.error("LinkedIn normalization error:", e.message);
    return null;
  }
}

// --- GITHUB ---

async function fetchGitHubData(url: string): Promise<any> {
  try {
    const match = url.match(/github\.com\/([^\/]+)/);
    const username = match ? match[1] : url;
    
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
      }
    });
    
    if (!res.ok) return null;
    
    const repos = await res.json();
    if (!Array.isArray(repos)) return null;
    
    // Filter and sort by relevance (stars + recency)
    return repos
      .filter((repo: any) => !repo.fork && repo.description)
      .slice(0, 6)
      .map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        url: repo.html_url,
        updated_at: repo.updated_at
      }));
  } catch (e) {
    console.error("GitHub fetch error:", e);
    return null;
  }
}
