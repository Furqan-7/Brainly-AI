import axios from "axios";
import * as cheerio from "cheerio";

export interface ReelInfo {
    caption: string;
    author: string;
    thumbnail: string | null;
}

// Instagram serves Open Graph tags to link-preview crawlers without a login wall,
// so we identify as one. This is best-effort: Instagram may still block or rate-limit.
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export function isInstagramReelUrl(url: string): boolean {
    return /^https?:\/\/(www\.)?instagram\.com\/(reel|reels|p|tv)\/[\w-]+/i.test(url);
}

export async function fetchReel(url: string): Promise<ReelInfo> {
    const empty: ReelInfo = { caption: "", author: "", thumbnail: null };

    try {
        const { data } = await axios.get(url, {
            headers: { "User-Agent": CRAWLER_UA, "Accept-Language": "en-US,en;q=0.9" },
            timeout: 10000,
        });
        const $ = cheerio.load(data);
        const og = (prop: string) => $(`meta[property="og:${prop}"]`).attr("content")?.trim() ?? "";

        // og:description usually looks like: `12K likes, 80 comments - username on May 1, 2026: "caption..."`
        const description = og("description");
        const captionMatch = description.match(/:\s*"([\s\S]*)"\s*\.?$/);
        const caption = captionMatch?.[1] ?? description;

        const authorMatch = description.match(/-\s*([\w.]+)\s+on\s/);
        const author = authorMatch?.[1] ?? "";

        return { caption, author, thumbnail: og("image") || null };
    } catch (error) {
        console.log("Error while fetching reel " + error);
        return empty;
    }
}
