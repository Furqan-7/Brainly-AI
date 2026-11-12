import { NextFunction, Request, Response } from "express";
import { prisma } from "db";
import { AUTH_COOKIE, verifySessionToken } from "./lib/auth";

/**
 * The web app authenticates with an httpOnly cookie. The browser extension and other API
 * clients send the token in an `Authorization: Bearer` header (or the legacy `token` header).
 */
function readToken(req: Request): string | null {
    // An explicit token wins: browsers can attach a stale site cookie to extension requests
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) return auth.slice(7);

    const cookieToken = req.cookies?.[AUTH_COOKIE];
    if (typeof cookieToken === "string" && cookieToken) return cookieToken;

    const legacy = req.headers.token;
    if (typeof legacy === "string" && legacy) return legacy;

    return null;
}

/** How often a device's "last used" time is written (not on every request) */
const TOUCH_EVERY_MS = 60 * 60 * 1000;

/**
 * Signs the request in. Besides the token's signature and expiry this checks the database, so a
 * token stops working when the account is deleted, after "sign out everywhere" / a password
 * reset (tokenVersion), or when its extension is signed out in Settings → Connected devices.
 */
export async function MiddleWhere(req: Request, res: Response, next: NextFunction) {
    const token = readToken(req);
    if (!token) {
        return res.status(401).json({ message: "Not signed in", success: false });
    }

    const claims = verifySessionToken(token);
    if (!claims) {
        return res.status(401).json({ message: "Invalid or Expired Token", success: false });
    }

    const { userId, tokenVersion, deviceId } = claims;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            tokenVersion: true,
            ...(deviceId ? { devices: { where: { id: deviceId }, select: { id: true, lastUsedAt: true } } } : {}),
        },
    });
    const device = deviceId ? (user as { devices?: { id: string; lastUsedAt: Date }[] } | null)?.devices?.[0] : undefined;
    if (!user || user.tokenVersion !== tokenVersion || (deviceId && !device)) {
        return res.status(401).json({ message: "Signed out. Sign in again.", success: false });
    }

    if (device && Date.now() - device.lastUsedAt.getTime() > TOUCH_EVERY_MS) {
        prisma.device.update({ where: { id: device.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
    }

    res.locals.userId = userId;
    res.locals.deviceId = deviceId;
    next();
}
