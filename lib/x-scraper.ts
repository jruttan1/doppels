import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const ACTOR_ID = "apidojo/tweet-scraper";

export async function scrapeUserTweets(handle: string): Promise<string[]> {
  try {
    console.log(`🐦 Scraping tweets for @${handle}...`);

    // execute apify actor
    const run = await client.actor(ACTOR_ID).call({
        searchTerms: [`from:${handle}`],
        maxItems: 50,
        sort: "Latest",
        tweetLanguage: "en"
    });

    // fetch full blob
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // cleaning
    const cleanTweets = items
      // Filter out Retweets (Keep original thoughts and replies)
      .filter((item: any) => item.isRetweet === false) 
      
      // Extract and clean text
      .map((item: any) => {
        let text = item.text || "";
        
        // Remove t.co links (images/urls)
        text = text.replace(/https:\/\/t\.co\/\S+/g, '');
        
        // Flatten newlines
        return text.replace(/\n+/g, ' ').trim();
      })
      // Remove empty strings
      .filter((text: string) => text.length > 0);

    return cleanTweets;

  } catch (error) {
    console.error("Scrape failed:", error);
    return []; // Return empty array on fail so app doesn't crash
  }
}