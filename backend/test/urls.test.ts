import { describe, expect, it } from "vitest";
import { normalizeUrl, youtubeId, isTikTokUrl } from "../src/lib/urls";
import { isInstagramReelUrl, parseReelDescription } from "../src/ingest/reel";
import { detectType } from "../src/routes/content";

describe("normalizeUrl", () => {
    it("treats tracking params, www and trailing slashes as the same URL", () => {
        expect(normalizeUrl("https://www.example.com/post/?utm_source=x&fbclid=1#top"))
            .toBe(normalizeUrl("https://example.com/post"));
    });

    it("keeps meaningful query params", () => {
        expect(normalizeUrl("https://example.com/search?q=rag")).toContain("q=rag");
    });

    it("canonicalises every YouTube URL form", () => {
        const canonical = "https://youtube.com/watch?v=dQw4w9WgXcQ";
        expect(normalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe(canonical);
        expect(normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42")).toBe(canonical);
        expect(normalizeUrl("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(canonical);
    });

    it("treats /reels/ and /reel/ as the same Instagram reel", () => {
        expect(normalizeUrl("https://www.instagram.com/reels/C8abc_12/?igsh=xyz"))
            .toBe(normalizeUrl("https://instagram.com/reel/C8abc_12/"));
    });
});

describe("platform detection", () => {
    it("recognises YouTube ids including Shorts", () => {
        expect(youtubeId("https://youtube.com/shorts/abcdefghijk")).toBe("abcdefghijk");
        expect(youtubeId("https://example.com/watch?v=abc")).toBeNull();
    });

    it("recognises reels and TikToks", () => {
        expect(isInstagramReelUrl("https://www.instagram.com/reel/C8abc_12/?igsh=x")).toBe(true);
        expect(isInstagramReelUrl("https://example.com")).toBe(false);
        expect(isTikTokUrl("https://www.tiktok.com/@user/video/123")).toBe(true);
        expect(isTikTokUrl("https://vm.tiktok.com/ZMabc/")).toBe(true);
    });

    it("saves a plain link as the platform type it points to", () => {
        expect(detectType("url", "https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
        expect(detectType("url", "https://instagram.com/reel/abc")).toBe("reel");
        expect(detectType("url", "https://x.com/user/status/123")).toBe("tweet");
        expect(detectType("url", "https://www.tiktok.com/@a/video/1")).toBe("tiktok");
        expect(detectType("url", "https://example.com")).toBe("url");
        expect(detectType("note", "https://youtu.be/dQw4w9WgXcQ")).toBe("note");
    });
});

describe("parseReelDescription", () => {
    it("extracts caption and author from Instagram's og:description", () => {
        const parsed = parseReelDescription(
            `12K likes, 80 comments - code.daily on May 1, 2026: "5 full-stack project ideas for your resume #coding".`
        );
        expect(parsed).toEqual({ caption: "5 full-stack project ideas for your resume #coding", author: "code.daily" });
    });

    it("falls back to the whole description", () => {
        expect(parseReelDescription("Just a description").caption).toBe("Just a description");
    });
});
