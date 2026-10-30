import * as cheerio from "cheerio";
import { safeGet } from "../lib/safeFetch";
import { transcribeVideo } from "./transcribe";

export interface ReelInfo {
    caption: string;
    author: string;
    thumbnail: string | null;
    transcript: string;
}

// Instagram serves Open Graph tags to link-preview crawlers without a login wall,
// so we identify as one. This is best-effort: Instagram may still block or rate-limit.
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export function isInstagramReelUrl(url: string): boolean {
    return /^https?:\/\/(www\.)?instagram\.com\/(reel|reels|p|tv)\/[\w-]+/i.test(url);
}

/** Pulls caption/author out of og:description: `12K likes, 80 comments - user on May 1, 2026: "caption"` */
export function parseReelDescription(description: string): { caption: string; author: string } {
    const captionMatch = description.match(/:\s*"([\s\S]*)"\s*\.?$/);
    const authorMatch = description.match(/-\s*([\w.]+)\s+on\s/);
    return { caption: captionMatch?.[1] ?? description, author: authorMatch?.[1] ?? "" };
}

export async function fetchReel(url: string): Promise<ReelInfo> {
    let caption = "";
    let author = "";
    let thumbnail: string | null = null;
    let videoUrl: string | null = null;

    try {
        const { data } = await safeGet<string>(url, {
            headers: { "User-Agent": CRAWLER_UA, "Accept-Language": "en-US,en;q=0.9" },
            responseType: "text",
        });
        const $ = cheerio.load(data);
        const og = (prop: string) => $(`meta[property="og:${prop}"]`).attr("content")?.trim() ?? "";

        ({ caption, author } = parseReelDescription(og("description")));
        thumbnail = og("image") || null;
        videoUrl = og("video") || og("video:secure_url") || null;
    } catch (error) {
        console.log("Error while fetching reel " + error);
    }

    // What's said in the reel is usually the most searchable part
    const transcript = await transcribeVideo(url, videoUrl);
    return { caption, author, thumbnail, transcript };
}
