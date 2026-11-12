import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { VerifyCallback } from "passport-google-oauth20";
import { prisma } from "db";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../.env") });

// not used in JWT flow but Passport requires it
passport.serializeUser((user: Express.User, done) => done(null, user));
passport.deserializeUser((user: Express.User, done) => done(null, user));

interface ProviderSignIn {
    provider: "google" | "github";
    providerAccountId: string;
    /** Only emails the provider has verified */
    email: string;
    username: string;
}

/**
 * Finds or creates the Brainly user for a Google / GitHub sign-in. The provider has verified the
 * email, so the account counts as verified from here on. Only the provider's account id is kept:
 * Brainly never calls Google or GitHub on the user's behalf, so their access tokens aren't stored.
 */
export async function signInWithProvider({ provider, providerAccountId, email, username }: ProviderSignIn) {
    // 1. this provider account is already linked
    const existingAccount = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
    });
    if (existingAccount) {
        return { id: existingAccount.user.id, username: existingAccount.user.username };
    }

    // 2. a user with this email signed up with a password, or 3. a brand new user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({ data: { email, username, emailVerified: new Date() } });
    } else if (!user.emailVerified) {
        // Nobody ever proved they own this email, so whoever set the password may not be its
        // owner (someone could sign up with another person's address and wait for them to use
        // Google). The owner has just proved it: drop that password and sign out its sessions.
        user = await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date(), password: null, tokenVersion: { increment: 1 }, devices: { deleteMany: {} } },
        });
    }

    // 4. link the provider account to the user
    await prisma.account.create({
        data: { userId: user.id, provider, providerAccountId },
    });
    return { id: user.id, username: user.username };
}

// ─── Google ───────────────────────────────────────────────────────────────────

// Only enabled when configured, so the app also runs without this OAuth provider
if (process.env.GOOGLE_CLIENT_ID) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
                callbackURL: `${process.env.GOOGLE_CALLBACK_URL}`!,
                scope: ["profile", "email"],
            },
            async (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done: VerifyCallback) => {
                try {
                    const email = profile.emails?.find((e) => e.verified !== false)?.value;
                    if (!email) return done(new Error("No verified email returned from Google"), undefined);
                    const user = await signInWithProvider({
                        provider: "google",
                        providerAccountId: profile.id,
                        email,
                        username: profile.displayName || `google_${profile.id}`,
                    });
                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

type GitHubEmail = { value: string; primary?: boolean; verified?: boolean };

// Only enabled when configured, so the app also runs without this OAuth provider
if (process.env.GITHUB_CLIENT_ID) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID!,
                clientSecret: process.env.GITHUB_CLIENT_SECRET!,
                callbackURL: `${process.env.GITHUB_CALLBACK_URL}`,
                scope: ["user:email"],
                // Every address with its verified flag, instead of just the primary one
                allRawEmails: true,
            },
            async (_accessToken: string, _refreshToken: string, profile: GitHubProfile, done: VerifyCallback) => {
                try {
                    const emails = (profile.emails ?? []) as GitHubEmail[];
                    const email = (emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified))?.value;
                    if (!email) return done(new Error("No verified email on this GitHub account"), undefined);
                    const user = await signInWithProvider({
                        provider: "github",
                        providerAccountId: profile.id,
                        email,
                        username: profile.username || `github_${profile.id}`,
                    });
                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );
}

export default passport;
