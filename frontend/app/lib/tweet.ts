/**
 * Tweets (X posts) for the library cards. Data comes from X's public embed endpoint, the same one
 * embedded tweets on websites use, so no API key is needed. Normalised to a small shape here so
 * the card doesn't depend on X's raw format.
 */

export interface TweetMedia {
    type: "photo" | "video" | "gif";
    /** Photo URL, or the poster frame for videos and GIFs */
    url: string;
    width: number;
    height: number;
}

/** Tweet text split into plain text and links, in order */
export type TweetPart =
    | { kind: "text"; text: string }
    | { kind: "link"; text: string; href: string };

export interface TweetData {
    id: string;
    url: string;
    author: { name: string; handle: string; avatar: string; verified: boolean };
    parts: TweetPart[];
    media: TweetMedia[];
    createdAt: string;
    likes: number;
    replies: number;
    quoted: Omit<TweetData, "quoted"> | null;
}

/** The numeric id in an x.com / twitter.com status link */
export function tweetIdFromUrl(url: string | null | undefined): string | null {
    return url?.match(/(?:twitter|x)\.com\/[^/]+\/status(?:es)?\/(\d+)/i)?.[1] ?? null;
}

/** The token X's embed endpoint expects, derived from the tweet id */
export function embedToken(id: string): string {
    return ((Number(id) / 1e15) * Math.PI).toString(6 ** 2).replace(/(0+|\.)/g, "");
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

interface RawEntity { indices: [number, number] }
interface RawTweet {
    __typename?: string;
    id_str: string;
    text: string;
    display_text_range?: [number, number];
    created_at: string;
    favorite_count?: number;
    conversation_count?: number;
    user: { name: string; screen_name: string; profile_image_url_https: string; verified?: boolean; is_blue_verified?: boolean };
    entities?: {
        urls?: (RawEntity & { display_url: string; expanded_url: string })[];
        user_mentions?: (RawEntity & { screen_name: string })[];
        hashtags?: (RawEntity & { text: string })[];
        symbols?: (RawEntity & { text: string })[];
        media?: RawEntity[];
    };
    mediaDetails?: { type: string; media_url_https: string; original_info?: { width: number; height: number } }[];
    quoted_tweet?: RawTweet;
}

/** Splits the text into plain text and links (URLs, @mentions, #hashtags, $cashtags) */
function textParts(t: RawTweet): TweetPart[] {
    // X's indices count Unicode code points, so work on code points, not UTF-16 units
    const chars = Array.from(t.text);
    const [start, end] = t.display_text_range ?? [0, chars.length];
    const e = t.entities ?? {};
    const links = [
        ...(e.urls ?? []).map((u) => ({ at: u.indices, text: u.display_url, href: u.expanded_url })),
        ...(e.user_mentions ?? []).map((m) => ({ at: m.indices, text: `@${m.screen_name}`, href: `https://x.com/${m.screen_name}` })),
        ...(e.hashtags ?? []).map((h) => ({ at: h.indices, text: `#${h.text}`, href: `https://x.com/hashtag/${encodeURIComponent(h.text)}` })),
        ...(e.symbols ?? []).map((s) => ({ at: s.indices, text: `$${s.text}`, href: `https://x.com/search?q=%24${encodeURIComponent(s.text)}` })),
    ]
        .filter((l) => l.at[0] >= start && l.at[1] <= end)
        .sort((a, b) => a.at[0] - b.at[0]);

    const parts: TweetPart[] = [];
    let pos = start;
    for (const link of links) {
        if (link.at[0] < pos) continue; // overlapping entity
        if (link.at[0] > pos) parts.push({ kind: "text", text: decode(chars.slice(pos, link.at[0]).join("")) });
        parts.push({ kind: "link", text: link.text, href: link.href });
        pos = link.at[1];
    }
    if (pos < end) parts.push({ kind: "text", text: decode(chars.slice(pos, end).join("")) });
    // Drop trailing whitespace left where the media link was cut off
    const last = parts.at(-1);
    if (last?.kind === "text") last.text = last.text.trimEnd();
    return parts.filter((p) => p.text);
}

function normalizeOne(t: RawTweet): Omit<TweetData, "quoted"> {
    return {
        id: t.id_str,
        url: `https://x.com/${t.user.screen_name}/status/${t.id_str}`,
        author: {
            name: t.user.name,
            handle: t.user.screen_name,
            // "_normal" is 48px; "_bigger" is sharper on high-density screens
            avatar: t.user.profile_image_url_https.replace("_normal.", "_bigger."),
            verified: Boolean(t.user.verified || t.user.is_blue_verified),
        },
        parts: textParts(t),
        media: (t.mediaDetails ?? []).slice(0, 4).map((m) => ({
            type: m.type === "animated_gif" ? "gif" : m.type === "video" ? "video" : "photo",
            url: m.media_url_https,
            width: m.original_info?.width ?? 1200,
            height: m.original_info?.height ?? 675,
        })),
        createdAt: new Date(t.created_at).toISOString(),
        likes: t.favorite_count ?? 0,
        replies: t.conversation_count ?? 0,
    };
}

/** Turns X's embed response into TweetData; null for deleted, private or age-restricted posts. */
export function normalizeTweet(raw: unknown): TweetData | null {
    const t = raw as RawTweet | null;
    if (!t || t.__typename === "TweetTombstone" || !t.id_str || !t.user) return null;
    const quoted = t.quoted_tweet?.user ? normalizeOne(t.quoted_tweet) : null;
    return { ...normalizeOne(t), quoted };
}

/** 1.2K, 15K, 1.3M */
export function compactCount(n: number): string {
    return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
