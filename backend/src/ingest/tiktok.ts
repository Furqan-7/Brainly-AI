import { safeGet } from "../lib/safeFetch";
import { transcribeVideo } from "./transcribe";

export interface TikTokInfo {
    caption: string;
    author: string;
    thumbnail: string | null;
    transcript: string;
}

/** TikTok's public oEmbed endpoint gives caption, author and thumbnail without a login. */
export async function fetchTikTok(url: string): Promise<TikTokInfo> {
    let caption = "";
    let author = "";
    let thumbnail: string | null = null;

    try {
        const { data } = await safeGet(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
        caption = data?.title ?? "";
        author = data?.author_unique_id ?? data?.author_name ?? "";
        thumbnail = data?.thumbnail_url ?? null;
    } catch (error) {
        console.log("Error while fetching TikTok " + error);
    }

    const transcript = await transcribeVideo(url);
    return { caption, author, thumbnail, transcript };
}
