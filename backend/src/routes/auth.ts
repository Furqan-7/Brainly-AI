import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { prisma } from "db";
import passport from "../config/passport";
import { signinSchema, signupSchema } from "../types";
import { MiddleWhere } from "../MiddleWhere";
import { clearAuthCookie, clientUrl, setAuthCookie, signHandoffToken, signToken, verifyHandoffToken } from "../lib/auth";
import { getUsage } from "../lib/plans";
import { log } from "../lib/logger";

export const authRouter: Router = Router();

// Brute-force protection for password endpoints: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

function oauthCallback(req: Request, res: Response) {
    const user = req.user as any;
    // The callback may run on the API's own domain, where a cookie never reaches the web app
    // (and /chat would bounce the user back to the landing page). Hand the sign-in over to
    // the web app instead: it trades this short-lived token for a session cookie on its own
    // domain through the /backend proxy.
    const handoff = encodeURIComponent(signHandoffToken(user.id, user.username));
    res.redirect(`${clientUrl()}/backend/auth/complete?token=${handoff}`);
}

authRouter.get("/auth/complete", (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const user = verifyHandoffToken(token);
    if (!user) return res.redirect(`${clientUrl()}/auth/signin?error=oauth`);
    setAuthCookie(req, res, signToken(user.userId, user.username));
    // Relative, so the browser stays on whichever web app address it came through
    return res.redirect("/chat");
});

if (process.env.GOOGLE_CLIENT_ID) {
    authRouter.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    authRouter.get("/auth/google/callback", passport.authenticate("google", { session: false }), oauthCallback);
}
if (process.env.GITHUB_CLIENT_ID) {
    authRouter.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
    authRouter.get("/auth/github/callback", passport.authenticate("github", { session: false }), oauthCallback);
}

authRouter.post("/signup", authLimiter, async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({ message: "Invalid input", success: false });
    }
    const { username, email, password } = parsed.data;

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: "User already exists with this email", success: false });
        }

        const user = await prisma.user.create({
            data: { username, email, password: await bcrypt.hash(password, 10) },
        });

        setAuthCookie(req, res, signToken(user.id, user.username));
        return res.status(200).json({ message: "User created successfully", username: user.username, id: user.id, success: true });
    } catch (e) {
        log("error", "signup failed", { error: e instanceof Error ? e.message : String(e) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

authRouter.post("/signin", authLimiter, async (req, res) => {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({ message: "Invalid Format", success: false });
    }
    const { email, password } = parsed.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid user", success: false });
        }
        // OAuth-only accounts have no password
        if (!user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(402).json({ message: "Incorrect Password", success: false });
        }

        setAuthCookie(req, res, signToken(user.id, user.username));
        return res.status(200).json({ message: "User logged in successfully", success: true, username: user.username, id: user.id });
    } catch (e) {
        log("error", "signin failed", { error: e instanceof Error ? e.message : String(e) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

authRouter.post("/logout", (req, res) => {
    clearAuthCookie(req, res);
    return res.status(200).json({ success: true });
});

authRouter.get("/api/me", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, isPremium: true, createdAt: true },
    });
    if (!user) {
        clearAuthCookie(req, res);
        return res.status(401).json({ message: "Not signed in", success: false });
    }
    const { plan, memoryCount, chatsToday } = await getUsage(userId);
    return res.status(200).json({ success: true, user, plan, usage: { memoryCount, chatsToday } });
});

/** A long-lived token for the browser extension, which can't use the site's cookie. */
authRouter.post("/api/extension-token", MiddleWhere, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: res.locals.userId }, select: { id: true, username: true } });
    if (!user) return res.status(401).json({ message: "Not signed in", success: false });
    return res.status(200).json({ success: true, token: signToken(user.id, user.username, "90d") });
});
