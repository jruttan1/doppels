import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DoppelAgent } from '@/lib/DoppelAgent';

// Initialize Supabase client (will be validated in handler)
let supabase: ReturnType<typeof createClient> | null = null;
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

// Lazy initialization to avoid module-level errors
function getSupabase() {
  if (!supabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

function getModel() {
  if (!model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
  return model;
}

export const maxDuration = 60; // Allow 60s for the whole chat loop

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: "Missing userId in request body" }, { status: 400 });
    }

    // Initialize clients (will throw if env vars are missing)
    const supabaseClient = getSupabase();
    const geminiModel = getModel();

    // 1. FETCH MY PROFILE
    const { data: me, error: myError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (myError || !me) {
      console.error("Error fetching user:", myError);
      return Response.json({ error: "User not found", details: myError?.message }, { status: 404 });
    }

    // 2. FIND A PARTNER (Instant SQL Search)
    const { data: partners, error: matchError } = await supabaseClient.rpc('get_instant_match', { my_id: userId });
    
    if (matchError) {
      console.error("Error calling get_instant_match RPC:", matchError);
      return Response.json({ 
        error: "Failed to find a match", 
        details: matchError.message,
        hint: "Make sure the get_instant_match function exists in your database"
      }, { status: 500 });
    }
    
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
    const analysis = await analyzeSimulation(transcript, geminiModel);

    // 6. SAVE & RETURN
    // We insert into DB so it shows up in history, but we ALSO return it directly for the UI
    const simulationData = {
      participant1: me.id,
      participant2: partner.other_id,
      transcript: transcript,
      score: analysis.score
    };
    
    // Insert simulation data (try without select first to avoid trigger issues)
    const { error: insertError, data: insertedData } = await supabaseClient
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
    console.error("Simulation API error:", e);
    const errorMessage = e?.message || e?.toString() || "Unknown error occurred";
    const errorStack = process.env.NODE_ENV === 'development' ? e?.stack : undefined;
    
    return Response.json({ 
      error: errorMessage,
      details: errorStack,
      type: e?.name || "Error"
    }, { status: 500 });
  }
}

// Reuse your analysis helper with retry logic
async function analyzeSimulation(transcript: any[], model: any) {
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
          console.error("Gemini API rate limit exceeded after retries");
          throw new Error(`Gemini API rate limit exceeded: ${error.message}`);
        }
        const waitTime = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error("Gemini API error:", error);
        throw new Error(`Gemini API error: ${error.message || error.toString()}`);
      }
    }
  }
  
  if (!result || !result.response) {
    throw new Error("Failed to get response from Gemini API");
  }
  
  try {
    const text = result.response.text();
    return JSON.parse(text);
  } catch (parseError: any) {
    console.error("Failed to parse Gemini response:", parseError);
    throw new Error(`Failed to parse analysis response: ${parseError.message}`);
  }
}