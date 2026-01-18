import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface AgentPersona {
  id: string;
  name: string;
  identity?: {
    name?: string;
    tagline?: string;
    location?: string;
  };
  networking_goals?: string[];
  skills_possessed?: string[];
  skills_desired?: string[];
  raw_assets?: {
    voice_snippet?: string;
    experience_log?: string[];
    project_list?: string[];
    interests?: string[];
  };
  [key: string]: any;
}

export class DoppelAgent {
  public id: string;
  public name: string;
  private persona: AgentPersona;
  private conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = [];

  constructor(persona: AgentPersona) {
    this.id = persona.id;
    this.name = persona.identity?.name || persona.name || 'User';
    this.persona = persona;
  }

  async reply(lastMessage: string | null): Promise<string> {
    try {
      // Build context from persona
      const voiceSnippet = this.persona.raw_assets?.voice_snippet || '';
      const networkingGoals = this.persona.networking_goals || [];
      const skills = this.persona.skills_possessed || [];
      const interests = this.persona.raw_assets?.interests || [];
      const tagline = this.persona.identity?.tagline || '';
      const location = this.persona.identity?.location || '';

      // Build system prompt
      const systemPrompt = `You are ${this.name}, a real person networking on Doppel. 

ABOUT YOU:
${tagline ? `Tagline: ${tagline}` : ''}
${location ? `Location: ${location}` : ''}
${skills.length > 0 ? `Skills: ${skills.join(', ')}` : ''}
${interests.length > 0 ? `Interests: ${interests.join(', ')}` : ''}
${networkingGoals.length > 0 ? `Networking Goals: ${networkingGoals.join(', ')}` : ''}

COMMUNICATION STYLE:
${voiceSnippet ? `Your voice signature: "${voiceSnippet}"\n\nWrite naturally in this style. Match the tone, formality, and personality shown in your voice signature.` : 'Be authentic, friendly, and professional. Write naturally as yourself.'}

INSTRUCTIONS:
- Write a brief, natural message (1-3 sentences max)
- Be authentic to your personality and communication style
- If this is the first message, introduce yourself briefly and mention your networking goals
- If responding, acknowledge what was said and continue the conversation naturally
- Keep it conversational and human-like
- If the conversation feels complete or you've achieved your goal, you can end with "[END_CONVERSATION]"
- Don't be overly formal or robotic`;

      // Add conversation history
      if (lastMessage) {
        this.conversationHistory.push({ role: 'user', parts: lastMessage });
      }

      // Build prompt
      const prompt = lastMessage 
        ? `The other person just said: "${lastMessage}"\n\nRespond naturally as ${this.name}.`
        : `Start a conversation as ${this.name}. Introduce yourself briefly and mention what you're looking for.`;

      // Generate reply with retry logic for rate limits
      let result;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          result = await model.generateContent({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              ...this.conversationHistory.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.parts }]
              })),
              { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 200
            }
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
            retries++;
            if (retries >= maxRetries) {
              throw error;
            }
            // Exponential backoff: wait 2^retries seconds (2s, 4s, 8s)
            const waitTime = Math.pow(2, retries) * 1000;
            console.log(`Rate limit hit, retrying in ${waitTime/1000}s... (attempt ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error; // Not a rate limit error, throw immediately
          }
        }
      }

      const reply = result!.response.text().trim();
      
      // Add reply to history
      this.conversationHistory.push({ role: 'model', parts: reply });

      return reply;

    } catch (error: any) {
      console.error(`Error generating reply for ${this.name}:`, error);
      return `Hi! I'm ${this.name}. Nice to meet you!`;
    }
  }
}
