/**
 * Test script: Real DB Simulation
 * * Usage:
 * npx tsx scripts/test-simulation.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { compileSimulationGraph } from '../lib/graph/simulation';
import type { SimulationStateType } from '../lib/graph/simulation';
import crypto from 'crypto'; // Native Node.js crypto for valid UUIDs

// 1. Setup DB Connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

async function runRealTest() {
  console.log('🚀 Starting Real-Data Simulation Test...\n');

  // 2. Fetch 2 Real Users with Personas
  console.log('🔍 Fetching users from DB...');
  const { data: users, error } = await supabase
    .from('users') // Adjust table name if you use 'user_profiles'
    .select('*')
    .not('persona', 'is', null) // Only get users with personas
    .limit(10); // Grab a few to pick from

  if (error || !users || users.length < 2) {
    console.error('❌ Not enough users found in DB with personas.');
    console.error(error);
    process.exit(1);
  }

  // Pick first two found (or random ones)
  const userA = users[0];
  const userB = users[1];

  console.log(`✅ Selected Participants:\n  1. ${userA.name || 'User A'} (${userA.id})\n  2. ${userB.name || 'User B'} (${userB.id})\n`);

  // 3. Create Valid UUID & DB Entry
  // This fixes the "invalid input syntax for type uuid" error
  const simulationId = crypto.randomUUID(); 

  console.log(`📝 Creating simulation row: ${simulationId}`);
  const { error: insertError } = await supabase
    .from('simulations')
    .insert({
      id: simulationId, // Explicitly provide the UUID
      participant1: userA.id,
      participant2: userB.id,
      transcript: [],
      status: 'running'
    });

  if (insertError) {
    console.error('❌ Failed to create DB row:', insertError.message);
    process.exit(1);
  }

  // 4. Compile & Run Graph
  console.log('📊 Compiling graph...');
  const graph = compileSimulationGraph();

  const initialState: Partial<SimulationStateType> = {
    simulationId: simulationId, // Pass the UUID so syncToDb works
    agentA: {
      id: userA.id,
      name: userA.name || 'User A',
      persona: { id: userA.id, name: userA.name || 'User A', ...userA.persona },
    },
    agentB: {
      id: userB.id,
      name: userB.name || 'User B',
      persona: { id: userB.id, name: userB.name || 'User B', ...userB.persona },
    },
    maxTurns: 15, // Keep it short
  };

  console.log('💬 Conversation Started...\n');
  console.log('─'.repeat(60));

  try {
    const stream = await graph.stream(initialState);

    for await (const event of stream) {
      for (const [nodeName, output] of Object.entries(event)) {
        
        // Print Agent Replies
        if (nodeName === 'agentReply' && output) {
          const state = output as SimulationStateType;
          const lastEntry = state.transcript?.[state.transcript.length - 1];
          if (lastEntry) {
            console.log(`\n[${lastEntry.speaker}]:`);
            console.log(`  "${lastEntry.text}"`);
          }
        } 
        
        // Print Termination Reason
        else if (nodeName === 'checkTermination' && output) {
          const state = output as Partial<SimulationStateType>;
          if (state.terminationReason) {
            console.log(`\n⏹️  Terminated: ${state.terminationReason}`);
          }
        } 
        
        // Print Final Analysis
        else if (nodeName === 'analyzeConversation' && output) {
          const state = output as Partial<SimulationStateType>;
          if (state.analysis) {
            console.log('\n' + '─'.repeat(60));
            console.log('\n📊 Analysis Results:');
            console.log(`   Score: ${state.analysis.score}/100`);
            console.log(`   Takeaways:`);
            state.analysis.takeaways?.forEach((t) => console.log(`     - ${t}`));
          }
        }
      }
    }

    console.log('\n✅ Simulation complete!');
    console.log(`View result in DB: SELECT * FROM simulations WHERE id = '${simulationId}'`);

  } catch (err: any) {
    console.error('\n❌ Runtime Error:', err.message);
  }
}

runRealTest();