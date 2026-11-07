import { describe, expect, it, vi } from "vitest";

const completeJson = vi.fn();
vi.mock("../src/lib/llm", () => ({ completeJson: (...args: unknown[]) => completeJson(...args) }));

const { displayTitle, fallbackTitle, generateTitle, MAX_TITLE_LENGTH } = await import("../src/lib/chatTitle");

describe("fallbackTitle", () => {
    it.each([
        ["have i stored my resume? here", "Stored my resume"],
        ["pasta reel from last week", "Pasta reel from last week"],
        ["Hey can you please tell me about the video I saved on sourdough", "Video I saved on sourdough"],
        ["do I have anything on https://example.com/a about react server components", "React server components"],
        ["?", "New chat"],
    ])("%j → %j", (question, title) => {
        expect(fallbackTitle(question)).toBe(title);
    });

    it("keeps long questions short, cut at a word and not ending on a small word", () => {
        const title = fallbackTitle("Can you find me that reel about project ideas I saved last month for my portfolio website");
        expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
        expect(title).toMatch(/^Reel about project ideas/);
        expect(title).not.toMatch(/\s(the|of|my|for)$/i);
    });
});

describe("displayTitle", () => {
    it("leaves short titles alone and shortens old full-question titles", () => {
        expect(displayTitle("Saved resume")).toBe("Saved resume");
        expect(displayTitle("what did my PDFs say about transformers and attention in the 2017 paper?").length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    });
});

describe("generateTitle", () => {
    it("uses the model's title, cleaned up", async () => {
        completeJson.mockResolvedValueOnce({ title: '"saved resume and LinkedIn."' });
        expect(await generateTitle("have i stored my resume? here")).toBe("Saved resume and LinkedIn");
    });

    it("falls back to the question when the model returns something unusable", async () => {
        completeJson.mockResolvedValueOnce({ title: "" });
        expect(await generateTitle("have i stored my resume? here")).toBe("Stored my resume");
        completeJson.mockResolvedValueOnce({ title: "This is a very long sentence the model wrote instead of a short chat title" });
        expect(await generateTitle("have i stored my resume? here")).toBe("Stored my resume");
    });
});
