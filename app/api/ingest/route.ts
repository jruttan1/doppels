import { NextResponse } from 'next/server';
import { verifyAuthForUser } from '@/lib/auth/verify';
import { runIngestion } from '@/lib/ingestion/ingest';

export const maxDuration = 60;

/**
 * POST /api/ingest
 * Triggers persona ingestion for a user.
 * Requires authentication - the caller must be the user being ingested.
 */
export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Strict auth check - no fallback bypass
    const auth = await verifyAuthForUser(id);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Run ingestion using shared function
    const result = await runIngestion(id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, persona: result.persona });

  } catch (error: any) {
    console.error("🔥 Ingest API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
