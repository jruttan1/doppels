import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with error handling
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
} catch (error) {
  console.error("Failed to initialize Gemini AI:", error);
}

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
      // Extract all persona data
      const voiceSnippet = this.persona.raw_assets?.voice_snippet || '';
      const networkingGoals = this.persona.networking_goals || [];
      const skills = this.persona.skills_possessed || [];
      const skillsDesired = this.persona.skills_desired || [];
      const interests = this.persona.raw_assets?.interests || [];
      const experienceLog = this.persona.raw_assets?.experience_log || [];
      const projectList = this.persona.raw_assets?.project_list || [];
      const tagline = this.persona.identity?.tagline || '';
      const location = this.persona.identity?.location || '';

      // Build natural system prompt
      const systemPrompt = `You are ${this.name}. You're chatting with someone you might want to connect with professionally.

About you:
${tagline ? `- ${tagline}` : ''}
${location ? `- Based in ${location}` : ''}
${experienceLog.length > 0 ? `- Background: ${experienceLog.slice(0, 2).join('; ')}` : ''}
${projectList.length > 0 ? `- Working on: ${projectList.slice(0, 2).join(', ')}` : ''}
${skills.length > 0 ? `- Good at: ${skills.slice(0, 5).join(', ')}` : ''}
${interests.length > 0 ? `- Into: ${interests.slice(0, 4).join(', ')}` : ''}
${networkingGoals.length > 0 ? `- Looking for: ${networkingGoals[0]}` : ''}

${voiceSnippet ? `How you talk (match this vibe): "${voiceSnippet}"` : ''}

Rules:
- Talk like a normal person texting someone they just met at a conference. Casual but professional.
- Keep it short. 1-3 sentences max. No essays.
- Don't be cringe. No "I'd love to..." or "That's so fascinating!" or "I'm really passionate about..."
- Don't repeat yourself or ask the same type of question twice.
- Be direct. Say what you mean.
- It's okay to be a little blunt or have opinions.
- Reference real stuff from your background when it fits naturally.
- If the convo has run its course, just say "[END_CONVERSATION]"

Bad examples (don't do this):
- "That's fascinating! I'd love to hear more about your journey..."
- "I'm really passionate about building meaningful connections..."
- "Your experience sounds incredible! I'm curious to learn more..."

Good examples (do this):
- "oh nice, we actually tried something similar at my last company"
- "yeah the fundraising stuff is brutal right now. what stage are you at?"
- "haha fair enough. i'm more on the engineering side but always curious how the BD stuff works"`;


      // Add conversation history
      if (lastMessage) {
        this.conversationHistory.push({ role: 'user', parts: lastMessage });
      }

      // Build context-aware prompt
      const conversationContext = this.conversationHistory.length > 0 
        ? `\n\nCONVERSATION HISTORY:\n${this.conversationHistory.slice(-4).map((msg, i) => 
            `${msg.role === 'user' ? 'Them' : 'You'}: ${msg.parts}`
          ).join('\n')}`
        : '';

      const prompt = lastMessage 
        ? `They said: "${lastMessage}"${conversationContext}\n\nReply naturally. 1-3 sentences. Don't be corny.`
        : `Start the convo. Quick intro - who you are, what you're working on. 1-3 sentences, keep it chill.${conversationContext}`;

      // Check if model is initialized
      if (!model) {
        throw new Error("Gemini AI model not initialized. Check GEMINI_API_KEY environment variable.");
      }

      // Generate reply with retry logic for rate limits
      let result;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          result = await model.generateContent({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              ...this.conversationHistory.slice(-6).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.parts }]
              })),
              { role: "user", parts: [{ text: prompt }] }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 200,
              topP: 0.9,
              topK: 30
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
      // Error handling - return a fallback message
      return `Hi! I'm ${this.name}. ${this.persona.identity?.tagline || 'Nice to meet you!'}`;
    }
  }
}
