import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { simulationId, senderId } = await req.json();

    if (!simulationId || !senderId) {
      return Response.json({ error: "Missing simulationId or senderId" }, { status: 400 });
    }

    // Get simulation data - try by ID first
    let { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('participant1, participant2, score, takeaways')
      .eq('id', simulationId)
      .maybeSingle();

    // If not found by ID, try finding by participants
    if (!simulation && senderId) {
      const { data: simByParticipants } = await supabase
        .from('simulations')
        .select('participant1, participant2, score, takeaways')
        .or(`and(participant1.eq.${senderId},participant2.eq.${simulationId}),and(participant1.eq.${simulationId},participant2.eq.${senderId})`)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (simByParticipants) {
        simulation = simByParticipants;
      }
    }

    if (simError) {
      return Response.json({ error: `Simulation error: ${simError.message}` }, { status: 404 });
    }

    if (!simulation) {
      return Response.json({ error: "Simulation not found" }, { status: 404 });
    }

    // Verify the sender is part of this simulation
    if (simulation.participant1 !== senderId && simulation.participant2 !== senderId) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the receiver (the other participant)
    const receiverId = simulation.participant1 === senderId
      ? simulation.participant2
      : simulation.participant1;

    // Get receiver's email from auth.users
    const { data: receiverAuth, error: authError } = await supabase.auth.admin.getUserById(receiverId);

    if (authError || !receiverAuth?.user?.email) {
      return Response.json({ error: "Could not find receiver email" }, { status: 404 });
    }

    const receiverEmail = receiverAuth.user.email;

    // Get both users' names
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', [senderId, receiverId]);

    const userMap = new Map(users?.map(u => [u.id, u.name]) || []);
    const senderName = userMap.get(senderId) || "Someone";
    const receiverName = userMap.get(receiverId) || "Someone";

    const takeaways = simulation.takeaways || [];
    const topTakeaway = takeaways.length > 0
      ? takeaways[0]
      : "shared professional interests";

    return Response.json({
      success: true,
      receiverEmail,
      senderName,
      receiverName,
      receiverFirstName: receiverName.split(" ")[0],
      score: simulation.score,
      topTakeaway,
    });

  } catch (e: any) {
    console.error("Send coffee chat error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
