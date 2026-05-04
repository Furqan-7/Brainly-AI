import * as cheerio from "cheerio";
import axios from "axios";

const NITTER_INSTANCES = [
    "nitter.privacydev.net",
    "nitter.poast.org",
    "nitter.catsarch.com",
    "nitter.unixfox.eu",
];

export async function fetchTweet(TweetUrl: string): Promise<string> {
    console.log("fetchTweet url: " + TweetUrl);

    // extract the path from the tweet URL
    // https://x.com/user/status/123 → /user/status/123
    const urlPath = TweetUrl
        .replace("https://twitter.com", "")
        .replace("https://x.com", "")
        .replace("http://twitter.com", "")
        .replace("http://x.com", "");

    for (const instance of NITTER_INSTANCES) {
        try {
            const nitterUrl = `https://${instance}${urlPath}`;
            console.log("Trying nitter instance: " + nitterUrl);

            const { data } = await axios.get(nitterUrl, {
                timeout: 5000, // don't wait too long per instance
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            });

            const $ = cheerio.load(data);
            const allTweets = $(".tweet-content")
                .map((_, el) => $(el).text().trim())
                .get()
                .join("\n\n");

            if (allTweets) {
                console.log("Tweet fetched successfully: " + allTweets);
                return allTweets;
            }

        } catch (error) {
            console.log(`Instance ${instance} failed, trying next...`);
            continue; // try next instance
        }
    }

    console.log("All nitter instances failed");
    return "";
}