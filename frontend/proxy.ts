import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends visitors on the production *.vercel.app address to the custom domain (the host in
 * NEXT_PUBLIC_SITE_URL, e.g. brainlyai.me), so links, sign-ins and the address bar stay there.
 *
 * Left alone: preview deployments (VERCEL_ENV=preview), local development, and the API proxy
 * (/backend), because the browser extension and OAuth callbacks may still call the old address.
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

    const url = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical.origin);
    return NextResponse.redirect(url, 308);
}

export const config = {
    // Pages only: not the API proxy, Next's own files or static assets
    matcher: ["/((?!backend/|api/|_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|webmanifest|js|css|txt|xml)$).*)"],
};
