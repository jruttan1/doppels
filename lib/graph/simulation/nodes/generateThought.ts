import { createClient } from '@supabase/supabase-js';
import type { SimulationStateType } from '../state';
import type { ThoughtEntry } from '../types';
import { buildThoughtPrompt } from '@/lib/agents/prompts';
import { generateWithRetry } from '@/lib/agents/gemini';

/**
 * Node: Generate a casual inner-thought from the user's agent (agentA).
 * Fires every 2 turns for a premium "agent is thinking" feel.
 * When a thought is generated, it writes directly to Supabase so the UI shows it immediately.
 */
export async function generateThoughtNode(
  state: SimulationStateType
): Promise<Partial<SimulationStateType>> {
  // Generate thoughts every 2 turns, starting at turn 1
  const turn = state.currentTurn;
  if (turn < 1 || turn % 2 !== 0) {
    return {};
  }

  try {
    const persona = state.agentA.persona;
    const otherPersonName = state.agentB?.name || 'them';
    const recentMessages = state.transcript.slice(-3).map((t) => ({
      speaker: t.speaker,
      text: t.text,
    }));

    if (recentMessages.length === 0) return {};

    const { system, user } = buildThoughtPrompt(persona, recentMessages, otherPersonName);

    const text = await generateWithRetry({
      systemPrompt: system,
      conversationHistory: [],
      userPrompt: user,
      config: {
        temperature: 0.9,
        maxOutputTokens: 100,
        topP: 0.95,
        topK: 40,
      },
    });

    // Clean up the thought - remove quotes, brackets, labels
    let cleanText = text
      .trim()
      .replace(/^\[.*?\]:?\s*/i, '') // Remove [Opinion]: or [Thought]: prefixes
      .replace(/^["']|["']$/g, '')   // Remove surrounding quotes
      .replace(/^(thought|opinion|inner thought):?\s*/i, '') // Remove "Thought:" prefix
      .replace(/^\*+|\*+$/g, '') // Remove asterisks
      .trim();

    // Log for debugging
    console.log('generateThought raw:', text.slice(0, 100));
    console.log('generateThought clean:', cleanText.slice(0, 100));

    // Only skip if completely empty
    if (!cleanText || cleanText.length < 3) {
      console.log('generateThought skipped - too short');
      return {};
    }

    const thought: ThoughtEntry = {
      text: cleanText,
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
