import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

const GUMLOOP_USER_ID = "gNDc8nrosdYwaeVhycwWU0jrWq83";
const GUMLOOP_PIPELINE_ID = "wAhemDytcy4eatmbekL5h6";
const GUMLOOP_KEY_2 = process.env.GUMLOOP_KEY_2 || "f678b23879324b63a036a23415194820";

export async function POST(req: Request) {
  try {
    const { simulationId, senderId } = await req.json();

    if (!simulationId || !senderId) {
      return Response.json({ error: "Missing simulationId or senderId" }, { status: 400 });
    }

    console.log("Looking for simulation:", simulationId, "sender:", senderId);

    // Get simulation data - try by ID first
    let { data: simulation, error: simError } = await supabase
      .from('simulations')
      .select('participant1, participant2, transcript, score, takeaways')
      .eq('id', simulationId)
      .maybeSingle();

    // If not found by ID, try finding by participants
    if (!simulation && senderId) {
      console.log("Not found by ID, trying by participants...");
      // simulationId might actually be the other user's ID in some cases
      const { data: simByParticipants } = await supabase
        .from('simulations')
        .select('participant1, participant2, transcript, score, takeaways')
        .or(`and(participant1.eq.${senderId},participant2.eq.${simulationId}),and(participant1.eq.${simulationId},participant2.eq.${senderId})`)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (simByParticipants) {
        simulation = simByParticipants;
      }
    }

    if (simError) {
      console.error("Simulation query error:", simError);
      return Response.json({ error: `Simulation error: ${simError.message}` }, { status: 404 });
    }

    if (!simulation) {
      console.error("No simulation data returned for id:", simulationId);
      return Response.json({ error: "Simulation not found" }, { status: 404 });
    }

    console.log("Found simulation:", simulation.participant1, "->", simulation.participant2);

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

    // Use the takeaways from the simulation as the shared summary
    // Gumloop automation will compose the actual email
    const takeaways = simulation.takeaways || [];
    const sharedSummary = takeaways.length > 0 
      ? takeaways.join(' ')
      : `${senderName} and ${receiverName} had a ${simulation.score}% compatibility match based on their AI agent conversation.`;

    // Call Gumloop API
    const gumloopUrl = `https://api.gumloop.com/api/v1/start_pipeline?user_id=${GUMLOOP_USER_ID}&saved_item_id=${GUMLOOP_PIPELINE_ID}`;
    
    const gumloopResponse = await fetch(gumloopUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GUMLOOP_KEY_2}`
      },
      body: JSON.stringify({
        receiver_email: receiverEmail,
        shared_summary: sharedSummary
      })
    });

    if (!gumloopResponse.ok) {
      const errorText = await gumloopResponse.text();
      console.error("Gumloop API error:", errorText);
      return Response.json({ error: "Failed to send email" }, { status: 500 });
    }

    const gumloopResult = await gumloopResponse.json();

    return Response.json({ 
      success: true,
      message: `Coffee chat invitation sent to ${receiverName}`,
      receiverEmail,
      summary: sharedSummary
    });

  } catch (e: any) {
    console.error("Send coffee chat error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
