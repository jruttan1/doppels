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
  networking_goals?: string[];
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

  // Build networking goals section - THIS IS THE MOST IMPORTANT FACTOR
  const goalsSection = personas?.agentA?.networking_goals || personas?.agentB?.networking_goals
    ? `
CRITICAL - NETWORKING GOALS (Weight this heavily in scoring):
${personas.agentA?.networking_goals?.length ? `${personas.agentA.name}'s goals: ${personas.agentA.networking_goals.join(', ')}` : ''}
${personas.agentB?.networking_goals?.length ? `${personas.agentB.name}'s goals: ${personas.agentB.networking_goals.join(', ')}` : ''}

The PRIMARY question is: Does this conversation help either person achieve their networking goals?
- If Person A wants to "find a cofounder" and Person B could be that cofounder → high score
- If Person A wants to "hire engineers" and Person B is an engineer looking for work → high score
- If goals are completely misaligned (one wants to fundraise, other has nothing to offer) → low score
- Pleasant conversation but no goal alignment → mediocre score at best (40-55)
`
    : '';

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
                text: `### ROLE
You are a cynical, high-stakes Executive Talent Scout. You are evaluating a networking transcript to determine if a follow-up is a high-value use of time or a polite waste of breath.

### SCORING (Value Over Politeness)
- 80-100: **High ROI.** Specific "give/get" identified (e.g., money, hires, specific intros).
- 60-79: **Warm Lead.** High overlap in niche, but no immediate "ask" or "offer."
- 40-59: **Coffee Chat Tier.** Friendly, but no business reason to meet again.
- 0-39: **Dead End.** No overlap, total mismatch, or generic small talk.

### TAKEAWAY CONSTRAINTS (The "Density" Rules)
Provide 3-5 takeaways. Each must be a **single, punchy line** (approx. 5-10 words). 

**The Subject Line Test:** Every takeaway must be specific enough to function as a high-context email subject line or a text message to a business partner.

**STRICT PROHIBITIONS:**
1. **NO Vague Nouns:** "infrastructure", "stack", "processes", "growth", "strategy", "solutions."
2. **NO Empty Adjectives:** "heavy", "complex", "interesting", "passionate", "senior."
3. **NO "Shared" or "Both":** Do not highlight similarities; highlight unique assets or needs.

**REQUIRED LOGIC (Asset/Need Model):**
Every takeaway must anchor to a **Hard Asset** (what they have) or a **Hard Need** (what they want).
- *Bad:* "Has experience with scaling startups." (Too vague)
- *Good:* "Scaled Stripe's EMEA sales team from 0 to 50."
- *Bad:* "Needs help with their cloud setup." (Too vague)
- *Good:* "Seeking architect to migrate legacy AWS to serverless."

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
