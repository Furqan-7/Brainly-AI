import { describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { escapeXml, renderRss } from "../src/lib/rss";

describe("RSS", () => {
    it("escapes markup and drops characters XML can't hold", () => {
        expect(escapeXml(`<a href="x">Tom & Jerry's</a>\u0001`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;");
    });

    it("renders a valid feed with items, dates and categories", () => {
        const xml = renderRss({
            title: "Reads",
            link: "https://brainlyai.me/c/abc",
            feedUrl: "https://brainlyai.me/c/abc/feed.xml",
            description: "Shared",
            items: [
                { id: 2, title: "Newer", link: "https://example.com/2", description: "About <RAG>", tags: ["ai"], date: new Date("2026-11-02T10:00:00Z") },
                { id: 1, title: "Older", link: "https://brainlyai.me/c/abc", description: null, tags: [], date: new Date("2026-10-01T10:00:00Z") },
            ],
        });
        expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
        expect(xml).toContain("<lastBuildDate>Mon, 02 Nov 2026 10:00:00 GMT</lastBuildDate>");
        expect(xml).toContain("<description>About &lt;RAG&gt;</description>");
        expect(xml).toContain("<category>ai</category>");
        expect(xml.match(/<item>/g)).toHaveLength(2);
        // Well-formed XML: a strict XML parser reads it back
        const doc = new JSDOM(xml, { contentType: "text/xml" }).window.document;
        expect(doc.querySelectorAll("item")).toHaveLength(2);
        expect(doc.querySelector("channel > title")?.textContent).toBe("Reads");
    });
});
