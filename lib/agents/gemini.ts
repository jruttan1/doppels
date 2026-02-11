import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Lazy initialization to ensure env vars are loaded
let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  if (!model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }
  return model;
}

export interface GenerateOptions {
  systemPrompt: string;
  conversationHistory: Array<{ speaker: string; text: string }>;
  userPrompt: string;
  config?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

export interface AnalysisResult {
  score: number;
  takeaways: string[];
  tone_score?: number;
  tone_notes?: string;
}

export interface PersonaVoice {
  name: string;
  voice_snippet: string;
}

/**
 * Generate content with Gemini, including exponential backoff retry for rate limits
 */
export async function generateWithRetry(
  options: GenerateOptions,
  maxRetries = 3
): Promise<string> {
  const model = getModel();

  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Build contents array with system prompt, history, and user prompt
      const contents = [
        { role: 'user' as const, parts: [{ text: options.systemPrompt }] },
        ...options.conversationHistory.slice(-6).map((msg, i) => ({
          role: (i % 2 === 0 ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: msg.text }],
        })),
        { role: 'user' as const, parts: [{ text: options.userPrompt }] },
      ];

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: options.config?.temperature ?? 0.8,
          maxOutputTokens: options.config?.maxOutputTokens ?? 200,
          topP: options.config?.topP ?? 0.9,
          topK: options.config?.topK ?? 30,
        },
      });

      return result.response.text();
    } catch (error: any) {
      const isRateLimit =
        error.message?.includes('429') ||
        error.message?.includes('quota') ||
        error.message?.includes('rate limit');

      if (isRateLimit) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        // Exponential backoff: 2s, 4s, 8s
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Analyze a conversation transcript and return score + takeaways
 * Optionally evaluates tone authenticity if personas are provided
 */
export async function analyzeTranscript(
  transcript: Array<{ speaker: string; text: string }>,
  personas?: { agentA?: PersonaVoice; agentB?: PersonaVoice }
): Promise<AnalysisResult> {
  const model = getModel();

  let retries = 0;
  const maxRetries = 3;

  // Build tone evaluation section if personas provided
  const toneSection = personas?.agentA?.voice_snippet || personas?.agentB?.voice_snippet
    ? `
TONE AUTHENTICITY EVALUATION:
${personas.agentA ? `Person A (${personas.agentA.name}) should sound like: "${personas.agentA.voice_snippet}"` : ''}
${personas.agentB ? `Person B (${personas.agentB.name}) should sound like: "${personas.agentB.voice_snippet}"` : ''}

Also score tone_score (0-100) based on:
- Did each person's messages match their voice profile? (word choice, energy, formality level, quirks)
- Did the tones complement each other or clash awkwardly?
- Did they sound like real humans with distinct personalities, or generic AI agents?
- Penalize: overly technical deep-dives that no normal person would have, generic "professional networking" voice, messages that all sound the same

Include "tone_notes" with a brief observation about the tone dynamics.
`
    : '';

  const jsonFormat = personas?.agentA || personas?.agentB
    ? '{ "score": number, "takeaways": ["string", "string", "string"], "tone_score": number, "tone_notes": "string" }'
    : '{ "score": number, "takeaways": ["string", "string", "string"] }';

  while (retries < maxRetries) {
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are evaluating a networking conversation to determine if these two people should actually connect.

Score this conversation from 0-100 based on REAL VALUE, not politeness:

- 80-100: Clear reason to stay in touch. Specific collaboration opportunity, shared problem they could solve together, or genuine mutual benefit.
- 60-79: Interesting overlap. They could learn from each other or might collaborate someday, but nothing concrete yet.
- 40-59: Pleasant but generic. They were friendly but didn't find anything specific to work on together.
- 20-39: Forced conversation. Polite but clearly no real overlap in what they care about.
- 0-19: Actively bad fit. They disagreed, talked past each other, or had nothing in common.

Be honest. Most random networking conversations are 40-60. Only score 70+ if there's a specific, concrete reason they'd benefit from connecting.
${toneSection}
Return JSON: ${jsonFormat}

TAKEAWAY FORMAT - These appear as small chips/tags in the UI. Make them punchy and specific:
- Max 6 words each. Shorter is better.
- No "both" or "they" - just state the connection point
- Sound like a friend texting you why you'd vibe with someone

Bad (too long/generic):
- "Both professionals are deeply involved in AI development"
- "struggling with deterministic outputs, hallucination"
- "both building LLM orchestration for pipelines"

Good (punchy, specific):
- "same RAG stack frustrations"
- "they're hiring engineers"
- "ex-Stripe, knows payments"
- "building in your space"
- "wants intros to VCs"
- "uses your favorite tools"

TRANSCRIPT:
${JSON.stringify(transcript)}`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      });

      return JSON.parse(result.response.text());
    } catch (error: any) {
      const isRateLimit =
        error.message?.includes('429') ||
        error.message?.includes('quota') ||
        error.message?.includes('rate limit');

      if (isRateLimit) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Max retries exceeded');
}
