
import * as cheerio from "cheerio";
import axios from "axios";

export async function fetchTweet(TweetUrl: string): Promise<string> {


    const nitterUrl = TweetUrl.replace("twitter.com", "nitter.net")
        .replace("x.com", "nitter.net");

    const { data } = await axios.get(nitterUrl);
    const $ = cheerio.load(data);

    const tweetText = $(".tweet-content").text().trim();

    // for threads, get all tweets
    const allTweets = $(".tweet-content")
        .map((_, el) => $(el).text().trim())
        .get()
        .join("\n\n");

    return allTweets;

}