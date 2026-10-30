const TRACKING_PARAMS = /^(utm_\w+|fbclid|gclid|igsh|igshid|si|ref|ref_src|s|t\b|feature|mc_cid|mc_eid)$/i;

/**
 * Canonical form of a URL, used to detect when the same thing is saved twice.
 * Drops tracking params, the fragment and trailing slashes; keeps meaningful params (e.g. YouTube's v).
 */
export function normalizeUrl(raw: string): string {
    let url: URL;
    try {
        url = new URL(raw.trim());
    } catch {
        return raw.trim();
    }
    url.hostname = url.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, "");
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
        if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
    }
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";

    // youtu.be/ID and youtube.com/shorts/ID -> youtube.com/watch?v=ID
    const ytId = youtubeId(url.toString());
    if (ytId) return `https://youtube.com/watch?v=${ytId}`;

    // instagram.com/reels/ID -> instagram.com/reel/ID
    url.pathname = url.pathname.replace(/^\/reels\//, "/reel/");
    return url.toString().replace(/\/$/, "");
}

export function youtubeId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
    return match?.[1] ?? null;
}

export function isTikTokUrl(url: string): boolean {
    return /^https?:\/\/([\w-]+\.)?tiktok\.com\//i.test(url);
}
