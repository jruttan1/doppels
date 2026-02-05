import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Configuration

export const maxDuration = 60; // Vercel timeout limit

const unifiedProfileSchema = {
  description: "A synthesized 'Golden Record' user profile combining Resume and LinkedIn data.",
  type: SchemaType.OBJECT,
  properties: {
    raw_text_summary: {
      type: SchemaType.STRING,
      description: "A combined summary of the raw text from both sources."
    },
    identity: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        email: { type: SchemaType.STRING },
        linkedin_url: { type: SchemaType.STRING },
        github_url: { type: SchemaType.STRING },
        portfolio_url: { type: SchemaType.STRING },
        location: { type: SchemaType.STRING },
        tagline: { type: SchemaType.STRING, description: "A 1-sentence professional hook." }
      },
      required: ["name", "tagline"]
    },
    analysis: {
      type: SchemaType.OBJECT,
      description: "Doppel's inference layer",
      properties: {
        seniority_level: {
          type: SchemaType.STRING,
          enum: ["Student", "Junior", "Mid", "Senior", "Staff", "Founder"]
        },
        primary_role: { type: SchemaType.STRING },
        voice_tone: {
          type: SchemaType.STRING,
          description: "Detected writing style: e.g. 'Hacker', 'Corporate', 'Academic'"
        },
        years_experience: { type: SchemaType.NUMBER },
        data_quality_notes: { type: SchemaType.STRING }
      },
      required: ["seniority_level", "primary_role"]
    },
    skills: {
      type: SchemaType.OBJECT,
      properties: {
        verified_hard_skills: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Skills explicitly used in a Project or Work Experience bullet point."
        },
        all_keywords: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        }
      },
      required: ["verified_hard_skills"]
    },
    experience: {
      type: SchemaType.ARRAY,
      description: "Merged work history. LinkedIn dates take priority.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          start_date: { type: SchemaType.STRING },
          end_date: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          highlights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        }
      }
    },
    projects: {
      type: SchemaType.ARRAY,
      description: "Merged project list from Resume + LinkedIn Featured section.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          tech_stack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          metrics: { type: SchemaType.STRING, description: "Stars, Users, Revenue, etc." },
          source: { type: SchemaType.STRING, enum: ["Resume", "LinkedIn", "Both"] }
        }
      }
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          school: { type: SchemaType.STRING },
          degree: { type: SchemaType.STRING },
          field: { type: SchemaType.STRING },
          year: { type: SchemaType.STRING }
        }
      }
    }
  },
  required: ["identity", "analysis", "skills", "experience", "projects"]
};

const unifiedModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: unifiedProfileSchema as any
  }
});

async function parseUnifiedProfile(resumeBase64: string | null, linkedinBase64: string | null) {
  // CRITICAL FIX: Guard against missing files
  if (!resumeBase64 && !linkedinBase64) {
    console.warn("No documents provided to parser.");
    return null;
  }

  try {
    console.log("Starting Unified Gemini Ingestion...");
    
    const parts: any[] = [];
    let instructions = `
    You are the Chief Talent Architect for the Doppel Network.
    You have been provided with one or more sources of data for a user.
    
    **YOUR GOAL:** Create a single, deduplicated "Golden Record" JSON profile.
    `;

    if (resumeBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: resumeBase64
        }
      });
      instructions += `\n- SOURCE 1: Resume PDF (Treat as ground truth for technical details and specific bullet points).`;
    }

    if (linkedinBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: linkedinBase64
        }
      });
      instructions += `\n- SOURCE 2: LinkedIn Profile PDF (Treat as ground truth for Dates, Titles, and Social Proof metrics).`;
    }

    instructions += `
    **CRITICAL SYNTHESIS RULES:**

    1. **The "Bouncer" Rule (Skill Verification):**
       - Populate "verified_hard_skills" ONLY with technologies that are backed by evidence in EITHER source.
       - Evidence means: The skill is used in a specific Project description OR a specific Work Experience bullet point.
       - If a user lists "Rust" in a skills list but never mentions using it in a job or project, put it in "all_keywords" but NOT in "verified_hard_skills".

    2. **Conflict Resolution:**
       - **Dates:** If Resume and LinkedIn dates conflict, trust LinkedIn (usually more current).
       - **Titles:** If Resume says "Founder" but LinkedIn says "Freelancer", trust the more modest title unless specific revenue/user metrics are found.
       - **Merging:** Do not list the same job twice. Merge the descriptions to capture the most detail.

    3. **Tone Analysis:**
       - Read the summary and bullet points. Are they formal ("Spearheaded initiatives") or a builder ("Shipped v1 in 2 days")?
       - Set "voice_tone" to: "Hacker", "Corporate", "Academic", or "Student".
    `;

    parts.push({ text: instructions });

    const result = await unifiedModel.generateContent(parts);
    const parsed = JSON.parse(result.response.text());

    console.log(`Unified Parsing Complete.`);
    console.log(`- Role: ${parsed.analysis?.primary_role}`);
    console.log(`- Seniority: ${parsed.analysis?.seniority_level}`);

    return parsed;

  } catch (e: any) {
    console.error("Unified Parsing Error:", e.message);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const {
      userId,
      resumeBase64,
      linkedinBase64,
      githubUrl,
      networkingGoals,
      skillsDesired,
      locationDesired,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Parse Data (if files exist)
    let unifiedProfile = null;
    if (resumeBase64 || linkedinBase64) {
      unifiedProfile = await parseUnifiedProfile(resumeBase64, linkedinBase64);
      
      if (!unifiedProfile) {
        throw new Error("Failed to parse profile documents.");
      }
    }

    // 2. Prepare Update Object
    const updatePayload: any = {
      github_url: githubUrl || null,
      networking_goals: networkingGoals || [],
      skills_desired: skillsDesired || [],
      location_desired: locationDesired || [],
      ingestion_status: 'completed',
    };

    // If we parsed files, add that data to the payload
    if (unifiedProfile) {
      updatePayload.resume_normalized = unifiedProfile;
      if (linkedinBase64) {
        updatePayload.linkedin_normalized = unifiedProfile;
      }
      updatePayload.linkedin_url = unifiedProfile.identity?.linkedin_url || null;
      updatePayload.skills = unifiedProfile.skills?.verified_hard_skills || [];
      updatePayload.voice_signature = unifiedProfile.analysis?.voice_tone || "Neutral";
      
      // If user didn't provide GitHub manually, try to find it in the PDF
      if (!githubUrl && unifiedProfile.identity?.github_url) {
        updatePayload.github_url = unifiedProfile.identity.github_url;
      }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log("Onboarding data saved successfully.");

    // 3. Trigger Vector Ingestion (Embedding)
    let ingestUrl: string;
    try {
      const url = new URL(req.url);
      ingestUrl = `${url.protocol}//${url.host}/api/ingest`;
    } catch (urlError) {
      const fallbackBase = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_URL}`;
      ingestUrl = `${fallbackBase}/api/ingest`;
    }

    // We await this to ensure the process starts, but we don't block heavily
    const ingestRes = await fetch(ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId }),
    });

    if (!ingestRes.ok) {
       console.warn("Ingestion trigger warning:", await ingestRes.text());
       // We still return success because the user data IS saved, 
       // but we might want to log this for the admin.
    }

    return NextResponse.json({ 
      success: true, 
      profile: unifiedProfile 
    });

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}