import type { NextRequest } from "next/server";
import { BACKEND_URL } from "../../lib/site";
import { isPublicHost, parsePublicUrl } from "../../lib/safeUrl";
import { screenshotSite } from "../../lib/screenshot";

/**
 * GET /api/preview?url=https://example.com
 * A screenshot of a saved website, like the previews Vercel shows for deployments. Rendered with
 * headless Chrome on first request, then served from the CDN cache.
 */
export const runtime = "nodejs";
export const maxDuration = 30;

const AUTH_COOKIE = "brainly_token";

function fail(status: number, message: string, cacheSeconds = 0) {
    return new Response(message, {
        status,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": cacheSeconds ? `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}` : "no-store",
        },
    });
}

/** Only signed-in users can trigger new screenshots, so the endpoint can't be used as a free screenshot API. */
async function isSignedIn(req: NextRequest) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) return false;
    try {
        const res = await fetch(`${BACKEND_URL}/api/me`, {
            headers: { cookie: `${AUTH_COOKIE}=${token}` },
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function GET(req: NextRequest) {
    const url = parsePublicUrl(req.nextUrl.searchParams.get("url"));
    if (!url) return fail(400, "A public http(s) URL is required", 86400);
    if (!(await isSignedIn(req))) return fail(401, "Sign in to load website previews");
    if (!(await isPublicHost(url.hostname))) return fail(400, "That address isn't public", 86400);

    try {
        const image = await screenshotSite(url);
        return new Response(Buffer.from(image), {
            headers: {
                "Content-Type": "image/jpeg",
                // Browsers keep it a day; Vercel's CDN keeps it a week and refreshes it in the background
                "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
            },
        });
    } catch (err) {
        console.error("[preview] screenshot failed", url.href, err);
        // Cached briefly so a broken site isn't re-rendered on every page view
        return fail(502, "Couldn't capture this website", 3600);
    }
}
