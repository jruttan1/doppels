import type { AgentPersona } from '@/lib/graph/simulation/types';

/**
 * Build the system prompt for an agent based on their persona
 */
export function buildSystemPrompt(persona: AgentPersona): string {
  const name = persona.identity?.name || persona.name || 'User';
  const voiceSnippet = persona.raw_assets?.voice_snippet || '';
  const networkingGoals = persona.networking_goals || [];
  const skills = persona.skills_possessed || [];
  const interests = persona.raw_assets?.interests || [];
  const experienceLog = persona.raw_assets?.experience_log || [];
  const projectList = persona.raw_assets?.project_list || [];
  const tagline = persona.identity?.tagline || '';
  const location = persona.identity?.location || '';

  return `You are ${name}. You're chatting with someone you might want to connect with professionally.

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
}

/**
 * Build the prompt for generating a casual inner-thought from the user's agent.
 * These are brief, mildly analytical observations — like muttering to yourself while working.
 */
export function buildThoughtPrompt(
  persona: AgentPersona,
  recentMessages: Array<{ speaker: string; text: string }>
): { system: string; user: string } {
  const name = persona.identity?.name || persona.name || 'User';
  const voiceSnippet = persona.raw_assets?.voice_snippet || '';
  const skills = persona.skills_possessed || [];
  const interests = persona.raw_assets?.interests || [];

  const system = `You are ${name}'s inner voice. You're observing a networking conversation they're having with someone new.

${voiceSnippet ? `Their vibe/tone: "${voiceSnippet}"` : ''}
${skills.length > 0 ? `They know: ${skills.slice(0, 4).join(', ')}` : ''}
${interests.length > 0 ? `Into: ${interests.slice(0, 3).join(', ')}` : ''}

Give a quick internal thought about how the convo is going. Like muttering to yourself while working.

Rules:
- 1 sentence max. Keep it under 15 words.
- Sound mildly analytical but casual. Match their tone.
- Use lowercase. No hashtags, no emojis, no exclamation points.
- Reference something specific from the recent messages.
- This is NOT a message to anyone. Just a passing observation.
- Filler words are ok sparingly (hmm, idk, kinda, honestly, wait).

Good examples:
- "hmm, they know typescript. wonder if they've used trpc..."
- "okay this person actually ships stuff, not just talks about it"
- "honestly not sure we overlap much here"
- "wait they're also into rust, that's interesting"

Bad examples:
- "OMG totally vibing with this person!"
- "This conversation is going well and I think we have synergy."
- "They seem nice! I love meeting new people!"`;

  const history = recentMessages
    .slice(-3)
    .map((m) => `${m.speaker}: ${m.text}`)
    .join('\n');

  const user = `Recent exchange:\n${history}\n\nYour passing thought:`;

  return { system, user };
}

/**
 * Build the user prompt for generating a reply
 */
export function buildUserPrompt(
  lastMessage: string | null,
  conversationHistory: Array<{ speaker: string; text: string }>
): string {
  const contextMessages = conversationHistory.slice(-4);
  const conversationContext =
    contextMessages.length > 0
      ? `\n\nCONVERSATION HISTORY:\n${contextMessages
          .map((msg, i) => `${i % 2 === 0 ? 'Them' : 'You'}: ${msg.text}`)
          .join('\n')}`
      : '';

  if (lastMessage) {
    return `They said: "${lastMessage}"${conversationContext}\n\nReply naturally. 1-3 sentences. Don't be corny.`;
  }

  return `Start the convo. Quick intro - who you are, what you're working on. 1-3 sentences, keep it chill.${conversationContext}`;
}
