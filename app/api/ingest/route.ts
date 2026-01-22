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
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json"
  }
});

export const maxDuration = 60; 

export async function POST(req: Request) {
  let userId: string | null = null;
  try {
    const { id } = await req.json();
    userId = id;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    console.log(`Starting ingestion for user: ${id}`);

    // 1. FETCH USER DATA (raw text already extracted client-side)
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !user) throw new Error(`User not found: ${fetchError?.message}`);

    // Check for pre-normalized data from onboarding (new flow)
    // Fall back to raw text normalization if pre-normalized data doesn't exist (legacy flow)
    const resumeRawText = user.resume_text || null;
    const linkedinRawText = user.linkedin_text || null;
    const preNormalizedResume = user.resume_normalized || null;
    const preNormalizedLinkedin = user.linkedin_normalized || null;

    // Use pre-normalized data if available, otherwise normalize from raw text
    const [normalizedResume, normalizedLinkedin, githubData] = await Promise.all([
      preNormalizedResume
        ? Promise.resolve(preNormalizedResume)
        : (resumeRawText ? normalizeResumeWithGemini(resumeRawText) : Promise.resolve(null)),
      preNormalizedLinkedin
        ? Promise.resolve(preNormalizedLinkedin)
        : (linkedinRawText ? normalizeLinkedinWithGemini(linkedinRawText) : Promise.resolve(null)),
      user.github_url ? fetchGitHubData(user.github_url) : Promise.resolve(null),
    ]);

    console.log("Normalized Resume:", normalizedResume ? "✓" : "✗", preNormalizedResume ? "(pre-normalized)" : "(from raw text)");
    console.log("Normalized LinkedIn:", normalizedLinkedin ? "✓" : "✗", preNormalizedLinkedin ? "(pre-normalized)" : "(from raw text)");
    console.log("Github Data:", githubData ? "✓" : "✗");

    // Validate we have at least some data to create a persona
    if (!normalizedResume && !normalizedLinkedin && !githubData && !user.networking_goals?.length) {
      console.warn("⚠️ No data sources available for persona creation");
    }

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
- Resume/LinkedIn normalized data may have an "analysis" layer with pre-computed insights (seniority_level, primary_role, voice_tone, years_experience) - USE THESE
- Resume/LinkedIn normalized data may have "identity" nested objects - extract name, location, linkedin_url from there
- Resume/LinkedIn skills may be nested under skills.verified_hard_skills, skills.all_keywords, skills.verified_skills, skills.all_skills
- Resume is the source of truth for work history, technical details, and verified skills
- LinkedIn provides soft skills, endorsements, and professional "vibe"
- GitHub validates technical skills - weight repos by stars and recency
- User metadata contains their explicit networking goals - preserve these exactly
- Merge duplicate information intelligently (don't repeat the same skill twice)

CRITICAL REQUIREMENTS:
1. **experience_log MUST be populated** - Extract ALL work experience from Resume.experience and LinkedIn.experience arrays. Format each as: "Role @ Company (StartDate-EndDate) - Detailed description with key achievements, metrics, and impact."
2. **voice_snippet MUST be ONLY the user's original voice_signature** - Use the exact text from userMetadata.voice_signature. Do NOT add any other text.
3. **project_list** - Include projects from Resume.projects (with tech_stack and metrics) AND GitHub repos formatted as: "Repo: name (Language) - Description with impact/stars if notable"
4. **interests** - Combine from all sources: LinkedIn about section, GitHub topics, user metadata interests
5. **Use the analysis layer** - If Resume or LinkedIn has analysis.seniority_level, analysis.primary_role, analysis.voice_tone - use these to inform the tagline and overall persona
6. **skills_possessed** - Prioritize verified_hard_skills and verified_skills over all_keywords/all_skills

OUTPUT SCHEMA:
{
  "identity": {
    "name": "First Last",
    "tagline": "Role @ Company | Previous Notable Role (use analysis.primary_role if available)",
    "location": "City, State/Country"
  },
  "analysis": {
    "seniority_level": "Junior/Mid/Senior/Staff/Founder/Student - from Resume/LinkedIn analysis",
    "primary_role": "Main job function - from Resume/LinkedIn analysis",
    "voice_tone": "Writing style - from Resume/LinkedIn analysis",
    "years_experience": "Number - from Resume/LinkedIn analysis"
  },
  "skills_possessed": ["Array of VERIFIED technical skills - prioritize verified_hard_skills/verified_skills"],
  "skills_desired": ["Array of skills they're looking for (from user metadata). Empty if not hiring/looking for cofounder."],
  "networking_goals": ["Array - preserve exactly from user metadata networking_goals"],
  "raw_assets": {
    "voice_snippet": "String - EXACTLY the user provided voice_signature from userMetadata, nothing else",
    "experience_log": ["Array - REQUIRED. Format: 'Role @ Company (Years) - Description with metrics and achievements'"],
    "project_list": ["Array - Include Resume projects with tech_stack/metrics AND GitHub repos"],
    "interests": ["Array - REQUIRED. Combine from LinkedIn, GitHub, and user metadata"]
  }
}
`;

    console.log("Final synthesis with Gemini");
    
    let finalPersona;
    try {
      const result = await flashModel.generateContent(synthesisPrompt);
      let responseText = result.response.text();
      
      console.log("Gemini response length:", responseText.length);
      console.log("Gemini response preview:", responseText.substring(0, 200));
      
      // Handle markdown code blocks if Gemini wraps JSON in them
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        console.log("Found JSON in markdown code block, extracting...");
        responseText = jsonMatch[1];
      }
      
      // Try to parse JSON, with better error handling
      try {
        finalPersona = JSON.parse(responseText);
        console.log("Successfully parsed persona JSON");
      } catch (parseError: any) {
        console.error("JSON parse error:", parseError.message);
        console.error("Full response text:", responseText);
        throw new Error(`Failed to parse persona JSON: ${parseError.message}. Response preview: ${responseText.substring(0, 500)}`);
      }
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError.message);
      console.error("Gemini error stack:", geminiError.stack);
      throw new Error(`Gemini API failed: ${geminiError.message}`);
    }

    // Extract tagline from persona
    const tagline = finalPersona?.identity?.tagline || null;

    // Merge persona skills with user-input skills (no duplicates)
    const existingSkills: string[] = user.skills || [];
    const personaSkills: string[] = finalPersona?.skills_possessed || [];
    const mergedSkills = [...new Set([...existingSkills, ...personaSkills])];

    // Validate persona structure before saving
    if (!finalPersona || typeof finalPersona !== 'object') {
      throw new Error("Invalid persona structure: persona is not an object");
    }
    
    console.log("Saving persona to database...");
    console.log("Persona keys:", Object.keys(finalPersona));
    
    // save to db
    const { error: updateError, data: updateData } = await supabase
      .from('users')
      .update({
        persona: finalPersona,
        tagline: tagline,
        skills: mergedSkills,
        ingestion_status: 'complete'
      })
      .eq('id', id)
      .select();

    if (updateError) {
      console.error("Database update error:", updateError);
      console.error("Update error details:", JSON.stringify(updateError, null, 2));
      throw new Error(`Database update failed: ${updateError.message} (code: ${updateError.code})`);
    }
    
    if (!updateData || updateData.length === 0) {
      throw new Error("Database update returned no rows - user may not exist");
    }
    
    console.log("Database update successful");

    console.log("Ingestion complete for:", id);
    console.log("Extracted tagline:", tagline);
    console.log("Merged skills:", mergedSkills.length);
    
    // Trigger auto-connect with all other users (fire-and-forget)
    // Use improved error handling and logging
    (async () => {
      try {
        let autoConnectUrl: string;
        try {
          const url = new URL(req.url);
          autoConnectUrl = `${url.protocol}//${url.host}/api/simulation/auto-connect`;
          console.log(`[Auto-connect] Constructed URL from request: ${autoConnectUrl}`);
        } catch (urlError) {
          const fallbackUrl = process.env.NEXT_PUBLIC_SITE_URL
          autoConnectUrl = `${fallbackUrl}/api/simulation/auto-connect`;
          console.log(`[Auto-connect] Using fallback URL: ${autoConnectUrl}`);
        }
        
        console.log(`[Auto-connect] Triggering for user ${id}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.error(`[Auto-connect] Request timed out after 30 seconds`);
        }, 30000); // 30 second timeout (simulations can take time)
        
        try {
          const response = await fetch(autoConnectUrl, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'User-Agent': 'Doppel-Ingest/1.0'
            },
            body: JSON.stringify({ userId: id }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log(`[Auto-connect] Success! Simulations run: ${data.simulationsRun || 0}, Total: ${data.total || 0}`);
            if (data.results && Array.isArray(data.results)) {
              const successful = data.results.filter((r: any) => r.success).length;
              const failed = data.results.filter((r: any) => !r.success).length;
              console.log(`[Auto-connect] Results: ${successful} successful, ${failed} failed`);
            }
          } else {
            const errorText = await response.text();
            console.error(`[Auto-connect] HTTP Error ${response.status}: ${errorText}`);
            console.error(`[Auto-connect] Response headers:`, Object.fromEntries(response.headers.entries()));
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error(`[Auto-connect] Request was aborted (likely timeout)`);
          } else {
            console.error(`[Auto-connect] Fetch error:`, fetchError.message);
            console.error(`[Auto-connect] Error stack:`, fetchError.stack);
            console.error(`[Auto-connect] Error name:`, fetchError.name);
            console.error(`[Auto-connect] Error cause:`, fetchError.cause);
          }
        }
      } catch (error: any) {
        console.error(`[Auto-connect] Unexpected error:`, error.message);
        console.error(`[Auto-connect] Error stack:`, error.stack);
      }
    })(); // Immediately invoke async function (fire-and-forget)
    
    return NextResponse.json({ success: true, persona: finalPersona });

  } catch (error: any) {
    console.error("🔥 Ingestion Failed:", error);
    console.error("Error stack:", error.stack);
    
    // Update ingestion_status to 'failed' so we can track issues
    if (userId) {
      try {
        await supabase
          .from('users')
          .update({ ingestion_status: 'failed' })
          .eq('id', userId);
      } catch (updateErr) {
        console.error("Failed to update ingestion_status:", updateErr);
      }
    }
    
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
    let responseText = result.response.text();
    
    // Handle markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }
    
    return JSON.parse(responseText);
  } catch (e: any) {
    console.error("Resume normalization error:", e.message);
    console.error("Response text:", e.response?.text?.() || "N/A");
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
    let responseText = result.response.text();
    
    // Handle markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }
    
    return JSON.parse(responseText);
  } catch (e: any) {
    console.error("LinkedIn normalization error:", e.message);
    console.error("Response text:", e.response?.text?.() || "N/A");
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
