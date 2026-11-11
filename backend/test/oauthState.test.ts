import jwt from "jsonwebtoken";
import { beforeAll, describe, expect, it } from "vitest";

let auth: typeof import("../src/lib/auth");

beforeAll(async () => {
    process.env.JWT_TOKEN = "test-secret";
    process.env.CLIENT_URL = "https://brainlyai.me, https://brainly-ai-frontend.vercel.app";
    auth = await import("../src/lib/auth");
});

describe("sign-in return address", () => {
    it("lists every web app address, the custom domain first", () => {
        expect(auth.clientOrigins()).toEqual(["https://brainlyai.me", "https://brainly-ai-frontend.vercel.app"]);
        expect(auth.clientUrl()).toBe("https://brainlyai.me");
    });

    it("accepts only the web app's own addresses", () => {
        expect(auth.allowedClientOrigin("https://brainlyai.me/auth/signin?next=/chat")).toBe("https://brainlyai.me");
        expect(auth.allowedClientOrigin("https://brainly-ai-frontend.vercel.app/auth/signin")).toBe("https://brainly-ai-frontend.vercel.app");
        expect(auth.allowedClientOrigin("https://brainlyai.me.evil.com/")).toBeNull();
        expect(auth.allowedClientOrigin("https://evil.com/?https://brainlyai.me")).toBeNull();
        expect(auth.allowedClientOrigin("not a url")).toBeNull();
        expect(auth.allowedClientOrigin(undefined)).toBeNull();
    });

    it("round-trips the starting address through the OAuth state", () => {
        expect(auth.verifyOAuthState(auth.signOAuthState("https://brainlyai.me"))).toBe("https://brainlyai.me");
    });

    it("ignores tampered, foreign, wrong-purpose or expired state", () => {
        const forged = jwt.sign({ origin: "https://evil.com", purpose: "oauth-state" }, "test-secret");
        const otherKey = jwt.sign({ origin: "https://brainlyai.me", purpose: "oauth-state" }, "wrong-secret");
        const handoff = jwt.sign({ origin: "https://brainlyai.me", purpose: "oauth-handoff" }, "test-secret");
        const expired = jwt.sign({ origin: "https://brainlyai.me", purpose: "oauth-state" }, "test-secret", { expiresIn: -10 });
        for (const state of [forged, otherKey, handoff, expired, "", undefined, ["x"]]) expect(auth.verifyOAuthState(state)).toBeNull();
    });
});
