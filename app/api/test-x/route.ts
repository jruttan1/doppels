import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const flashModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json"
  }
});

const GUMLOOP_X_USER_ID = process.env.GUMLOOP_USER_ID || 'x847FlXvIMcKaILyaifOw8IUXAq1';
const GUMLOOP_X_PIPELINE_ID = process.env.GUMLOOP_X_PIPELINE_ID || '7A4oBYUagQPbg8SnvDMaU4';
// Extract just the API key (first 32 chars before & if present)
const envApiKey = process.env.GUMLOOP_API_KEY?.split('&')[0]?.trim();
const GUMLOOP_X_API_KEY = (envApiKey && envApiKey.length === 32) ? envApiKey : 'c082e29f8d254075930cfc27174dcf3d';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    // Clean username (remove @ and URL parts)
    const cleanUsername = username.replace(/^@/, '').replace(/^https?:\/\/(x\.com|twitter\.com)\//, '').split('/')[0].trim();

    console.log(`Testing Gumloop for username: ${cleanUsername}`);
    
    const requestUrl = `https://api.gumloop.com/api/v1/start_pipeline?user_id=${GUMLOOP_X_USER_ID}&saved_item_id=${GUMLOOP_X_PIPELINE_ID}`;
    
    console.log(`Request URL: ${requestUrl}`);

    // Step 1: POST to start pipeline (empty body as per user's example)
    console.log("Step 1: Starting Gumloop pipeline...");
    const gumloopRes = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GUMLOOP_X_API_KEY}`
      },
      body: JSON.stringify({})
    });

    const responseText = await gumloopRes.text();
    console.log(`Response status: ${gumloopRes.status}`);
    console.log(`Response text: ${responseText.substring(0, 200)}`);

    if (!gumloopRes.ok) {
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        errorDetails = responseText;
      }
      return NextResponse.json({ 
        error: "Gumloop API error", 
        status: gumloopRes.status,
        statusText: gumloopRes.statusText,
        details: errorDetails,
        debug: {
          requestUrl,
          apiKeyLength: GUMLOOP_X_API_KEY.length,
          apiKeyPrefix: GUMLOOP_X_API_KEY.substring(0, 10),
          apiKeyFromEnv: !!process.env.GUMLOOP_API_KEY,
          user_id: GUMLOOP_X_USER_ID,
          saved_item_id: GUMLOOP_X_PIPELINE_ID,
          requestHeaders: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GUMLOOP_X_API_KEY.substring(0, 10)}...`
          }
        }
      }, { status: gumloopRes.status });
    }

    let gumloopData;
    try {
      gumloopData = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({
        error: "Failed to parse Gumloop response",
        responseText,
        status: gumloopRes.status
      }, { status: 500 });
    }
    const runId = gumloopData.run_id;

    if (!runId) {
      return NextResponse.json({ 
        error: "No run_id from Gumloop",
        gumloopResponse: gumloopData 
      }, { status: 500 });
    }

    console.log(`Step 2: Got run_id: ${runId}, polling for results...`);

    // Step 2: Poll for completion
    let tweets: any = null;
    let finalStatus: any = null;
    let attempts = 0;
    const maxAttempts = 30;

    for (let i = 0; i < maxAttempts; i++) {
      attempts = i + 1;
      await new Promise(r => setTimeout(r, 2000));
      
      const statusRes = await fetch(
        `https://api.gumloop.com/api/v1/get_pl_run?run_id=${runId}&user_id=${GUMLOOP_X_USER_ID}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GUMLOOP_X_API_KEY}`
          }
        }
      );

      if (!statusRes.ok) {
        console.log(`Poll attempt ${attempts}: Status ${statusRes.status}`);
        continue;
      }

      const statusData = await statusRes.json();
      finalStatus = statusData;
      
      console.log(`Poll attempt ${attempts}: State = ${statusData.state}`);
      
      if (statusData.state === 'DONE') {
        // Extract tweets from outputs - check various possible keys
        tweets = statusData.outputs?.tweets || 
                 statusData.outputs?.output || 
                 statusData.outputs?.data ||
                 statusData.outputs;
        
        if (typeof tweets === 'string') {
          tweets = tweets.split('\n').filter((t: string) => t.trim());
        } else if (Array.isArray(tweets)) {
          // Already an array
        } else if (tweets && typeof tweets === 'object') {
          // Try to extract array from object
          tweets = Object.values(tweets).flat().filter((t: any) => typeof t === 'string' && t.trim());
        }
        break;
      } else if (statusData.state === 'FAILED') {
        return NextResponse.json({ 
          error: "Gumloop pipeline failed",
          status: statusData,
          attempts 
        }, { status: 500 });
      }
    }

    if (!tweets || (Array.isArray(tweets) && tweets.length === 0)) {
      return NextResponse.json({ 
        error: "No tweets retrieved",
        finalStatus,
        attempts,
        outputs: finalStatus?.outputs
      }, { status: 500 });
    }

    const tweetCount = Array.isArray(tweets) ? tweets.length : 1;
    console.log(`Step 3: Got ${tweetCount} tweets, summarizing with Gemini...`);

    // Step 3: Summarize with Gemini
    const summaryPrompt = `
You are analyzing someone's Twitter/X presence to understand their authentic voice and personality.

TWEETS (last 25):
"""
${Array.isArray(tweets) ? tweets.join('\n---\n') : typeof tweets === 'string' ? tweets : JSON.stringify(tweets, null, 2)}
"""

Analyze these tweets and return JSON with:
{
  "communication_style": "String - how they write (casual, technical, witty, thoughtful, etc.)",
  "tone": "String - overall tone (friendly, sarcastic, professional, provocative, etc.)",
  "key_interests": ["Array of topics they frequently discuss"],
  "personality_traits": ["Array of personality traits evident from their tweets"],
  "notable_opinions": ["Array of strong opinions or takes they've shared"],
  "humor_style": "String or null - if they use humor, describe it",
  "engagement_style": "String - how they interact (asks questions, shares links, hot takes, threads, etc.)",
  "sample_voice": "String - write 1-2 sentences that capture how this person would naturally write/speak"
}

Focus on authentic voice signals. Ignore promotional content or retweets.
`;

    const result = await flashModel.generateContent(summaryPrompt);
    const summary = JSON.parse(result.response.text());

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      runId,
      attempts,
      rawTweets: tweets,
      summary: {
        username: cleanUsername,
        tweet_count: tweetCount,
        ...summary
      },
      debug: {
        gumloopInitialResponse: gumloopData,
        finalStatus: finalStatus?.state,
        outputsKeys: finalStatus ? Object.keys(finalStatus.outputs || {}) : [],
        outputs: finalStatus?.outputs
      }
    });

  } catch (error: any) {
    console.error("Test X error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
