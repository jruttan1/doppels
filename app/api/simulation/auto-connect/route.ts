import { createClient } from '@supabase/supabase-js';
import pLimit from 'p-limit';
import {
  compileSimulationGraph,
  getCheckpointer,
  type SimulationStateType,
} from '@/lib/graph/simulation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

export const maxDuration = 300; // 5 minutes for multiple simulations

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. FETCH MY PROFILE
    const { data: me, error: myError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (myError || !me || !me.persona) {
      return Response.json(
        { error: 'User not found or persona not ready' },
        { status: 404 }
      );
    }

    // 2. GET ALL OTHER USERS WITH COMPLETE PERSONAS
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, tagline, persona')
      .neq('id', userId)
      .not('persona', 'is', null)
      .neq('persona', '{}')
      .eq('ingestion_status', 'complete');

    if (usersError || !allUsers || allUsers.length === 0) {
      return Response.json({
        message: 'No other users found with complete personas',
        simulationsRun: 0,
      });
    }

    console.log(`Auto-connecting ${userId} with ${allUsers.length} users...`);

    // 3. CHECK EXISTING SIMULATIONS TO AVOID DUPLICATES (check both directions)
    const { data: existingSims1 } = await supabase
      .from('simulations')
      .select('participant2')
      .eq('participant1', userId);

    const { data: existingSims2 } = await supabase
      .from('simulations')
      .select('participant1')
      .eq('participant2', userId);

    const existingPartnerIds = new Set([
      ...(existingSims1?.map((s) => s.participant2) || []),
      ...(existingSims2?.map((s) => s.participant1) || []),
    ]);
    const usersToSimulate = allUsers.filter(
      (u) => !existingPartnerIds.has(u.id)
    );

    if (usersToSimulate.length === 0) {
      return Response.json({
        message: 'Already simulated with all available users',
        simulationsRun: 0,
      });
    }

    console.log(`Running ${usersToSimulate.length} new simulations...`);

    // 4. COMPILE GRAPH WITH CHECKPOINTER
    const checkpointer = await getCheckpointer();
    const graph = compileSimulationGraph({ checkpointer });

    // 5. RUN SIMULATIONS WITH CONCURRENCY LIMIT
    const limit = pLimit(5); // Max 5 concurrent simulations to avoid rate limits

    const myPersona = {
      id: me.id,
      name: me.name || 'User',
      ...me.persona,
    };

    const results = await Promise.all(
      usersToSimulate.map((partner) =>
        limit(async () => {
          try {
            // Pre-create simulation row
            const { data: sim, error: insertError } = await supabase
              .from('simulations')
              .insert({
                participant1: me.id,
                participant2: partner.id,
                transcript: [],
              })
              .select('id')
              .single();

            if (insertError || !sim) {
              console.error(
                `Failed to create simulation row for ${partner.id}:`,
                insertError
              );
              return {
                partnerId: partner.id,
                partnerName: partner.name,
                success: false,
                error: insertError?.message || 'Failed to create simulation row',
              };
            }

            const partnerPersona = {
              id: partner.id,
              name: partner.name || 'Partner',
              ...partner.persona,
            };

            // Prepare initial state
            const initialState: Partial<SimulationStateType> = {
              simulationId: sim.id,
              agentA: {
                id: me.id,
                name: me.name || 'User',
                persona: myPersona,
              },
              agentB: {
                id: partner.id,
                name: partner.name || 'Partner',
                persona: partnerPersona,
              },
              maxTurns: 15,
            };

            // Invoke graph - runs to completion, syncToDb updates DB after each turn
            const finalState = await graph.invoke(initialState, {
              configurable: { thread_id: sim.id },
            });

            return {
              partnerId: partner.id,
              partnerName: partner.name,
              success: !finalState.error,
              score: finalState.analysis?.score,
              simulationId: sim.id,
              error: finalState.error || undefined,
            };
          } catch (error: any) {
            console.error(`Simulation failed for ${partner.id}:`, error.message);
            return {
              partnerId: partner.id,
              partnerName: partner.name,
              success: false,
              error: error.message,
            };
          }
        })
      )
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`Auto-connect complete: ${successful} successful, ${failed} failed`);

    return Response.json({
      success: true,
      simulationsRun: successful,
      total: usersToSimulate.length,
      results: results,
    });
  } catch (e: any) {
    console.error('Auto-connect error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
