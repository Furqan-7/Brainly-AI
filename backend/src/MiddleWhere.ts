import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE } from "./lib/auth";

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

export function MiddleWhere(req: Request, res: Response, next: NextFunction) {
    const token = readToken(req);

    if (!token) {
        return res.status(401).json({ message: "Not signed in", success: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN as string);

        if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
            return res.status(401).json({ message: "Invalid Token", success: false });
        }
        res.locals.userId = decoded.userId;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or Expired Token", success: false });
    }
}
