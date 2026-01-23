/**
 * Test the agent reply function in isolation.
 *
 * Usage:
 *   npx tsx scripts/test-agent-reply.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateAgentReply } from '../lib/agents/generateReply';

const mockPersona = {
  id: 'test-user',
  name: 'Alice',
  identity: {
    name: 'Alice Chen',
    tagline: 'Full-stack engineer building AI tools',
    location: 'San Francisco',
  },
  networking_goals: ['Find a technical co-founder'],
  skills_possessed: ['TypeScript', 'React', 'Node.js'],
  raw_assets: {
    voice_snippet: 'casual, lowercase, direct',
    experience_log: ['5 years at Google'],
    project_list: ['AI code review tool'],
    interests: ['startups', 'coffee'],
  },
};

async function main() {
  console.log('Testing agent reply...\n');

  // Test 1: Opening message (no lastMessage)
  console.log('Test 1: Opening message');
  const reply1 = await generateAgentReply({
    persona: mockPersona,
    lastMessage: null,
    conversationHistory: [],
  });
  console.log(`Reply: "${reply1}"\n`);

  // Test 2: Response to a message
  console.log('Test 2: Response to message');
  const reply2 = await generateAgentReply({
    persona: mockPersona,
    lastMessage: "Hey! I'm working on a design tool startup. What about you?",
    conversationHistory: [
      {
        speaker: 'Bob',
        id: 'bob-id',
        text: "Hey! I'm working on a design tool startup. What about you?",
        timestamp: new Date().toISOString(),
      },
    ],
  });
  console.log(`Reply: "${reply2}"\n`);

  console.log('✅ Agent reply tests complete!');
}

main().catch(console.error);
