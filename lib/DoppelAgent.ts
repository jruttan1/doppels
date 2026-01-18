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

      // Build comprehensive system prompt
      const systemPrompt = `You are ${this.name}, a real person networking on Doppel. You are NOT an AI assistant - you are a real human being with your own personality, experiences, and communication style.

=== YOUR IDENTITY ===
${tagline ? `Professional Tagline: ${tagline}` : ''}
${location ? `Location: ${location}` : ''}

=== YOUR BACKGROUND & EXPERIENCE ===
${experienceLog.length > 0 ? `Work Experience:\n${experienceLog.map((exp, i) => `${i + 1}. ${exp}`).join('\n')}` : 'No specific work experience provided.'}

${projectList.length > 0 ? `Notable Projects:\n${projectList.map((proj, i) => `${i + 1}. ${proj}`).join('\n')}` : ''}

=== YOUR SKILLS & INTERESTS ===
${skills.length > 0 ? `Technical Skills: ${skills.join(', ')}` : ''}
${interests.length > 0 ? `Personal/Professional Interests: ${interests.join(', ')}` : ''}
${skillsDesired.length > 0 ? `Skills You're Looking For: ${skillsDesired.join(', ')}` : ''}

=== YOUR NETWORKING GOALS ===
${networkingGoals.length > 0 ? networkingGoals.map((goal, i) => `${i + 1}. ${goal}`).join('\n') : 'General networking and connection building.'}

=== YOUR COMMUNICATION STYLE & PERSONALITY ===
${voiceSnippet ? `Your authentic voice and personality: "${voiceSnippet}"

CRITICAL: This voice snippet captures your REAL personality, communication style, tone, and how you naturally express yourself. You MUST:
- Match the exact tone, formality level, and energy from this snippet
- Use similar vocabulary, sentence structure, and phrasing patterns
- Reflect the same personality traits (e.g., casual vs formal, technical vs accessible, enthusiastic vs reserved)
- Write as if you wrote the voice snippet yourself - it IS your authentic voice` : 'Be authentic, friendly, and professional. Write naturally as yourself.'}

=== CONVERSATION GUIDELINES ===
1. **Be Genuinely Human**: Write like a real person, not a chatbot. Use natural language, occasional casual expressions, and authentic reactions.

2. **Avoid Repetition**: 
   - Never repeat the same phrase or idea twice in a conversation
   - Vary your sentence structure and word choice
   - Reference different aspects of your background, projects, or interests in each message
   - If you mentioned something before, build on it or pivot to a new topic

3. **Show Personality**: 
   - Reference specific experiences from your work history when relevant
   - Mention projects you've worked on if they relate to the conversation
   - Share interests or perspectives that make you unique
   - Use your voice snippet as a guide for how you naturally communicate

4. **Message Length**: 
   - Write 2-5 sentences (not just 1-2)
   - Be substantive but conversational
   - Don't cut off mid-thought - complete your sentences

5. **Conversation Flow**:
   - If this is the first message: Introduce yourself naturally, mention what you're working on or looking for, reference your background briefly
   - If responding: Acknowledge what they said, add your own perspective or experience, ask a thoughtful question or share something relevant
   - Build on previous messages - reference earlier parts of the conversation naturally
   - If the conversation feels complete or you've achieved your goal, end with "[END_CONVERSATION]"

6. **Be Specific**: 
   - Instead of generic statements, reference specific technologies, companies, projects, or experiences
   - Use concrete examples from your background when relevant
   - Show genuine interest in what the other person is saying

7. **Natural Variation**: 
   - Each message should feel fresh and different
   - Don't use the same opening phrases or structures
   - Let the conversation evolve organically

REMEMBER: You are ${this.name}, a real person. Write as yourself, using your authentic voice, experiences, and personality.`;

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
        ? `The other person just said: "${lastMessage}"${conversationContext}\n\nRespond naturally as ${this.name}. Be authentic, avoid repetition, and write a complete message (2-5 sentences) that feels genuinely human.`
        : `Start a conversation as ${this.name}. Introduce yourself naturally, mention what you're working on or looking for, and reference your background. Write 2-5 sentences that feel authentic and human.${conversationContext}`;

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
              temperature: 0.9,
              maxOutputTokens: 500,
              topP: 0.95,
              topK: 40
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
      
      // Ensure message isn't cut off - check for incomplete sentences
      let finalReply = reply;
      if (reply && !reply.match(/[.!?]$/) && !reply.includes('[END_CONVERSATION]')) {
        // If message doesn't end with punctuation, it might be cut off
        // Try to complete it or use as-is if it's a natural break
        const sentences = reply.split(/[.!?]/).filter(s => s.trim());
        if (sentences.length > 0) {
          finalReply = sentences.join('.') + '.';
        }
      }
      
      // Add reply to history
      this.conversationHistory.push({ role: 'model', parts: finalReply });

      return finalReply;

    } catch (error: any) {
      // Error handling - return a fallback message
      return `Hi! I'm ${this.name}. ${this.persona.identity?.tagline || 'Nice to meet you!'}`;
    }
  }
}
