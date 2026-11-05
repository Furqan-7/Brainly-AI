import { NextRequest, NextResponse } from "next/server";

/**
 * Session endpoints on the web app's own domain: /session/signin, /session/signup,
 * /session/oauth (Google/GitHub handoff code) and /session/logout.
 *
 * They call the API server-to-server and set the login cookie here, so the browser only
 * ever receives a first-party cookie from this site. Nothing depends on cookies crossing
 * domains or surviving a proxy hop, which is what kept logging people straight back out.
 */

const BACKEND_URL = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API ?? "http://localhost:3001").replace(/\/+$/, "");
const COOKIE = "brainly_token"; // the name the API reads (backend/src/lib/auth.ts)
const SEVEN_DAYS = 7 * 24 * 60 * 60;

const UPSTREAM: Record<string, string> = {
    signin: "/signin",
    signup: "/signup",
    oauth: "/auth/exchange",
};

// A sleeping free-tier API can take a while to wake up
export const maxDuration = 60;

function cookieOptions(maxAge: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge,
    };
}

/** Pulls the session token out of the API's Set-Cookie headers. */
function tokenFrom(setCookies: string[]): string | null {
    for (const c of setCookies) {
        const match = c.match(new RegExp(`^${COOKIE}=([^;]+)`));
        if (match && match[1]) return decodeURIComponent(match[1]);
    }
    return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
    const { action } = await params;

    if (action === "logout") {
        const res = NextResponse.json({ success: true });
        res.cookies.set(COOKIE, "", cookieOptions(0));
        return res;
    }

    const path = UPSTREAM[action];
    if (!path) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    let upstream: Response;
    try {
        upstream = await fetch(BACKEND_URL + path, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                // keep the visitor's IP for the API's rate limiting
                "x-forwarded-for": req.headers.get("x-forwarded-for") ?? "",
                "user-agent": req.headers.get("user-agent") ?? "",
            },
            body: await req.text(),
            cache: "no-store",
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "Brainly's server isn't responding right now. Please try again in a minute." },
            { status: 502 },
        );
    }

    const data = await upstream.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: upstream.status });

    if (upstream.ok) {
        const token = tokenFrom(upstream.headers.getSetCookie());
        if (!token) {
            return NextResponse.json({ success: false, message: "Couldn't start your session. Please try again." }, { status: 502 });
        }
        res.cookies.set(COOKIE, token, cookieOptions(SEVEN_DAYS));
    }
    return res;
}
