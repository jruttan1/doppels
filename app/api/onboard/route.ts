import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ============================================================================
// RESUME SCHEMA - Structured extraction for Doppel Agent network
// ============================================================================
const resumeSchema = {
  description: "Structured extraction of a user's resume for the Doppel Agent network.",
  type: SchemaType.OBJECT,
  properties: {
    raw_text: {
      type: SchemaType.STRING,
      description: "The full extracted text from the PDF preserving structure"
    },
    identity: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        email: { type: SchemaType.STRING },
        phone: { type: SchemaType.STRING },
        linkedin_url: { type: SchemaType.STRING },
        location: { type: SchemaType.STRING },
      },
      required: ["name"]
    },
    analysis: {
      type: SchemaType.OBJECT,
      description: "Doppel's analysis layer - insights derived from the resume",
      properties: {
        seniority_level: {
          type: SchemaType.STRING,
          description: "Career level: Junior, Mid, Senior, Staff, Founder, or Student"
        },
        primary_role: {
          type: SchemaType.STRING,
          description: "Main job function, e.g. Full Stack Engineer, Product Manager, Data Scientist"
        },
        voice_tone: {
          type: SchemaType.STRING,
          description: "Writing style: Academic, Hacker, Corporate, Enthusiastic, Technical, Casual"
        },
        years_experience: {
          type: SchemaType.NUMBER,
          description: "Total years of professional experience"
        }
      },
      required: ["seniority_level", "primary_role"]
    },
    skills: {
      type: SchemaType.OBJECT,
      properties: {
        verified_hard_skills: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Only skills with PROOF in the resume (used in projects, mentioned in experience)"
        },
        all_keywords: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "All technical keywords and skills mentioned"
        }
      }
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          start_date: { type: SchemaType.STRING },
          end_date: { type: SchemaType.STRING },
          location: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          highlights: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Key achievements with metrics if available"
          }
        },
        required: ["company", "role"]
      }
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          tech_stack: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Technologies used in this project"
          },
          metrics: {
            type: SchemaType.STRING,
            description: "Any stats like '10k users', '1st place', '50 stars'"
          }
        },
        required: ["name"]
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
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ["raw_text", "identity", "analysis", "skills", "experience", "projects"]
};

// ============================================================================
// LINKEDIN SCHEMA - Structured extraction for LinkedIn profiles
// ============================================================================
const linkedinSchema = {
  description: "Structured extraction of a LinkedIn profile for the Doppel Agent network.",
  type: SchemaType.OBJECT,
  properties: {
    raw_text: {
      type: SchemaType.STRING,
      description: "The full extracted text from the PDF preserving structure"
    },
    identity: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
        headline: { type: SchemaType.STRING, description: "LinkedIn headline" },
        linkedin_url: { type: SchemaType.STRING },
        location: { type: SchemaType.STRING },
        about: { type: SchemaType.STRING, description: "About/Summary section" }
      },
      required: ["name"]
    },
    analysis: {
      type: SchemaType.OBJECT,
      description: "Doppel's analysis layer - insights derived from the profile",
      properties: {
        seniority_level: {
          type: SchemaType.STRING,
          description: "Career level: Junior, Mid, Senior, Staff, Founder, or Student"
        },
        primary_role: {
          type: SchemaType.STRING,
          description: "Main job function derived from headline and experience"
        },
        voice_tone: {
          type: SchemaType.STRING,
          description: "Writing style from About section: Academic, Hacker, Corporate, Enthusiastic"
        },
        years_experience: {
          type: SchemaType.NUMBER,
          description: "Total years of professional experience"
        },
        network_strength: {
          type: SchemaType.STRING,
          description: "Indicator of network size/engagement if visible: Small, Medium, Large"
        }
      },
      required: ["seniority_level", "primary_role"]
    },
    skills: {
      type: SchemaType.OBJECT,
      properties: {
        verified_skills: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Skills with endorsements or used in experience"
        },
        all_skills: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "All listed skills"
        },
        top_endorsements: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Most endorsed skills if visible"
        }
      }
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          duration: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING }
        },
        required: ["company", "role"]
      }
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          contributors: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
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
          field: { type: SchemaType.STRING }
        }
      }
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    volunteer: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    recommendations_summary: {
      type: SchemaType.STRING,
      description: "Summary of any recommendations if present"
    }
  },
  required: ["raw_text", "identity", "analysis", "skills", "experience"]
};

