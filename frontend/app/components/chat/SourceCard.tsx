import type { Source } from "../../types/memory";
import { fileUrl } from "../../services/api";

/** Whole seconds to start a video at, or null when there's no point skipping ahead. */
function startSeconds(timestamp: number | null | undefined): number | null {
    return typeof timestamp === "number" && timestamp >= 1 ? Math.floor(timestamp) : null;
}

/** A YouTube link that opens at `seconds` (any existing t= is replaced). */
function youtubeAt(url: string, seconds: number): string {
    try {
        const u = new URL(url);
        u.searchParams.set("t", `${seconds}s`);
        return u.toString();
    } catch {
        return url;
    }
}

/** Link that opens the original content: the saved URL, or the uploaded file. Videos open at the cited moment. */
export function sourceHref(source: Pick<Source, "source_url" | "has_file" | "memoryId"> & Partial<Pick<Source, "type" | "timestamp">>): string | null {
    const start = source.type === "youtube" ? startSeconds(source.timestamp) : null;
    if (source.source_url) return start ? youtubeAt(source.source_url, start) : source.source_url;
    if (source.has_file) return fileUrl(source.memoryId);
    return null;
}

/** Embeddable player URL for videos, so they can be watched without leaving Brainly. YouTube starts at `timestamp`. */
export function embedUrl(type: string, url: string | null, timestamp?: number | null): string | null {
    if (!url) return null;
    if (type === "reel") {
        // https://instagram.com/reel/ABC123/?igsh=... -> https://www.instagram.com/reel/ABC123/embed
        const m = url.match(/instagram\.com\/(reel|reels|p|tv)\/([\w-]+)/i);
        if (!m) return null;
        const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
        return `https://www.instagram.com/${kind}/${m[2]}/embed`;
    }
    if (type === "tiktok") {
        const m = url.match(/\/video\/(\d+)/);
        return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    }
    if (type === "youtube") {
        const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
        const start = startSeconds(timestamp);
        return m ? `https://www.youtube.com/embed/${m[1]}${start ? `?start=${start}` : ""}` : null;
    }
    return null;
}
