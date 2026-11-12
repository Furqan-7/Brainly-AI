import crypto from "node:crypto";
import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE = "brainly_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const secret = () => process.env.JWT_TOKEN as string;

export interface SignTokenOptions {
    expiresIn?: jwt.SignOptions["expiresIn"];
    /** The user's current tokenVersion; "sign out everywhere" bumps it to cancel older tokens */
    tokenVersion?: number;
    /** Set for the browser extension: the Device row that can be signed out on its own */
    deviceId?: string;
}

export function signToken(userId: number, username: string, { expiresIn = "7d", tokenVersion = 0, deviceId }: SignTokenOptions = {}): string {
    return jwt.sign({ userId, username, v: tokenVersion, ...(deviceId ? { did: deviceId } : {}) }, secret(), { expiresIn });
}

export interface SessionClaims {
    userId: number;
    /** Tokens issued before tokenVersion existed carry none, which counts as 0 */
    tokenVersion: number;
    deviceId?: string;
}

/** Reads a sign-in token (cookie or extension). Purpose-bound tokens (reset links etc.) never pass. */
export function verifySessionToken(token: string): SessionClaims | null {
    try {
        const decoded = jwt.verify(token, secret());
        if (typeof decoded !== "object" || typeof decoded.userId !== "number" || decoded.purpose) return null;
        return {
            userId: decoded.userId,
            tokenVersion: typeof decoded.v === "number" ? decoded.v : 0,
            deviceId: typeof decoded.did === "string" ? decoded.did : undefined,
        };
    } catch {
        return null;
    }
}

// ─── Email links ─────────────────────────────────────────────────────────────

/**
 * Password reset links are signed with a key that includes the current password hash, so a
 * link stops working as soon as it has been used (or the password changes another way).
 */
function resetKey(passwordHash: string | null): string {
    const fingerprint = crypto.createHash("sha256").update(passwordHash ?? "no-password").digest("hex");
    return `${secret()}:reset:${fingerprint}`;
}

export const RESET_LINK_MINUTES = 60;

export function signPasswordResetToken(user: { id: number; password: string | null }): string {
    return jwt.sign({ userId: user.id, purpose: "password-reset" }, resetKey(user.password), { expiresIn: `${RESET_LINK_MINUTES}m` });
}

/** The user a reset link is for, without checking it yet (the key depends on that user). */
export function passwordResetUserId(token: string): number | null {
    const decoded = jwt.decode(token);
    return decoded && typeof decoded === "object" && decoded.purpose === "password-reset" && typeof decoded.userId === "number"
        ? decoded.userId
        : null;
}

export function verifyPasswordResetToken(token: string, user: { id: number; password: string | null }): boolean {
    try {
        const decoded = jwt.verify(token, resetKey(user.password));
        return typeof decoded === "object" && decoded.purpose === "password-reset" && decoded.userId === user.id;
    } catch {
        return false;
    }
}

export function signEmailVerificationToken(userId: number, email: string): string {
    return jwt.sign({ userId, email, purpose: "verify-email" }, secret(), { expiresIn: "3d" });
}

export function verifyEmailVerificationToken(token: string): { userId: number; email: string } | null {
    try {
        const decoded = jwt.verify(token, secret());
        if (typeof decoded !== "object" || decoded.purpose !== "verify-email" || typeof decoded.userId !== "number") return null;
        return { userId: decoded.userId, email: String(decoded.email ?? "") };
    } catch {
        return null;
    }
}

/** The web app address a request came from (for links in emails), or the main one. */
export function requestOrigin(req: Request): string {
    return allowedClientOrigin(req.get("origin")) ?? allowedClientOrigin(req.get("referer")) ?? clientUrl();
}

/** Every address the web app is served from (CLIENT_URL may list several origins). */
export function clientOrigins(): string[] {
    return (process.env.CLIENT_URL ?? "http://localhost:3000").split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean);
}

/** The web app's main address: the first one in CLIENT_URL. */
export function clientUrl(): string {
    return clientOrigins()[0] ?? "http://localhost:3000";
}

/** `url`'s origin, if it is one of the web app's own addresses */
export function allowedClientOrigin(url: string | undefined | null): string | null {
    if (!url) return null;
    try {
        const origin = new URL(url).origin;
        return clientOrigins().includes(origin) ? origin : null;
    } catch {
        return null;
    }
}

/**
 * OAuth `state`: remembers which of the web app's addresses sign-in started from (e.g. the
 * custom domain rather than the vercel.app one), signed so it can't point anywhere else.
 */
export function signOAuthState(origin: string): string {
    return jwt.sign({ origin, purpose: "oauth-state" }, process.env.JWT_TOKEN as string, { expiresIn: "15m" });
}

export function verifyOAuthState(state: unknown): string | null {
    if (typeof state !== "string" || !state) return null;
    try {
        const decoded = jwt.verify(state, process.env.JWT_TOKEN as string);
        if (typeof decoded !== "object" || decoded.purpose !== "oauth-state") return null;
        return allowedClientOrigin(decoded.origin);
    } catch {
        return null;
    }
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
