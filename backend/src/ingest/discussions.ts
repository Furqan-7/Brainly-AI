import { JSDOM, VirtualConsole } from "jsdom";
import { safeGet } from "../lib/safeFetch";

/**
 * Hacker News and Reddit threads: the post plus its top comments, which is usually where the
 * value is. Both have public JSON APIs, so no login or key is needed. Callers fall back to the
 * ordinary page reader if these fail (Reddit, for one, refuses some server addresses).
 */

export interface Discussion {
    text: string;
    title: string | null;
    description: string | null;
    author: string | null;
    siteName: string;
    image: string | null;
}

type GetJson = (url: string) => Promise<any>;

const defaultGet: GetJson = async (url) => (await safeGet(url, { timeout: 10000 })).data;

const MAX_COMMENTS = 15;
const MAX_COMMENT_CHARS = 1500;

/** HN and Reddit send comment bodies as HTML; this keeps paragraphs and drops tags. */
export function htmlToPlain(html: string | null | undefined): string {
    if (!html) return "";
    const doc = new JSDOM(`<body>${html.replace(/<p>/gi, "\n\n<p>")}</body>`, { virtualConsole: new VirtualConsole() }).window.document;
    return (doc.body.textContent ?? "").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

function clip(text: string, max = MAX_COMMENT_CHARS): string {
    return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

function commentsBlock(comments: { author: string | null; text: string }[]): string | null {
    const lines = comments.filter((c) => c.text).map((c) => `- ${c.author ? `${c.author}: ` : ""}${clip(c.text)}`);
    return lines.length ? `Top comments:\n${lines.join("\n")}` : null;
}

// ─── Hacker News ─────────────────────────────────────────────────────────────

export function hackerNewsId(url: string): number | null {
    const m = url.match(/^https?:\/\/(?:www\.)?news\.ycombinator\.com\/item\?(?:.*&)?id=(\d+)/i);
    return m ? Number(m[1]) : null;
}

export async function fetchHackerNews(url: string, get: GetJson = defaultGet): Promise<Discussion> {
    const id = hackerNewsId(url);
    if (!id) throw new Error("Not a Hacker News item URL");
    const item = (u: number) => get(`https://hacker-news.firebaseio.com/v0/item/${u}.json`);

    const post = await item(id);
    if (!post || post.deleted || post.dead) throw new Error("Hacker News item not found");

    // A link to a comment opens the comment with its replies; a story with its discussion
    const kids: number[] = Array.isArray(post.kids) ? post.kids.slice(0, MAX_COMMENTS) : [];
    const replies = (await Promise.all(kids.map((k) => item(k).catch(() => null))))
        .filter((c) => c && !c.deleted && !c.dead && c.text)
        .map((c) => ({ author: c.by ?? null, text: htmlToPlain(c.text) }));

    const body = htmlToPlain(post.text);
    const title: string | null = post.title ?? (body ? body.slice(0, 80) : null);
    const text = [
        title && `Hacker News: ${title}`,
        post.by && `Posted by ${post.by}${typeof post.score === "number" ? ` · ${post.score} points` : ""}`,
        post.url && `Link: ${post.url}`,
        body,
        commentsBlock(replies),
    ].filter(Boolean).join("\n\n");

    return {
        text,
        title,
        description: body ? clip(body, 280) : post.url ? `Discussion of ${post.url}` : null,
        author: post.by ?? null,
        siteName: "Hacker News",
        image: null,
    };
}

// ─── Reddit ──────────────────────────────────────────────────────────────────

/** reddit.com/r/<sub>/comments/<id>/… (www., old., new. and np. too); share links (/s/…) aren't covered. */
export function redditThread(url: string): { sub: string; id: string } | null {
    const m = url.match(/^https?:\/\/(?:(?:www|old|new|np)\.)?reddit\.com\/r\/(\w+)\/comments\/(\w+)/i);
    return m ? { sub: m[1], id: m[2] } : null;
}

export async function fetchReddit(url: string, get: GetJson = defaultGet): Promise<Discussion> {
    const thread = redditThread(url);
    if (!thread) throw new Error("Not a Reddit thread URL");
    const data = await get(`https://www.reddit.com/r/${thread.sub}/comments/${thread.id}.json?limit=${MAX_COMMENTS}&depth=1&sort=top&raw_json=1`);
    const post = data?.[0]?.data?.children?.[0]?.data;
    if (!post?.title) throw new Error("Reddit thread not found");

    const comments = ((data?.[1]?.data?.children ?? []) as any[])
        .filter((c) => c?.kind === "t1" && c.data?.body && !c.data.stickied && c.data.body !== "[deleted]" && c.data.body !== "[removed]")
        .slice(0, MAX_COMMENTS)
        .map((c) => ({ author: c.data.author && c.data.author !== "[deleted]" ? `u/${c.data.author}` : null, text: String(c.data.body).trim() }));

    const selftext = String(post.selftext ?? "").trim();
    const linksOut = post.url && !post.is_self && !String(post.url).includes(`/comments/${thread.id}`);
    const author = post.author && post.author !== "[deleted]" ? `u/${post.author}` : null;
    const sub = post.subreddit_name_prefixed ?? `r/${thread.sub}`;
    // Reddit's thumbnail field is "self" / "default" / "nsfw" when there is no picture
    const image = post.preview?.images?.[0]?.source?.url ?? (/^https?:\/\//.test(post.thumbnail ?? "") ? post.thumbnail : null);

    const text = [
        `Reddit post in ${sub}: ${post.title}`,
        author && `Posted by ${author}${typeof post.score === "number" ? ` · ${post.score} points` : ""}`,
        linksOut && `Link: ${post.url}`,
        selftext,
        commentsBlock(comments),
    ].filter(Boolean).join("\n\n");

    return {
        text,
        title: post.title,
        description: selftext ? clip(selftext, 280) : linksOut ? `Discussion of ${post.url}` : null,
        author,
        siteName: sub,
        image: post.over_18 ? null : image,
    };
}

/** The discussion fetcher for a URL, or null if it isn't a Hacker News or Reddit thread. */
export function discussionFetcher(url: string): ((url: string) => Promise<Discussion>) | null {
    if (hackerNewsId(url)) return fetchHackerNews;
    if (redditThread(url)) return fetchReddit;
    return null;
}
