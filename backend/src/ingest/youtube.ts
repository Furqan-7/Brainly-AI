import { YoutubeTranscript } from "youtube-transcript";
import { safeGet } from "../lib/safeFetch";
import { youtubeId } from "../lib/urls";
import { transcribeVideo, videoDuration } from "./transcribe";
import { formatTimestamp, transcriptWithTimestamps } from "./timestamps";

export interface YoutubeVideo {
    text: string;
    title: string | null;
    author: string | null;
    thumbnail: string | null;
    duration: string | null;
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
            // "(m:ss)" markers let answers open the video at the moment they cite
            .then((items) => transcriptWithTimestamps(items))
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
        duration: seconds ? formatTimestamp(seconds) : null,
    };
}
