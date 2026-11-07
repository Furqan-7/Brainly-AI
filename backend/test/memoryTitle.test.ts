import { describe, expect, it } from "vitest";
import { cleanTitle, looksLikeUrl, needsAutoTitle, provisionalTitle } from "../src/lib/memoryTitle";

describe("memory titles", () => {
    it("treats a missing title or a bare link as needing an automatic title", () => {
        expect(needsAutoTitle(undefined, "https://a.com")).toBe(true);
        expect(needsAutoTitle("  ", null)).toBe(true);
        expect(needsAutoTitle("https://a.com/x", "https://a.com/x")).toBe(true);
        expect(needsAutoTitle("www.example.com", null)).toBe(true);
        expect(needsAutoTitle("Pasta recipe", "https://a.com")).toBe(false);
        expect(looksLikeUrl("Read https://a.com later")).toBe(false);
    });

    it("gives a useful provisional title before processing", () => {
        expect(provisionalTitle("url", "https://www.nytimes.com/2026/a.html")).toBe("Link from nytimes.com");
        expect(provisionalTitle("youtube", "https://youtu.be/abc")).toBe("YouTube video");
        expect(provisionalTitle("note", null, "Buy milk\nand eggs")).toBe("Buy milk");
        expect(provisionalTitle("pdf", null, null, "my_resume-2026.pdf")).toBe("my resume 2026");
    });

    it("cleans captions and page titles", () => {
        expect(cleanTitle("#coding #dev\n5 project ideas for your resume #portfolio")).toBe("5 project ideas for your resume");
        expect(cleanTitle("How transformers work - YouTube")).toBe("How transformers work");
        expect(cleanTitle('  "Quoted title"  ')).toBe("Quoted title");
        expect(cleanTitle("")).toBeNull();
        expect(cleanTitle("word ".repeat(60))!.length).toBeLessThanOrEqual(120);
    });
});
