import crypto from "node:crypto";
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { prisma } from "db";
import passport from "../config/passport";
import { forgotPasswordSchema, resetPasswordSchema, signinSchema, signupSchema, verifyEmailSchema } from "../types";
import { MiddleWhere } from "../MiddleWhere";
import {
    allowedClientOrigin, clearAuthCookie, clientUrl, passwordResetUserId, requestOrigin, setAuthCookie,
    signEmailVerificationToken, signHandoffToken, signOAuthState, signPasswordResetToken, signToken,
    verifyEmailVerificationToken, verifyHandoffToken, verifyOAuthState, verifyPasswordResetToken,
} from "../lib/auth";
import { getUsage } from "../lib/plans";
import { log } from "../lib/logger";
import { describeUserAgent } from "../lib/devices";
import { sendEmailLater } from "../lib/mailer";
import { passwordResetMessage, verifyEmailMessage } from "../lib/emails";

export const authRouter: Router = Router();

// Brute-force protection for password endpoints: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
// Endpoints that send an email: 5 per 15 minutes per IP, so nobody can flood an inbox
export const emailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { message: "Too many emails requested. Wait a few minutes and try again.", success: false } });

/** Emails a link that confirms the address. */
export function sendVerificationEmail(req: Request, user: { id: number; email: string; username: string }) {
    const link = `${requestOrigin(req)}/auth/verify?token=${encodeURIComponent(signEmailVerificationToken(user.id, user.email))}`;
    sendEmailLater(verifyEmailMessage(user.email, user.username, link));
}

/** Email lookups ignore case: people type "Me@Gmail.com" one day and "me@gmail.com" the next */
function findUserByEmail(email: string) {
    return prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: "insensitive" } }, orderBy: { id: "asc" } });
}

function oauthCallback(req: Request, res: Response) {
    const user = req.user as any;
    // The callback may run on the API's own domain, where a cookie never reaches the web app
    // (and /chat would bounce the user back to the landing page). Hand the sign-in over to
    // the web app instead: it trades this short-lived token for a session cookie on its own
    // domain through the /backend proxy.
    const handoff = encodeURIComponent(signHandoffToken(user.id, user.username));
    // Back to the address sign-in started from (brainlyai.me, not the vercel.app one)
    const origin = verifyOAuthState(req.query.state) ?? clientUrl();
    res.redirect(`${origin}/backend/auth/complete?token=${handoff}`);
}

/**
 * Starts an OAuth sign-in, remembering which web app address the user is on. The request comes
 * through that address's /backend proxy, so the page's own URL is in Referer (or Origin).
 */
function startOAuth(provider: "google" | "github", scope: string[]) {
    return (req: Request, res: Response, next: () => void) => {
        const origin = allowedClientOrigin(req.get("referer")) ?? allowedClientOrigin(req.get("origin")) ?? clientUrl();
        passport.authenticate(provider, { scope, state: signOAuthState(origin), session: false })(req, res, next);
    };
}

authRouter.get("/auth/complete", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const user = verifyHandoffToken(token);
    // Relative, like the success path: this runs through the web app address the user is on
    if (!user) return res.redirect("/auth/signin?error=oauth");
    const account = await prisma.user.findUnique({ where: { id: user.userId }, select: { id: true, username: true, tokenVersion: true } });
    if (!account) return res.redirect("/auth/signin?error=oauth");
    setAuthCookie(req, res, signToken(account.id, account.username, { tokenVersion: account.tokenVersion }));
    // Relative, so the browser stays on whichever web app address it came through
    return res.redirect("/chat");
});

if (process.env.GOOGLE_CLIENT_ID) {
    authRouter.get("/auth/google", startOAuth("google", ["profile", "email"]));
    authRouter.get("/auth/google/callback", passport.authenticate("google", { session: false }), oauthCallback);
}
if (process.env.GITHUB_CLIENT_ID) {
    authRouter.get("/auth/github", startOAuth("github", ["user:email"]));
    authRouter.get("/auth/github/callback", passport.authenticate("github", { session: false }), oauthCallback);
}

