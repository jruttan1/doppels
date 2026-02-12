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
 * @param currentUserName - The name of the user viewing results (takeaways will be about the OTHER person)
 */
export async function analyzeTranscript(
  transcript: Array<{ speaker: string; text: string }>,
  personas?: { agentA?: PersonaVoice; agentB?: PersonaVoice },
  currentUserName?: string,
  otherPersonName?: string
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
                text: `${currentUserName && otherPersonName ? `### STOP - READ THIS FIRST
**${currentUserName}** is reading this report.
**${otherPersonName}** is who they talked to.

EVERY TAKEAWAY MUST BE ABOUT ${otherPersonName.toUpperCase()}, NOT ${currentUserName.toUpperCase()}.

WRONG (about ${currentUserName} - INSTANT FAIL):
- Anything about ${currentUserName}'s job, role, company, skills, or projects

RIGHT (about ${otherPersonName} - what we want):
- What ${otherPersonName} does for work
- What ${otherPersonName} is looking for
- Why ${currentUserName} should follow up with ${otherPersonName}

If a takeaway describes ${currentUserName} instead of ${otherPersonName}, you have FAILED.

` : ''}### ROLE
You are evaluating a networking transcript. Why should ${currentUserName || 'the viewer'} follow up with ${otherPersonName || 'the other person'}?
${goalsSection}${toneSection}

### SCORING (Value Over Politeness)
- 80-100: **High ROI.** Specific "give/get" identified (e.g., money, hires, specific intros).
- 60-79: **Warm Lead.** High overlap in niche, but no immediate "ask" or "offer."
- 40-59: **Coffee Chat Tier.** Friendly, but no business reason to meet again.
- 0-39: **Dead End.** No overlap, total mismatch, or generic small talk.

### TAKEAWAYS = WHO IS THIS PERSON + WHY CARE
3 phrases (8-12 words each) about ${otherPersonName || 'the other person'}. Answer: "Who is this and why should I email them?"

**YOU ARE FAILING IF YOU WRITE:**
- Conversation topics ("discussing ML ops", "exploring kubernetes") ← NO
- Tech skills ("works with postgres", "full-stack development") ← NO
- Generic descriptions ("deployment challenges", "CI/CD pipelines") ← NO

**CORRECT - ABOUT THE PERSON:**
- "hiring senior engineers, mentioned $150k+ budget"
- "ex-Stripe engineer, built their payments infrastructure"
- "actively looking for a technical cofounder"
- "well-connected, can intro to YC partners"
- "needs ML help for their startup, has budget"
- "runs a 50-person fintech, scaling fast"

**THE QUESTION:** If I asked "who's ${otherPersonName || 'this person'}?", would your answer make sense?
- "deployment challenges" ← NO, that's a topic not a person
- "CTO at fintech startup, hiring" ← YES, that's who they are

If no clear opportunity emerged, return: ["no clear opportunity"]

Return JSON: ${jsonFormat}

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
