import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE = "brainly_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(userId: number, username: string, expiresIn: jwt.SignOptions["expiresIn"] = "7d"): string {
    return jwt.sign({ userId, username }, process.env.JWT_TOKEN as string, { expiresIn });
}

/** The web app's address (CLIENT_URL may list several origins; the first is the main one). */
export function clientUrl(): string {
    return (process.env.CLIENT_URL ?? "http://localhost:3000").split(",")[0].trim().replace(/\/+$/, "");
}

/**
 * Whether the visitor's browser is on HTTPS. A `Secure` cookie sent to a page on plain HTTP
 * is silently dropped by the browser, which signs the user straight back out, so this follows
 * the page the visitor is actually on rather than NODE_ENV.
 */
function isHttps(req: Request): boolean {
    const origin = req.get("origin");
    if (origin && origin !== "null") return origin.startsWith("https://");
    const forwardedProto = req.get("x-forwarded-proto");
    if (forwardedProto) return forwardedProto.split(",")[0].trim() === "https";
    if (req.secure) return true;
    return clientUrl().startsWith("https://");
}

function cookieOptions(req: Request): CookieOptions {
    const secure = isHttps(req);
    // The web app proxies the API through its own domain (/backend), so the cookie is
    // first-party and Lax works everywhere. SameSite=None is only valid together with Secure.
    let sameSite = (process.env.COOKIE_SAMESITE?.toLowerCase() || "lax") as CookieOptions["sameSite"];
    if (sameSite === "none" && !secure) sameSite = "lax";
    return { httpOnly: true, secure, sameSite, path: "/" };
}

export function setAuthCookie(req: Request, res: Response, token: string) {
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions(req), maxAge: SEVEN_DAYS_MS });
}

export function clearAuthCookie(req: Request, res: Response) {
    res.clearCookie(AUTH_COOKIE, cookieOptions(req));
}

/**
 * A one-minute token that hands an OAuth sign-in over to the web app. The OAuth callback may
 * be reached on the API's own domain (when GOOGLE_CALLBACK_URL / GITHUB_CALLBACK_URL point
 * there), where a cookie would never reach the web app; the web app trades this token for a
 * session cookie on its own domain through the /backend proxy.
 */
export function signHandoffToken(userId: number, username: string): string {
    return jwt.sign({ userId, username, purpose: "oauth-handoff" }, process.env.JWT_TOKEN as string, { expiresIn: "60s" });
}

export function verifyHandoffToken(token: string): { userId: number; username: string } | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN as string);
        if (typeof decoded !== "object" || decoded.purpose !== "oauth-handoff" || typeof decoded.userId !== "number") return null;
        return { userId: decoded.userId, username: String(decoded.username ?? "") };
    } catch {
        return null;
    }
}
