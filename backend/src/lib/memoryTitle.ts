/**
 * Titles for memories saved without one (Android share, the browser extension, quick saves).
 * A memory first gets a provisional title so it shows up right away; once it's processed, the
 * real title of the page, video or post replaces it, or the AI writes one from the content.
 */

const MAX = 120;

/** True when a "title" is really just a link (the extension used to send the URL as the title). */
export function looksLikeUrl(text: string): boolean {
    return /^(https?:\/\/|www\.)\S+$/i.test(text.trim());
}

/** Whether a title the client sent should be replaced with an automatic one. */
export function needsAutoTitle(title: string | null | undefined, sourceUrl: string | null): boolean {
    const t = title?.trim();
    return !t || looksLikeUrl(t) || (!!sourceUrl && t === sourceUrl.trim());
}

/** Cleans a fetched or generated title: one line, no hashtags or surrounding quotes, cut at a word. */
export function cleanTitle(raw: string | null | undefined): string | null {
    if (!raw) return null;
    let text = raw
        .split("\n").map((l) => l.trim()).find((l) => l && !/^#\S+(\s+#\S+)*$/.test(l)) ?? "";
    text = text
        .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, " ") // hashtags
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "")
        .trim();
    // "Video title - YouTube", "Post | Site name": keep the part before the site name
    text = text.replace(/\s+[-–|·]\s+(YouTube|Instagram|TikTok|X|Twitter|LinkedIn|Medium|Reddit)$/i, "").trim();
    if (text.length < 2) return null;
    if (text.length <= MAX) return text;
    const cut = text.slice(0, MAX);
    return cut.slice(0, cut.lastIndexOf(" ") > MAX * 0.6 ? cut.lastIndexOf(" ") : MAX).trim();
}

const KIND: Record<string, string> = {
    youtube: "YouTube video",
    reel: "Instagram reel",
    tiktok: "TikTok video",
    tweet: "Post",
    url: "Link",
};

/** Shown until the memory is processed, e.g. "YouTube video", "Link from nytimes.com" or a note's first line. */
export function provisionalTitle(type: string, sourceUrl: string | null, note?: string | null, fileName?: string | null): string {
    if (note?.trim()) return cleanTitle(note) ?? "Note";
    if (fileName) return cleanTitle(fileName.replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[_-]+/g, " ")) ?? "File";
    if (sourceUrl) {
        let host = "";
        try {
            host = new URL(sourceUrl).hostname.replace(/^www\./, "");
        } catch {
            /* not a URL */
        }
        if (type === "url") return host ? `Link from ${host}` : "Link";
        return KIND[type] ?? "Link";
    }
    return "Untitled";
}
