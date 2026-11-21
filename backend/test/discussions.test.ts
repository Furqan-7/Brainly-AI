import { describe, expect, it } from "vitest";
import { discussionFetcher, fetchHackerNews, fetchReddit, hackerNewsId, htmlToPlain, redditThread } from "../src/ingest/discussions";

describe("discussion URLs", () => {
    it("recognises Hacker News items", () => {
        expect(hackerNewsId("https://news.ycombinator.com/item?id=8863")).toBe(8863);
        expect(hackerNewsId("https://news.ycombinator.com/item?p=2&id=8863")).toBe(8863);
        expect(hackerNewsId("https://news.ycombinator.com/news")).toBeNull();
    });

    it("recognises Reddit threads on every subdomain", () => {
        expect(redditThread("https://www.reddit.com/r/programming/comments/abc12/some_title/")).toEqual({ sub: "programming", id: "abc12" });
        expect(redditThread("https://old.reddit.com/r/AskHistorians/comments/xyz9")).toEqual({ sub: "AskHistorians", id: "xyz9" });
        expect(redditThread("https://www.reddit.com/r/programming/")).toBeNull();
        expect(redditThread("https://www.reddit.com/r/programming/s/AbCdEf")).toBeNull();
        expect(discussionFetcher("https://example.com/item?id=1")).toBeNull();
    });
});

describe("htmlToPlain", () => {
    it("keeps paragraphs and decodes entities", () => {
        expect(htmlToPlain("First line<p>Second &amp; <a href=\"x\">link</a>")).toBe("First line\n\nSecond & link");
        expect(htmlToPlain(null)).toBe("");
    });
});

describe("fetchHackerNews", () => {
    // Shaped like https://hacker-news.firebaseio.com/v0/item/<id>.json
    const items: Record<number, any> = {
        100: { id: 100, type: "story", by: "pg", title: "Show HN: A tiny RAG library", url: "https://example.com/rag", score: 321, kids: [101, 102, 103] },
        101: { id: 101, type: "comment", by: "alice", text: "Chunk size matters more than the model.<p>We use 500 words." },
        102: { id: 102, type: "comment", deleted: true },
        103: { id: 103, type: "comment", by: "bob", text: "Hybrid search &gt; vectors alone." },
    };
    const get = async (url: string) => items[Number(url.match(/item\/(\d+)\.json/)![1])] ?? null;

    it("reads the story and its top comments", async () => {
        const thread = await fetchHackerNews("https://news.ycombinator.com/item?id=100", get);
        expect(thread).toMatchObject({ title: "Show HN: A tiny RAG library", author: "pg", siteName: "Hacker News", description: "Discussion of https://example.com/rag" });
        expect(thread.text).toContain("Posted by pg · 321 points");
        expect(thread.text).toContain("Link: https://example.com/rag");
        expect(thread.text).toContain("- alice: Chunk size matters more than the model.\n\nWe use 500 words.");
        expect(thread.text).toContain("- bob: Hybrid search > vectors alone.");
    });

    it("fails (so the page reader takes over) when the item is missing", async () => {
        await expect(fetchHackerNews("https://news.ycombinator.com/item?id=999", get)).rejects.toThrow();
    });
});

describe("fetchReddit", () => {
    // Shaped like https://www.reddit.com/r/<sub>/comments/<id>.json
    const listing = [
        { data: { children: [{ kind: "t3", data: {
            title: "What's the best way to learn Rust?", selftext: "I know Python and some C.", author: "learner", score: 512,
            subreddit_name_prefixed: "r/rust", is_self: true, url: "https://www.reddit.com/r/rust/comments/abc12/whats_the_best/",
            thumbnail: "self", over_18: false,
        } }] } },
        { data: { children: [
            { kind: "t1", data: { body: "Mod note: be nice", author: "AutoModerator", stickied: true } },
            { kind: "t1", data: { body: "Read the Rust Book, then do Rustlings.", author: "ferris" } },
            { kind: "t1", data: { body: "[deleted]", author: "[deleted]" } },
            { kind: "more", data: { children: ["x"] } },
        ] } },
    ];

    it("reads the post and its top comments, skipping stickied and deleted ones", async () => {
        let asked = "";
        const thread = await fetchReddit("https://www.reddit.com/r/rust/comments/abc12/whats_the_best/", async (url) => {
            asked = url;
            return listing;
        });
        expect(asked).toContain("https://www.reddit.com/r/rust/comments/abc12.json");
        expect(thread).toMatchObject({ title: "What's the best way to learn Rust?", author: "u/learner", siteName: "r/rust", image: null, description: "I know Python and some C." });
        expect(thread.text).toContain("Reddit post in r/rust: What's the best way to learn Rust?");
        expect(thread.text).toContain("- u/ferris: Read the Rust Book, then do Rustlings.");
        expect(thread.text).not.toContain("Mod note");
        expect(thread.text).not.toContain("[deleted]");
        expect(thread.text).not.toContain("Link:");
    });

    it("fails when Reddit refuses or returns something else", async () => {
        await expect(fetchReddit("https://www.reddit.com/r/rust/comments/abc12/", async () => ({ error: 403 }))).rejects.toThrow();
    });
});
