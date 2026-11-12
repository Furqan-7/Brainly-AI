import { beforeAll, describe, expect, it } from "vitest";
import { describeUserAgent } from "../src/lib/devices";
import { passwordResetMessage, verifyEmailMessage } from "../src/lib/emails";

let auth: typeof import("../src/lib/auth");

beforeAll(async () => {
    process.env.JWT_TOKEN = "test-secret";
    auth = await import("../src/lib/auth");
});

describe("sign-in tokens", () => {
    it("carry the token version and, for the extension, its device", () => {
        expect(auth.verifySessionToken(auth.signToken(7, "ana"))).toEqual({ userId: 7, tokenVersion: 0, deviceId: undefined });
        expect(auth.verifySessionToken(auth.signToken(7, "ana", { tokenVersion: 3, deviceId: "dev-1" }))).toEqual({
            userId: 7, tokenVersion: 3, deviceId: "dev-1",
        });
    });

    it("never accept a purpose-bound token (email links, OAuth hand-off) as a session", () => {
        expect(auth.verifySessionToken(auth.signEmailVerificationToken(7, "a@example.com"))).toBeNull();
        expect(auth.verifySessionToken(auth.signHandoffToken(7, "ana"))).toBeNull();
        expect(auth.verifySessionToken(auth.signPasswordResetToken({ id: 7, password: null }))).toBeNull();
        expect(auth.verifySessionToken("garbage")).toBeNull();
    });
});

describe("password reset links", () => {
    const user = { id: 7, password: "$2b$10$oldhash" };

    it("work for their own user", () => {
        const token = auth.signPasswordResetToken(user);
        expect(auth.passwordResetUserId(token)).toBe(7);
        expect(auth.verifyPasswordResetToken(token, user)).toBe(true);
    });

    it("stop working once the password has changed (so each link works only once)", () => {
        const token = auth.signPasswordResetToken(user);
        expect(auth.verifyPasswordResetToken(token, { id: 7, password: "$2b$10$newhash" })).toBe(false);
    });

    it("let accounts without a password (Google / GitHub) set one", () => {
        const token = auth.signPasswordResetToken({ id: 8, password: null });
        expect(auth.verifyPasswordResetToken(token, { id: 8, password: null })).toBe(true);
        expect(auth.verifyPasswordResetToken(token, { id: 8, password: "$2b$10$set" })).toBe(false);
    });

    it("can't be used for another user or forged from a session token", () => {
        const token = auth.signPasswordResetToken(user);
        expect(auth.verifyPasswordResetToken(token, { id: 9, password: user.password })).toBe(false);
        expect(auth.passwordResetUserId(auth.signToken(7, "ana"))).toBeNull();
    });
});

describe("email verification links", () => {
    it("round-trip the user and address", () => {
        expect(auth.verifyEmailVerificationToken(auth.signEmailVerificationToken(7, "a@example.com"))).toEqual({ userId: 7, email: "a@example.com" });
        expect(auth.verifyEmailVerificationToken(auth.signToken(7, "ana"))).toBeNull();
    });
});

describe("emails", () => {
    it("escape the user's name in HTML and include the link in plain text", () => {
        const email = passwordResetMessage("a@example.com", "<b>ana</b>", "https://brainlyai.me/auth/reset?token=abc");
        expect(email.html).toContain("&lt;b&gt;ana&lt;/b&gt;");
        expect(email.html).not.toContain("<b>ana</b>");
        expect(email.text).toContain("https://brainlyai.me/auth/reset?token=abc");
        expect(verifyEmailMessage("a@example.com", "ana", "https://x/verify").subject).toMatch(/confirm/i);
    });
});

describe("device names", () => {
    it("name the browser and operating system", () => {
        expect(describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"))
            .toBe("Chrome on Windows");
        expect(describeUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0"))
            .toBe("Edge on Mac");
        expect(describeUserAgent("Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0")).toBe("Firefox on Linux");
        expect(describeUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"))
            .toBe("Safari on Mac");
        expect(describeUserAgent(undefined)).toBe("Browser extension");
    });
});
