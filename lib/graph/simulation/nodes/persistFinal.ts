import { createClient } from '@supabase/supabase-js';
import type { SimulationStateType } from '../state';

/**
 * Node: Final persistence of simulation results.
 * Updates the simulations table with final transcript, score, takeaways, and status.
 */
export async function persistFinalNode(
  state: SimulationStateType
): Promise<Partial<SimulationStateType>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SERVICE_ROLE_KEY!
  );

  const updateData: Record<string, any> = {
    transcript: state.transcript,
    score: state.analysis?.score ?? 0,
    takeaways: state.analysis?.takeaways ?? [],
  };

  try {
    const { error } = await supabase
      .from('simulations')
      .update(updateData)
      .eq('id', state.simulationId);

    if (error) {
      console.error('persistFinal error:', error);
      return {
        error: `Database save failed: ${error.message}`,
      };
    }

    return {};
  } catch (error: any) {
    console.error('persistFinal exception:', error);
    return {
      error: `Persistence error: ${error.message}`,
    };
  }
}
