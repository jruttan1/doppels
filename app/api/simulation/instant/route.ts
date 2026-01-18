import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DoppelAgent } from '@/lib/DoppelAgent';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const maxDuration = 60; // Allow 60s for the whole chat loop

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    // 1. FETCH MY PROFILE
    const { data: me, error: myError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (myError || !me) return Response.json({ error: "User not found" }, { status: 404 });

    // 2. FIND A PARTNER (Instant SQL Search)
    const { data: partners, error: matchError } = await supabase.rpc('get_instant_match', { my_id: userId });
    
    if (matchError) throw matchError;
    if (!partners || partners.length === 0) {
      return Response.json({ message: "No eligible matches found yet. Try adding a dummy user!" });
    }

    const partner = partners[0]; // The SQL query returned the best random match

    // 3. SETUP AGENTS
    const myPersona = {
      id: me.id,
      name: me.name || 'User',
      ...me.persona
    };
    
    const partnerPersona = {
      id: partner.other_id,
      name: partner.other_data?.identity?.name || partner.other_data?.name || 'Partner',
      ...partner.other_data
    };

    const myAgent = new DoppelAgent(myPersona);
    const partnerAgent = new DoppelAgent(partnerPersona);

    // Starting simulation between agents

    // 4. RUN THE CHAT LOOP
    const transcript: any[] = [];
    let lastMessage: string | null = null;
    let active = true;

    for (let i = 0; i < 5; i++) { // 5 turns is enough for a demo
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

    // 5. SCORE IT
    const analysis = await analyzeSimulation(transcript);

    // 6. SAVE & RETURN
    // We insert into DB so it shows up in history, but we ALSO return it directly for the UI
    const simulationData = {
      participant1: me.id,
      participant2: partner.other_id,
      transcript: transcript,
      score: analysis.score,
      takeaways: analysis.takeaways || []
    };
    
    // Insert simulation data (try without select first to avoid trigger issues)
    const { error: insertError, data: insertedData } = await supabase
      .from('simulations')
      .insert(simulationData)
      .select()
      .single();
    
    if (insertError) {
      // Failed to save simulation - still return success as simulation ran
      return Response.json({ 
        success: true, 
        simulation: {
          id: `temp-${Date.now()}`,
          ...simulationData
        }, 
        partner_name: partnerAgent.name,
        saved: false,
        error: insertError.message
      });
    }

    return Response.json({ 
      success: true, 
      simulation: insertedData || simulationData, 
      partner_name: partnerAgent.name, 
      saved: true 
    });

  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Reuse your analysis helper with retry logic
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