authRouter.post("/signup", authLimiter, async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(411).json({ message: "Invalid input", success: false });
    }
    const { username, email, password } = parsed.data;

    try {
        const existing = await findUserByEmail(email);
        if (existing) {
            return res.status(400).json({ message: "User already exists with this email", success: false });
        }

        const user = await prisma.user.create({
            data: { username, email, password: await bcrypt.hash(password, 10) },
        });

        sendVerificationEmail(req, user);
        setAuthCookie(req, res, signToken(user.id, user.username, { tokenVersion: user.tokenVersion }));
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
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: "Invalid user", success: false });
        }
        // OAuth-only accounts have no password
        if (!user.password || !(await bcrypt.compare(password, user.password))) {
            return res.status(402).json({ message: "Incorrect Password", success: false });
        }

        setAuthCookie(req, res, signToken(user.id, user.username, { tokenVersion: user.tokenVersion }));
        return res.status(200).json({ message: "User logged in successfully", success: true, username: user.username, id: user.id });
    } catch (e) {
        log("error", "signin failed", { error: e instanceof Error ? e.message : String(e) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

// ─── Forgot password, reset, verify email ────────────────────────────────────

/** Always answers the same way, so it can't be used to find out who has an account. */
authRouter.post("/auth/forgot-password", emailLimiter, async (req, res) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Enter a valid email address.", success: false });

    const user = await findUserByEmail(parsed.data.email);
    if (user) {
        const link = `${requestOrigin(req)}/auth/reset?token=${encodeURIComponent(signPasswordResetToken(user))}`;
        sendEmailLater(passwordResetMessage(user.email, user.username, link));
    }
    return res.status(200).json({ success: true, message: "If that email has a Brainly account, a reset link is on its way." });
});

/**
 * Sets a new password from an emailed link (also how Google / GitHub users add a password).
 * Every other session and connected extension is signed out; this browser stays signed in.
 */
authRouter.post("/auth/reset-password", authLimiter, async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Choose a password of at least 6 characters.", success: false });
    const { token, password } = parsed.data;

    const userId = passwordResetUserId(token);
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || !verifyPasswordResetToken(token, user)) {
        return res.status(400).json({ message: "This reset link has expired or was already used. Ask for a new one.", success: false });
    }

    const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
            password: await bcrypt.hash(password, 10),
            // The link arrived in their inbox, so they own the email
            emailVerified: user.emailVerified ?? new Date(),
            tokenVersion: { increment: 1 },
            devices: { deleteMany: {} },
        },
    });
    setAuthCookie(req, res, signToken(updated.id, updated.username, { tokenVersion: updated.tokenVersion }));
    return res.status(200).json({ success: true, username: updated.username });
});

authRouter.post("/auth/verify-email", authLimiter, async (req, res) => {
    const parsed = verifyEmailSchema.safeParse(req.body);
    const claims = parsed.success ? verifyEmailVerificationToken(parsed.data.token) : null;
    const user = claims ? await prisma.user.findUnique({ where: { id: claims.userId } }) : null;
    // A link for an address the account no longer uses doesn't count
    if (!claims || !user || user.email.toLowerCase() !== claims.email.toLowerCase()) {
        return res.status(400).json({ message: "This link has expired. Sign in and send a new one from the banner at the top.", success: false });
    }
    if (!user.emailVerified) await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    return res.status(200).json({ success: true, email: user.email });
});

authRouter.post("/api/account/verify-email", MiddleWhere, emailLimiter, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: res.locals.userId } });
    if (!user) return res.status(401).json({ message: "Not signed in", success: false });
    if (user.emailVerified) return res.status(200).json({ success: true, alreadyVerified: true });
    sendVerificationEmail(req, user);
    return res.status(200).json({ success: true, sentTo: user.email });
});

authRouter.post("/logout", (req, res) => {
    clearAuthCookie(req, res);
    return res.status(200).json({ success: true });
});

authRouter.get("/api/me", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, isPremium: true, createdAt: true, emailVerified: true, password: true },
    });
    if (!user) {
        clearAuthCookie(req, res);
        return res.status(401).json({ message: "Not signed in", success: false });
    }
    const { password, emailVerified, ...profile } = user;
    const { plan, memoryCount, chatsToday } = await getUsage(userId);
    return res.status(200).json({
        success: true,
        user: { ...profile, emailVerified: Boolean(emailVerified), hasPassword: Boolean(password) },
        plan,
        usage: { memoryCount, chatsToday },
    });
});

/**
 * A long-lived token for the browser extension, which can't use the site's cookie. Each one is a
 * Device the user can sign out on its own in Settings → Connected devices.
 */
authRouter.post("/api/extension-token", MiddleWhere, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: res.locals.userId }, select: { id: true, username: true, tokenVersion: true } });
    if (!user) return res.status(401).json({ message: "Not signed in", success: false });
    // The connect page runs in the same browser as the extension, so its User-Agent names it
    const browser = describeUserAgent(req.get("user-agent"));
    const name = req.body?.kind === "copy" ? `Copied token (${browser})` : browser;
    const device = await prisma.device.create({ data: { id: crypto.randomUUID(), userId: user.id, name } });
    return res.status(200).json({
        success: true,
        token: signToken(user.id, user.username, { expiresIn: "90d", tokenVersion: user.tokenVersion, deviceId: device.id }),
    });
});
