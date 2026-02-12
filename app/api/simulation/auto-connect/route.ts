import { after } from 'next/server';
import { verifyAuthForUser } from '@/lib/auth/verify';
import { runAutoConnect, runSimulationGraph } from '@/lib/simulation/auto-connect';

export const maxDuration = 60;

/**
 * POST /api/simulation/auto-connect
 * Finds a partner and starts a simulation.
 * Returns immediately with simulationId, runs graph in background via after().
 */
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Strict auth check - no fallback bypass
    const auth = await verifyAuthForUser(userId);
    if (auth.error) {
      return Response.json({ error: auth.error }, { status: 401 });
    }

    // Run auto-connect - creates simulation row and returns immediately
    const result = await runAutoConnect(userId);

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    if (result.done) {
      return Response.json({ done: true, message: result.message });
    }

    // Run graph in background using after() - executes after response is sent
    if (result._initialState && result.simulationId) {
      after(async () => {
        await runSimulationGraph(result.simulationId!, result._initialState!);
      });
    }

    return Response.json({
      simulationId: result.simulationId,
      partnerId: result.partnerId,
      partnerName: result.partnerName,
    });

  } catch (e: any) {
    console.error('Auto-connect API error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
