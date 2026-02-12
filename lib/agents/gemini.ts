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
  currentUserName?: string
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
${goalsSection}${toneSection}
${currentUserName ? `### CRITICAL: WHO IS THE VIEWER
The person viewing these results is: **${currentUserName}**
All takeaways MUST be about the OTHER person in the conversation, NOT ${currentUserName}.
${currentUserName} already knows about themselves. They want to know why the OTHER person is worth connecting with.

WRONG: "${currentUserName} has LLM experience" (they already know this!)
RIGHT: "They're hiring ML engineers" (useful info about the other person)
` : ''}

### SCORING (Value Over Politeness)
- 80-100: **High ROI.** Specific "give/get" identified (e.g., money, hires, specific intros).
- 60-79: **Warm Lead.** High overlap in niche, but no immediate "ask" or "offer."
- 40-59: **Coffee Chat Tier.** Friendly, but no business reason to meet again.
- 0-39: **Dead End.** No overlap, total mismatch, or generic small talk.

### TAKEAWAY FORMAT
Each takeaway is a SHORT string (5-10 words max) displayed as a UI chip. NO explanations. NO "so what" reasoning. Just the fact.

**BANNED (instant fail):**
- "Has full-stack experience with React/Node" (generic tech)
- "Works on scalability challenges" (vague)
- "Prefers monolithic architecture" (who cares)
- "Has experience with X" (too vague)
- Any takeaway longer than 10 words
- Any takeaway with "So what?" explanation included

**GOOD (copy this exact style):**
- "hiring backend devs, $180k budget"
- "ex-Stripe, built their billing system"
- "looking for cofounder, has $50k saved"
- "knows Sequoia partners personally"
- "built same auth system you need"
- "their startup is hiring your role"

**CRITICAL RULES:**
1. MAX 10 words per takeaway. Short fragments only.
2. Must reference something SPECIFIC from the conversation
3. Must imply why ${currentUserName || 'the viewer'} should care
4. NO generic tech/experience statements
5. If nothing actionable was said, return: ["No clear opportunity identified"]

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