// ============================================================================
// GEMINI MODELS
// ============================================================================

// Model for resume extraction with schema validation
const resumeModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: resumeSchema as any
  }
});

// Model for LinkedIn extraction with schema validation
const linkedinModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: linkedinSchema as any
  }
});

export const maxDuration = 60;

// Extract and normalize Resume PDF using schema-validated Gemini model
async function extractAndNormalizeResume(base64: string): Promise<{ raw: string; normalized: any } | null> {
  try {
    console.log("Extracting and normalizing resume PDF with schema validation...");

    const result = await resumeModel.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64
        }
      },
      {
        text: `Extract ALL content from this resume PDF.

IMPORTANT INSTRUCTIONS:
1. Extract the complete raw text preserving structure
2. Identify the person's identity (name, email, phone, linkedin, location)
3. ANALYZE their career: determine seniority level, primary role, voice/writing tone, years of experience
4. For SKILLS: separate verified skills (actually used in projects/experience) from all keywords mentioned
5. Extract ALL work experience with company, role, dates, descriptions, and key achievements
6. Extract ALL projects with tech stacks and any metrics (users, stars, awards)
7. Extract education and certifications

Be thorough and preserve specific metrics, technologies, and achievements.`
      }
    ]);

    const parsed = JSON.parse(result.response.text());

    console.log(`Resume extracted: ${parsed.raw_text?.length || 0} chars`);
    console.log(`  - Analysis: ${parsed.analysis?.seniority_level} ${parsed.analysis?.primary_role}`);
    console.log(`  - Experience: ${parsed.experience?.length || 0} roles`);
    console.log(`  - Skills: ${parsed.skills?.verified_hard_skills?.length || 0} verified, ${parsed.skills?.all_keywords?.length || 0} total`);

    return {
      raw: parsed.raw_text || '',
      normalized: parsed
    };
  } catch (e: any) {
    console.error("Resume extraction/normalization error:", e.message);
    console.error("Error stack:", e.stack);
    return null;
  }
}

