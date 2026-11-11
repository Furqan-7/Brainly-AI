import { NextResponse, type NextRequest } from "next/server";

/**
 * The OAuth hand-off (see backend/src/routes/auth.ts): it sets the session cookie on whichever
 * address it is reached on, then sends the browser to /chat there.
 */
const OAUTH_COMPLETE = "/backend/auth/complete";

/**
 * Sends visitors on the production *.vercel.app address to the custom domain (the host in
 * NEXT_PUBLIC_SITE_URL, e.g. brainlyai.me), so links, sign-ins and the address bar stay there.
 *
 * The OAuth hand-off moves too: Google / GitHub sign-in can come back to the vercel.app address
 * (when the backend's CLIENT_URL doesn't list the domain), and setting the cookie there would
 * leave the user signed out on the domain, bouncing between /chat and the sign-in page.
 *
 * Left alone: preview deployments (VERCEL_ENV=preview), local development, and the rest of the
 * API proxy (/backend), because the browser extension may still call the old address.
 */
export function proxy(request: NextRequest) {
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    if (!site || process.env.VERCEL_ENV !== "production") return NextResponse.next();

    let canonical: URL;
    try {
        canonical = new URL(site);
    } catch {
        return NextResponse.next();
    }
    const host = request.headers.get("host") ?? "";
    if (host === canonical.host || !host.endsWith(".vercel.app")) return NextResponse.next();

    const { pathname, search } = request.nextUrl;
    if (pathname.startsWith("/backend/") && pathname !== OAUTH_COMPLETE) return NextResponse.next();

    // 307 for the one-time hand-off so browsers never cache it; 308 for pages
    const status = pathname === OAUTH_COMPLETE ? 307 : 308;
    return NextResponse.redirect(new URL(pathname + search, canonical.origin), status);
}

export const config = {
    matcher: [
        // Pages only: not the API proxy, Next's own files or static assets
        "/((?!backend/|api/|_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|webmanifest|js|css|txt|xml)$).*)",
        // …except the OAuth hand-off, so the session cookie is set on the custom domain
        "/backend/auth/complete",
    ],
};
