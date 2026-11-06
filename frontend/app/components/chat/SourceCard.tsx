import type { Source } from "../../types/memory";
import { fileUrl } from "../../services/api";

/** Link that opens the original content: the saved URL, or the uploaded file. */
export function sourceHref(source: Pick<Source, "source_url" | "has_file" | "memoryId">): string | null {
    if (source.source_url) return source.source_url;
    if (source.has_file) return fileUrl(source.memoryId);
    return null;
}

/** Embeddable player URL for videos, so they can be watched without leaving Brainly. */
export function embedUrl(type: string, url: string | null): string | null {
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
        return m ? `https://www.youtube.com/embed/${m[1]}` : null;
    }
    return null;
}
