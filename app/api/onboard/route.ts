import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

// PDF text extraction using pdf-parse node build
async function extractPdfText(base64: string): Promise<string | null> {
  try {
    // Use the node-specific build which handles worker setup
    const { PDFParse } = await import('pdf-parse/dist/node/esm/index.js');
    const buffer = Buffer.from(base64, 'base64');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const text = result.pages.map((p: { text: string }) => p.text).join('\n\n').trim();
    return text || null;
  } catch (e: any) {
    console.error("PDF parse error:", e.message);
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
      voiceSignature,
      skills,
      skillsDesired,
      locationDesired,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    console.log(`Processing onboarding for user: ${userId}`);

    // Parse PDFs server-side
    let resumeText: string | null = null;
    let linkedinText: string | null = null;

    if (resumeBase64) {
      resumeText = await extractPdfText(resumeBase64);
      console.log(`Parsed resume: ${resumeText?.length || 0} chars`);
    }

    if (linkedinBase64) {
      linkedinText = await extractPdfText(linkedinBase64);
      console.log(`Parsed LinkedIn: ${linkedinText?.length || 0} chars`);
    }

    // Save to database (only columns that exist in the table)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        resume_text: resumeText,
        linkedin_text: linkedinText,
        github_url: githubUrl || null,
        networking_goals: networkingGoals || [],
        voice_signature: voiceSignature || null,
        skills: skills || [],
        skills_desired: skillsDesired || [],
        location_desired: locationDesired || [],
        ingestion_status: 'pending',
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log("Onboarding data saved, triggering ingestion...");

    // Trigger ingestion (don't await - let it run in background)
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId }),
    }).catch(e => console.error("Ingestion trigger failed:", e));

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
