import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DoppelAgent } from '@/lib/DoppelAgent';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const maxDuration = 300; // 5 minutes for multiple simulations

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. FETCH MY PROFILE
    const { data: me, error: myError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (myError || !me || !me.persona) {
      return Response.json({ error: "User not found or persona not ready" }, { status: 404 });
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
        message: "No other users found with complete personas",
        simulationsRun: 0 
      });
    }

    console.log(`Auto-connecting ${userId} with ${allUsers.length} users...`);

    // 3. CHECK EXISTING SIMULATIONS TO AVOID DUPLICATES
    const { data: existingSims } = await supabase
      .from('simulations')
      .select('participant2')
      .eq('participant1', userId);

    const existingPartnerIds = new Set(existingSims?.map(s => s.participant2) || []);
    const usersToSimulate = allUsers.filter(u => !existingPartnerIds.has(u.id));

    if (usersToSimulate.length === 0) {
      return Response.json({ 
        message: "Already simulated with all available users",
        simulationsRun: 0 
      });
    }

    console.log(`Running ${usersToSimulate.length} new simulations...`);

    const myPersona = {
      id: me.id,
      name: me.name || 'User',
      ...me.persona
    };

    const results = [];

    // 4. RUN SIMULATIONS WITH EACH USER (limit to 10 at a time to avoid timeout)
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < usersToSimulate.length; i += batchSize) {
      batches.push(usersToSimulate.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(async (partner) => {
          try {
            // Create fresh agent instances for each simulation
            const myAgent = new DoppelAgent(myPersona);
            const partnerPersona = {
              id: partner.id,
              name: partner.name || 'Partner',
              ...partner.persona
            };

            const partnerAgent = new DoppelAgent(partnerPersona);

            // RUN THE CHAT LOOP
            const transcript: any[] = [];
            let lastMessage: string | null = null;
            let active = true;

            for (let i = 0; i < 5; i++) {
              if (!active) break;

              // My Agent Speaks
              const textA = await myAgent.reply(lastMessage);
              transcript.push({ speaker: myAgent.name, id: myAgent.id, text: textA });
              if (textA.includes("[END_CONVERSATION]")) { active = false; break; }
              lastMessage = textA;

              // Partner Agent Responds
              const textB = await partnerAgent.reply(lastMessage);
              transcript.push({ speaker: partnerAgent.name, id: partnerAgent.id, text: textB });
              if (textB.includes("[END_CONVERSATION]")) { active = false; break; }
              lastMessage = textB;
            }

            // SCORE IT
            const analysis = await analyzeSimulation(transcript);

            // SAVE TO DB
            const simulationData = {
              participant1: me.id,
              participant2: partner.id,
              transcript: transcript,
              score: analysis.score,
              takeaways: analysis.takeaways || []
            };

            const { error: insertError, data: insertedData } = await supabase
              .from('simulations')
              .insert(simulationData)
              .select()
              .single();

            if (insertError) {
              console.error(`Failed to save simulation with ${partner.id}:`, insertError);
              return {
                partnerId: partner.id,
                partnerName: partner.name,
                success: false,
                error: insertError.message
              };
            }

            return {
              partnerId: partner.id,
              partnerName: partner.name,
              success: true,
              score: analysis.score,
              simulationId: insertedData?.id
            };
          } catch (error: any) {
            console.error(`Simulation failed for ${partner.id}:`, error.message);
            return {
              partnerId: partner.id,
              partnerName: partner.name,
              success: false,
              error: error.message
            };
          }
        })
      );

      results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : {
        success: false,
        error: r.reason?.message || 'Unknown error'
      }));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Auto-connect complete: ${successful} successful, ${failed} failed`);

    return Response.json({ 
      success: true,
      simulationsRun: successful,
      total: usersToSimulate.length,
      results: results
    });

  } catch (e: any) {
    console.error("Auto-connect error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Reuse analysis helper with retry logic
async function analyzeSimulation(transcript: any[]) {
  let result;
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `
          Analyze this chat. Return JSON: { "score": number (0-100), "takeaways": ["string"] }
          TRANSCRIPT: ${JSON.stringify(transcript)}
        ` }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      break; // Success
    } catch (error: any) {
      if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('rate limit')) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
  
  return JSON.parse(result!.response.text());
}
