import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("axios", () => ({ default: { post: (...args: unknown[]) => post(...args) } }));

const { GetQueryEmbedding, clearEmbeddingCache } = await import("../src/Embeddings");
const { needsContext } = await import("../src/rag");
const { embedOne } = await import("../src/Retrieval");

describe("follow-up rewriting", () => {
    it("rewrites only follow-ups that lean on the conversation", () => {
        expect(needsContext("show me more like that")).toBe(true);
        expect(needsContext("what did it say about pricing?")).toBe(true);
        expect(needsContext("the second one")).toBe(true);
        expect(needsContext("pasta")).toBe(true); // very short: likely refers back
        expect(needsContext("what did my PDFs say about transformers")).toBe(false);
        expect(needsContext("find the reel about project ideas for my resume")).toBe(false);
    });
});

describe("query embeddings", () => {
    beforeEach(() => {
        post.mockReset();
        clearEmbeddingCache();
    });

    it("calls the API once for a repeated query (case and spacing ignored)", async () => {
        post.mockResolvedValue({ data: { embeddings: [[0.1, 0.2]] } });
        expect(await GetQueryEmbedding("Pasta recipes")).toEqual([0.1, 0.2]);
        expect(await GetQueryEmbedding("  pasta recipes ")).toEqual([0.1, 0.2]);
        expect(post).toHaveBeenCalledTimes(1);
        // a short timeout, so a slow API can't hold a search up
        expect(post.mock.calls[0][2].timeout).toBeLessThanOrEqual(5000);
    });

    it("keeps query and document embeddings apart", async () => {
        post.mockResolvedValueOnce({ data: { embeddings: [[1]] } }).mockResolvedValueOnce({ data: { embeddings: [[2]] } });
        expect(await GetQueryEmbedding("pasta", "search_query")).toEqual([1]);
        expect(await GetQueryEmbedding("pasta", "search_document")).toEqual([2]);
    });

    it("falls back to keyword search (null) when the API fails or times out", async () => {
        post.mockRejectedValue(new Error("timeout of 4000ms exceeded"));
        expect(await embedOne("pasta", "search_query")).toBeNull();
        // failures aren't cached: the next search tries again
        post.mockResolvedValue({ data: { embeddings: [[3]] } });
        expect(await embedOne("pasta", "search_query")).toEqual([3]);
    });
});
