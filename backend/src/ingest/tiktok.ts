import { safeGet } from "../lib/safeFetch";
import { transcribeVideo } from "./transcribe";

export interface TikTokInfo {
    caption: string;
    author: string;
    thumbnail: string | null;
    transcript: string;
}

/** TikTok's public oEmbed endpoint gives caption, author and thumbnail without a login. */
export async function fetchTikTokOembed(url: string): Promise<{ caption: string; author: string; thumbnail: string | null }> {
    try {
        const { data } = await safeGet(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
        return {
            caption: data?.title ?? "",
            author: data?.author_unique_id ?? data?.author_name ?? "",
            thumbnail: data?.thumbnail_url ?? null,
        };
    } catch (error) {
        console.log("Error while fetching TikTok " + error);
        return { caption: "", author: "", thumbnail: null };
    }
}

export async function fetchTikTok(url: string): Promise<TikTokInfo> {
    const { caption, author, thumbnail } = await fetchTikTokOembed(url);
    const transcript = await transcribeVideo(url);
    return { caption, author, thumbnail, transcript };
}
