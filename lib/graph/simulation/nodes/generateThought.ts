import { createClient } from '@supabase/supabase-js';
import type { SimulationStateType } from '../state';
import type { ThoughtEntry } from '../types';
import { buildThoughtPrompt } from '@/lib/agents/prompts';
import { generateWithRetry } from '@/lib/agents/gemini';

/**
 * Node: Occasionally generate a casual inner-thought from the user's agent (agentA).
 * Fires roughly every 3-4 turns. On no-op turns, returns {} (no state change).
 * When a thought is generated, it writes directly to Supabase to avoid one-turn lag.
 */
export async function generateThoughtNode(
  state: SimulationStateType
): Promise<Partial<SimulationStateType>> {
  // Only generate thoughts every ~3 turns, starting at turn 2
  const turn = state.currentTurn;
  if (turn < 2 || turn % 3 !== 0) {
    return {};
  }

  try {
    const persona = state.agentA.persona;
    const recentMessages = state.transcript.slice(-3).map((t) => ({
      speaker: t.speaker,
      text: t.text,
    }));

    if (recentMessages.length === 0) return {};

    const { system, user } = buildThoughtPrompt(persona, recentMessages);

    const text = await generateWithRetry({
      systemPrompt: system,
      conversationHistory: [],
      userPrompt: user,
      config: {
        temperature: 0.9,
        maxOutputTokens: 60,
        topP: 0.95,
        topK: 40,
      },
    });

    const thought: ThoughtEntry = {
      text: text.trim().replace(/^["']|["']$/g, ''),
      turnNumber: turn,
      timestamp: new Date().toISOString(),
    };

    // Write directly to Supabase so the frontend picks it up immediately
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!
    );

    const newThoughts = [...(state.thoughts || []), thought];

    const { error } = await supabase
      .from('simulations')
      .update({ thoughts: newThoughts })
      .eq('id', state.simulationId);

    if (error) {
      console.error('generateThought DB write error:', error);
    }

    return { thoughts: [thought] };
  } catch (error: any) {
    console.error('generateThought error:', error.message);
    // Don't fail the graph — thoughts are non-critical
    return {};
  }
}
