import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

export const AUTH_COOKIE = "brainly_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function signToken(userId: number, username: string, expiresIn: jwt.SignOptions["expiresIn"] = "7d"): string {
    return jwt.sign({ userId, username }, process.env.JWT_TOKEN as string, { expiresIn });
}

function cookieOptions(): CookieOptions {
    const isProd = process.env.NODE_ENV === "production";
    // Frontend and API usually live on different sites in production (e.g. Vercel + Render),
    // which requires SameSite=None; Secure for the browser to send the cookie.
    const sameSite = (process.env.COOKIE_SAMESITE as CookieOptions["sameSite"]) ?? (isProd ? "none" : "lax");
    return {
        httpOnly: true,
        secure: isProd || sameSite === "none",
        sameSite,
        path: "/",
    };
}

export function setAuthCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), maxAge: SEVEN_DAYS_MS });
}

export function clearAuthCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE, cookieOptions());
}
