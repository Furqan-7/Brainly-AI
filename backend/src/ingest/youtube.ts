import { YoutubeTranscript } from "youtube-transcript";
import { safeGet } from "../lib/safeFetch";
import { youtubeId } from "../lib/urls";
import { transcribeVideo, videoDuration } from "./transcribe";

export interface YoutubeVideo {
    text: string;
    title: string | null;
    author: string | null;
    thumbnail: string | null;
    duration: string | null;
}

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export function youtubeThumbnail(url: string): string | null {
    const id = youtubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Works for regular videos and Shorts. Falls back to Whisper when captions are disabled. */
export async function fetchYoutube(url: string): Promise<YoutubeVideo> {
    const id = youtubeId(url);
    const watchUrl = id ? `https://www.youtube.com/watch?v=${id}` : url;

    const [oembed, transcript, seconds] = await Promise.all([
        safeGet(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`)
            .then((r) => r.data)
            .catch(() => null),
        YoutubeTranscript.fetchTranscript(id ?? url)
            .then((items) => items.map((i) => i.text).join(" "))
            .catch(() => ""),
        videoDuration(watchUrl),
    ]);

    let text = transcript;
    if (!text.trim()) {
        console.log("No YouTube captions, falling back to Whisper:", watchUrl);
        text = await transcribeVideo(watchUrl);
    }

    const title: string | null = oembed?.title ?? null;
    const author: string | null = oembed?.author_name ?? null;
    return {
        text: [title && `YouTube video: ${title}`, author && `Channel: ${author}`, text].filter(Boolean).join("\n\n"),
        title,
        author,
        thumbnail: youtubeThumbnail(watchUrl),
        duration: seconds ? formatDuration(seconds) : null,
    };
}
