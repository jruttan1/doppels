import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Init Clients - using service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- SCHEMAS ---

const voiceDnaSchema = {
  type: SchemaType.OBJECT,
  properties: {
    internal_monologue: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "3-5 thought fragments showing how they think."
    },
    conversation_voice: {
      type: SchemaType.OBJECT,
      properties: {
        tone: { type: SchemaType.STRING },
        message_style: { type: SchemaType.STRING },
        vocabulary: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        avoid: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      }
    }
  }
};

const personaSchema = {
  type: SchemaType.OBJECT,
  properties: {
    identity: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        tagline: { type: SchemaType.STRING, description: "Format: 'Role @ Company' (e.g. 'Engineer @ Stripe', 'Founder @ Acme'). Max 30 chars. No descriptions." },
        location: { type: SchemaType.STRING }
      },
      required: ["name", "tagline"]
    },
    analysis: {
      type: SchemaType.OBJECT,
      properties: {
        seniority_level: { type: SchemaType.STRING, description: "Junior, Mid, Senior, Staff, Founder, Student" },
        primary_role: { type: SchemaType.STRING, description: "e.g. Full Stack Engineer, Product Manager" },
        years_experience: { type: SchemaType.NUMBER }
      }
    },
    style: {
      type: SchemaType.OBJECT,
      properties: {
        internal_monologue: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            instruction: { type: SchemaType.STRING },
            sample_thought: { type: SchemaType.STRING }
          },
          required: ["instruction", "sample_thought"]
        },
        external_voice: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            instruction: { type: SchemaType.STRING },
            sample_reply: { type: SchemaType.STRING }
          },
          required: ["instruction", "sample_reply"]
        }
      },
      required: ["internal_monologue", "external_voice"]
    },
    knowledge: {
      type: SchemaType.OBJECT,
      properties: {
        experience_log: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        project_list: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        skills_possessed: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        interests: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      }
    },
    goals: {
      type: SchemaType.OBJECT,
      properties: {
        networking_objectives: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        dealbreakers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      }
    },
    raw_assets: {
      type: SchemaType.OBJECT,
      properties: {
        voice_snippet: { type: SchemaType.STRING }
      }
    }
  }
};

export interface IngestResult {
  success: boolean;
  persona?: any;
  error?: string;
}

/**
 * Core ingestion logic - synthesizes user data into a persona.
 * This function can be called directly (no HTTP auth needed) or via the API route.
 */
