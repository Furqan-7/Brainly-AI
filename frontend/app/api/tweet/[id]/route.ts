import { embedToken, normalizeTweet } from "../../../lib/tweet";

/**
 * GET /api/tweet/<id>
 * A saved X post's author, text, photos and counts, for the library card. Fetched on the server
 * (X's embed endpoint doesn't allow browser requests) and cached by the CDN for a day.
 */
export const runtime = "nodejs";

function reply(body: unknown, status: number, cacheSeconds: number) {
    return Response.json(body, {
        status,
        headers: { "Cache-Control": `public, max-age=${Math.min(cacheSeconds, 3600)}, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 7}` },
    });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!/^\d{1,25}$/.test(id)) return reply({ message: "Invalid tweet id" }, 400, 3600);

    try {
        const res = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en&token=${embedToken(id)}`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(8000),
            next: { revalidate: 86_400 },
        });
        // Deleted or private posts: remember that for an hour, then check again
        if (res.status === 404) return reply({ message: "Post not available" }, 404, 3600);
        if (!res.ok) return reply({ message: "X didn't answer" }, 502, 60);
        const text = await res.text();
        const tweet = text ? normalizeTweet(JSON.parse(text)) : null;
        if (!tweet) return reply({ message: "Post not available" }, 404, 3600);
        return reply(tweet, 200, 86_400);
    } catch {
        return reply({ message: "X didn't answer" }, 502, 60);
    }
}