// Extract and normalize LinkedIn PDF using schema-validated Gemini model
async function extractAndNormalizeLinkedin(base64: string): Promise<{ raw: string; normalized: any } | null> {
  try {
    console.log("Extracting and normalizing LinkedIn PDF with schema validation...");

    const result = await linkedinModel.generateContent([
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64
        }
      },
      {
        text: `Extract ALL content from this LinkedIn profile PDF.

IMPORTANT INSTRUCTIONS:
1. Extract the complete raw text preserving structure
2. Identify the person's identity (name, headline, linkedin URL, location, about section)
3. ANALYZE their career: determine seniority level, primary role, voice/writing tone, years of experience, network strength
4. For SKILLS: identify verified skills (endorsed or demonstrated), all skills, and top endorsements
5. Extract ALL work experience - focus on tech-related roles, include descriptions
6. Extract projects with contributors if listed
7. Extract education, certifications, and volunteer work
8. Summarize any recommendations if present

Focus on tech-related experiences. Be thorough with details.`
      }
    ]);

    const parsed = JSON.parse(result.response.text());

    console.log(`LinkedIn extracted: ${parsed.raw_text?.length || 0} chars`);
    console.log(`  - Analysis: ${parsed.analysis?.seniority_level} ${parsed.analysis?.primary_role}`);
    console.log(`  - Experience: ${parsed.experience?.length || 0} roles`);
    console.log(`  - Skills: ${parsed.skills?.verified_skills?.length || 0} verified, ${parsed.skills?.all_skills?.length || 0} total`);

    return {
      raw: parsed.raw_text || '',
      normalized: parsed
    };
  } catch (e: any) {
    console.error("LinkedIn extraction/normalization error:", e.message);
    console.error("Error stack:", e.stack);
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
      xUrl,
      googleCalendarUrl,
      networkingGoals,
      voiceSignature,
      interests, // Soft interests - hobbies, passions (skills come from documents)
      skillsDesired, // For hiring: skills they're looking for
      locationDesired,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    console.log(`Processing onboarding for user: ${userId}`);

    // Parse and normalize PDFs server-side
    let resumeText: string | null = null;
    let resumeNormalized: any = null;
    let linkedinText: string | null = null;
    let linkedinNormalized: any = null;
    let extractedLinkedinUrl: string | null = null;

    // Process resume and LinkedIn in parallel
    const [resumeResult, linkedinResult] = await Promise.all([
      resumeBase64 ? extractAndNormalizeResume(resumeBase64) : Promise.resolve(null),
      linkedinBase64 ? extractAndNormalizeLinkedin(linkedinBase64) : Promise.resolve(null)
    ]);

    if (resumeResult) {
      resumeText = resumeResult.raw;
      resumeNormalized = resumeResult.normalized;
      console.log(`Parsed resume: ${resumeText?.length || 0} chars, normalized: ${!!resumeNormalized}`);

      // Extract LinkedIn URL from resume identity if present
      if (resumeNormalized?.identity?.linkedin_url) {
        extractedLinkedinUrl = resumeNormalized.identity.linkedin_url;
      }
    }

    if (linkedinResult) {
      linkedinText = linkedinResult.raw;
      linkedinNormalized = linkedinResult.normalized;
      console.log(`Parsed LinkedIn: ${linkedinText?.length || 0} chars, normalized: ${!!linkedinNormalized}`);

      // Extract LinkedIn URL from LinkedIn PDF identity (takes priority)
      if (linkedinNormalized?.identity?.linkedin_url) {
        extractedLinkedinUrl = linkedinNormalized.identity.linkedin_url;
      }
    }

    // Save to database with normalized data
    // Note: skills_possessed will be populated from document parsing (resume_normalized/linkedin_normalized)
    // interests are soft/personal interests collected manually
    const { error: updateError } = await supabase
      .from('users')
      .update({
        resume_text: resumeText,
        resume_normalized: resumeNormalized,
        linkedin_text: linkedinText,
        linkedin_normalized: linkedinNormalized,
        linkedin_url: extractedLinkedinUrl,
        github_url: githubUrl || null,
        x_url: xUrl || null,
        google_calendar_url: googleCalendarUrl || null,
        networking_goals: networkingGoals || [],
        voice_signature: voiceSignature || null,
        interests: interests || [], // Soft interests (hobbies, passions)
        skills_desired: skillsDesired || [], // For hiring: skills they want
        location_desired: locationDesired || [],
        ingestion_status: 'pending',
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log("Onboarding data saved, triggering ingestion...");

    // Trigger ingestion - MUST await for serverless environments (Vercel)
    // Fire-and-forget doesn't work because the serverless function terminates after response
    let ingestUrl: string;
    try {
      const url = new URL(req.url);
      ingestUrl = `${url.protocol}//${url.host}/api/ingest`;
    } catch (urlError: any) {
      console.error("Failed to construct ingestion URL:", urlError.message);
      // Fallback to environment variable
      const fallbackBase = process.env.NEXT_PUBLIC_SITE_URL 
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
      
      if (!fallbackBase) {
        console.error("No valid ingestion URL available");
        return NextResponse.json({ success: true, warning: "Ingestion not triggered - manual trigger required" });
      }
      ingestUrl = `${fallbackBase}/api/ingest`;
    }
    
    console.log(`Triggering ingestion at: ${ingestUrl}`);
    
    try {
      const ingestRes = await fetch(ingestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      
      if (!ingestRes.ok) {
        const errorText = await ingestRes.text();
        console.error(`Ingestion API returned error: ${ingestRes.status} ${ingestRes.statusText}`);
        console.error("Ingestion error response:", errorText);
        // Still return success for onboarding, but note ingestion failed
        return NextResponse.json({ 
          success: true, 
          warning: "Profile saved but persona generation failed. It will be retried.",
          ingestionError: errorText 
        });
      }
      
      const ingestData = await ingestRes.json();
      console.log("Ingestion completed successfully:", ingestData.success);
      
      return NextResponse.json({ success: true, ingestion: ingestData.success });
    } catch (ingestError: any) {
      console.error("Ingestion trigger failed:", ingestError.message);
      console.error("Ingestion error stack:", ingestError.stack);
      // Onboarding data is saved, persona can be generated later
      return NextResponse.json({ 
        success: true, 
        warning: "Profile saved but persona generation failed. It will be retried." 
      });
    }

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