export async function runIngestion(userId: string): Promise<IngestResult> {
  try {
    console.log(`Starting ingestion for user: ${userId}`);

    // 1. FETCH USER DATA
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !user) {
      throw new Error(`User not found: ${fetchError?.message}`);
    }

    const normalizedResume = user.resume_normalized || null;
    const normalizedLinkedin = user.linkedin_normalized || null;
    const githubData = user.github_url ? await fetchGitHubData(user.github_url) : null;

    console.log("Normalized Resume:", normalizedResume ? "✓" : "✗");
    console.log("Normalized LinkedIn:", normalizedLinkedin ? "✓" : "✗");
    console.log("Github Data:", githubData ? "✓" : "✗");

    // 2. ANALYZE VOICE
    let voiceDna = null;
    const voiceSamples = user.voice_signature;
    if (voiceSamples && voiceSamples.length > 50) {
      console.log("Analyzing Voice DNA...");
      try {
        voiceDna = await analyzeVoiceDNA(voiceSamples);
        console.log("Voice DNA extracted.");
      } catch (e: any) {
        console.error("Voice DNA analysis error:", e.message);
      }
    }

    if (!normalizedResume && !normalizedLinkedin && !githubData && !user.networking_goals?.length) {
      console.warn("⚠️ No data sources available for persona creation");
    }

    const { resume_text, linkedin_text, resume_normalized, linkedin_normalized, github_url, persona, ...userMetadata } = user;

    // 3. SYNTHESIS
    const synthesisModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: personaSchema as any
      }
    });

    const synthesisPrompt = `
You are an expert technical recruiter and psychological profiler.

TASK:
Combine all data sources into a single "Digital Twin" persona JSON.
The "style" section is the most critical part—it must capture the user's dual personality (Internal vs. External).

DATA SOURCES:
User Metadata: ${JSON.stringify(userMetadata, null, 2)}
Resume: ${normalizedResume ? JSON.stringify(normalizedResume, null, 2) : "Not provided"}
LinkedIn: ${normalizedLinkedin ? JSON.stringify(normalizedLinkedin, null, 2) : "Not provided"}
GitHub: ${githubData ? JSON.stringify(githubData, null, 2) : "Not provided"}
Voice Analysis: ${voiceDna ? JSON.stringify(voiceDna, null, 2) : "Not provided"}

CRITICAL REQUIREMENTS:
1. **Tagline Format:** MUST be "Role @ Company" format. Examples: "Engineer @ Stripe", "PM @ Google", "Founder @ Acme". Max 30 characters. NO descriptions or expertise lists.
2. **The "Style" Split:** You must distinguish between how the user *thinks* (Internal) and how they *talk* (External).
   - Use the provided Voice Analysis to populate the 'style' block.
   - Internal Monologue: Cynical, raw, analytical.
   - External Voice: Professional, polished, but authentic.
3. **Analysis Block:** You MUST estimate seniority level and years of experience based on the resume.
4. **Experience Log:** Merge Resume & LinkedIn. Format: "Role @ Company (Dates) - High-impact details."
5. **Projects:** Merge Resume & GitHub. Format: "Name (Tech Stack) - Description."
`;

    console.log("Final synthesis with Gemini...");

    let finalPersona;
    try {
      const result = await synthesisModel.generateContent(synthesisPrompt);
      const text = result.response.text();
      finalPersona = cleanJson(text);
      console.log("Successfully parsed persona JSON");
    } catch (geminiError: any) {
      console.error("Gemini API error:", geminiError.message);
      throw new Error(`Gemini API failed: ${geminiError.message}`);
    }

    const tagline = finalPersona?.identity?.tagline || null;

    // Merge skills
    const existingSkills: string[] = user.skills || [];
    const personaSkills: string[] = finalPersona?.knowledge?.skills_possessed || [];
    const mergedSkills = [...new Set([...existingSkills, ...personaSkills])];

    console.log("Saving persona to database...");

    const { error: updateError } = await supabase
      .from('users')
      .update({
        persona: finalPersona,
        tagline: tagline,
        skills: mergedSkills,
        ingestion_status: 'complete'
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log("Ingestion complete for:", userId);
    return { success: true, persona: finalPersona };

  } catch (error: any) {
    console.error("🔥 Ingestion Failed:", error);
    await supabase.from('users').update({ ingestion_status: 'failed' }).eq('id', userId);
    return { success: false, error: error.message };
  }
}

// --- HELPERS ---

function cleanJson(text: string): any {
  try {
    const cleaned = text.replace(/```(?:json)?|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON Parse Error on text:", text);
    throw new Error("Failed to parse AI response as JSON");
  }
}

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
    return null;
  }
}

async function analyzeVoiceDNA(voiceSamples: string): Promise<any> {
  const voiceModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: voiceDnaSchema as any
    }
  });

  const prompt = `
You are analyzing writing samples to understand someone's communication style.

**INPUT SAMPLES:**
"""
${voiceSamples}
"""

**RULES - STAY GROUNDED:**
- Only describe patterns you can actually SEE in the samples. Don't invent personality traits.
- If the samples are short, the analysis should be short. Don't over-interpret.
- Prefer "neutral" or "unclear" over making stuff up.
- Real people are inconsistent. Don't force a single archetype.

**INSTRUCTIONS:**

1. **internal_monologue** (Example thoughts in their style):
   - Generate 2-3 brief thoughts that match HOW they write (sentence structure, word choice, punctuation).
   - Base these on patterns you actually see, not assumptions about their personality.
   - If samples are formal, thoughts should be formal. If casual, casual.

2. **conversation_voice** (How they communicate):
   - **tone:** Describe the actual tone you observe. Simple labels are fine: "casual", "direct", "friendly", "dry". Don't make up archetypes.
   - **message_style:** Note observable patterns only. Punctuation habits, sentence length, capitalization. If nothing stands out, say "standard".
   - **vocabulary:** List 3-5 actual words or phrases they use frequently. If no clear pattern, say "varied".
   - **avoid:** Only list things they explicitly seem to dislike based on the samples. If unclear, leave empty or say "unclear".

**GOAL:**
Create a grounded profile based on what's actually in the samples. Better to be accurate and simple than creative and wrong.
`;

  const result = await voiceModel.generateContent(prompt);
  return cleanJson(result.response.text());
}
