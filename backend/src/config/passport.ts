import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { VerifyCallback } from "passport-google-oauth20";
import { prisma } from "db";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../.env") });

// not used in JWT flow but Passport requires it
passport.serializeUser((user: Express.User, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

// ─── Google ───────────────────────────────────────────────────────────────────

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: `${process.env.GOOGLE_CALLBACK_URL}/auth/google/callback`!,
            scope: ["profile", "email"],
        },
        async (accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error("No email returned from Google"), undefined);

                // 1. check if this Google account is already linked
                const existingAccount = await prisma.account.findUnique({
                    where: {
                        provider_providerAccountId: {
                            provider: "google",
                            providerAccountId: profile.id,
                        },
                    },
                    include: { user: true },
                });

                if (existingAccount) {
                    // already linked — update tokens and return user
                    await prisma.account.update({
                        where: { id: existingAccount.id },
                        data: { accessToken, refreshToken: refreshToken ?? null },
                    });

                    const token = signToken(existingAccount.user.id, existingAccount.user.username);
                    return done(null, { id: existingAccount.user.id, username: existingAccount.user.username, token });
                }

                // 2. check if a user with this email already exists (registered with password)
                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    // 3. brand new user — create them
                    user = await prisma.user.create({
                        data: {
                            email,
                            username: profile.displayName ?? `google_${profile.id}`,
                        },
                    });
                }

                // 4. link the Google account to the user
                await prisma.account.create({
                    data: {
                        userId: user.id,
                        provider: "google",
                        providerAccountId: profile.id,
                        accessToken,
                        refreshToken: refreshToken ?? null,
                    },
                });

                const token = signToken(user.id, user.username);
                return done(null, { id: user.id, username: user.username, token });
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

// ─── GitHub ───────────────────────────────────────────────────────────────────

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            callbackURL: `${process.env.GITHUB_CALLBACK_URL}/auth/github/callback`,
            scope: ["user:email"],
        },
        async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: VerifyCallback) => {
            try {
                const email = profile.emails?.[0]?.value;
                if (!email) return done(new Error("No email returned from GitHub"), undefined);

                const existingAccount = await prisma.account.findUnique({
                    where: {
                        provider_providerAccountId: {
                            provider: "github",
                            providerAccountId: profile.id,
                        },
                    },
                    include: { user: true },
                });

                if (existingAccount) {
                    await prisma.account.update({
                        where: { id: existingAccount.id },
                        data: { accessToken, refreshToken: refreshToken ?? null },
                    });

                    const token = signToken(existingAccount.user.id, existingAccount.user.username);
                    return done(null, { id: existingAccount.user.id, username: existingAccount.user.username, token });
                }

                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            username: profile.username ?? `github_${profile.id}`,
                        },
                    });
                }

                await prisma.account.create({
                    data: {
                        userId: user.id,
                        provider: "github",
                        providerAccountId: profile.id,
                        accessToken,
                        refreshToken: refreshToken ?? null,
                    },
                });

                const token = signToken(user.id, user.username);
                return done(null, { id: user.id, username: user.username, token });
            } catch (error) {
                return done(error as Error, undefined);
            }
        }
    )
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId: number, username: string): string {
    return jwt.sign(
        { userId, username },
        process.env.JWT_TOKEN!,
        { expiresIn: "7d" }
    );
}

export default passport;