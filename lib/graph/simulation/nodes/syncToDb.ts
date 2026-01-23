import { createClient } from '@supabase/supabase-js';
import type { SimulationStateType } from '../state';

/**
 * Node: Sync the current transcript to the simulations table.
 * This enables real-time UI updates via Supabase Realtime.
 */
export async function syncToDbNode(
  state: SimulationStateType
): Promise<Partial<SimulationStateType>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!
  );

  try {
    const { error } = await supabase
      .from('simulations')
      .update({
        transcript: state.transcript,
      })
      .eq('id', state.simulationId);

    if (error) {
      console.error('syncToDb error:', error);
      // Don't fail the graph, just log the error
    }
  } catch (error: any) {
    console.error('syncToDb exception:', error);
    // Don't fail the graph, just log
  }

  // No state changes - this is a side effect only node
  return {};
}
