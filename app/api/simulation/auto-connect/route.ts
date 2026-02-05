import { createClient } from '@supabase/supabase-js';
import { after } from 'next/server';
import {
  compileSimulationGraph,
  getCheckpointer,
  type SimulationStateType,
} from '@/lib/graph/simulation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

export const maxDuration = 60;

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
      return Response.json({ done: true, message: 'No other users found with complete personas' });
    }

    // 3. CHECK EXISTING SIMULATIONS TO AVOID DUPLICATES
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
      return Response.json({ done: true, message: 'Already simulated with all available users' });
    }

    // 4. PICK ONE TARGET
    const partner = usersToSimulate[0];

    // 5. CREATE SIMULATION ROW
    const { data: sim, error: insertError } = await supabase
      .from('simulations')
      .insert({
        participant1: me.id,
        participant2: partner.id,
        transcript: [],
        status: 'running',
      })
      .select('id')
      .single();

    if (insertError || !sim) {
      return Response.json(
        { error: insertError?.message || 'Failed to create simulation row' },
        { status: 500 }
      );
    }

    // 6. FIRE GRAPH IN BACKGROUND
    const myPersona = {
      id: me.id,
      name: me.name || 'User',
      ...me.persona,
    };

    const partnerPersona = {
      id: partner.id,
      name: partner.name || 'Partner',
      ...partner.persona,
    };

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

    after(async () => {
      try {
        const checkpointer = await getCheckpointer();
        const graph = compileSimulationGraph({ checkpointer });
        await graph.invoke(initialState, {
          configurable: { thread_id: sim.id },
          recursionLimit: 150,
        });
      } catch (err: any) {
        console.error('Background graph execution failed:', err.message);
        await supabase
          .from('simulations')
          .update({ status: 'failed' })
          .eq('id', sim.id);
      }
    });

    // 7. RETURN IMMEDIATELY
    return Response.json({
      simulationId: sim.id,
      partnerId: partner.id,
      partnerName: partner.name,
    });
  } catch (e: any) {
    console.error('Auto-connect error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
