import { Scraper } from "@the-convocation/twitter-scraper";

const scraper = new Scraper();

export async function fetchTweet(url: string) {
    try {
        const tweetId = url.split("/status/")[1]?.split("?")[0];

        const tweet = await scraper.getTweet(tweetId);

        if (!tweet) {
            throw new Error("Could not fetch tweet");
        }

        const text = [
            tweet.text,                          // main tweet content
            tweet.hashtags.join(" "),            // hashtags as context
            `By @${tweet.username} (${tweet.name})`, // author context
        ]
            .filter(Boolean)
            .join("\n");

        console.log(text);

        return text;




    } catch (error) {
        console.log("Error while fetching tweet " + error);
        return "";
    }
}
