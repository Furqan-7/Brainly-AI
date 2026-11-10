/**
 * End-to-end tests against a real Postgres + pgvector database, with the external AI APIs
 * replaced by deterministic fakes. Skipped unless TEST_DATABASE_URL is set, e.g.
 *   TEST_DATABASE_URL=postgresql://postgres@localhost:5433/brainly pnpm test
 * The database must already be migrated (`pnpm --filter db exec prisma migrate deploy`).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

const TEST_DB = process.env.TEST_DATABASE_URL;
if (TEST_DB) process.env.DATABASE_URL = TEST_DB;

// Bag-of-words embedding: texts sharing words get similar vectors. Good enough to test ranking.
function fakeEmbedding(text: string): number[] {
    const v = new Array(768).fill(0);
    for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
        const stem = word.replace(/s$/, "");
        let h = 0;
        for (const ch of stem) h = (h * 31 + ch.charCodeAt(0)) % 768;
        v[h] += 1;
    }
    const norm = Math.hypot(...v) || 1;
    return v.map((x) => x / norm);
}

vi.mock("../src/Embeddings", () => ({
    GetEmbeddings: async (text: string) => fakeEmbedding(text),
    GetQueryEmbedding: async (text: string) => fakeEmbedding(text),
    GetEmbeddingsBatch: async (texts: string[]) => texts.map(fakeEmbedding),
}));
vi.mock("../src/GetHypotheticalAnswer", () => ({ GetHypotheticalAnswer: async (q: string) => q }));
vi.mock("../src/lib/llm", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../src/lib/llm")>()),
    completeJson: async (prompt: string, fallback: any) =>
        prompt.includes("organise a personal knowledge base")
            ? { summary: "A saved item.", tags: ["Auto Tag"], ...(prompt.includes('"title"') ? { title: "Weeknight pasta recipe" } : {}) }
            : fallback,
}));
vi.mock("../src/ingest/reel", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../src/ingest/reel")>()),
    fetchReel: async () => ({
        caption: "5 full-stack project ideas for your resume #coding",
        author: "code.daily",
        thumbnail: "https://cdn.example.com/thumb.jpg",
        transcript: "",
    }),
}));

describe.skipIf(!TEST_DB)("integration (real Postgres)", () => {
    let prisma: typeof import("db").prisma;
    let server: Server;
    let base: string;
    let auth: Record<string, string>;
    let userId: number;
    let reelId: number;
    let noteId: number;

    beforeAll(async () => {
        ({ prisma } = await import("db"));
        const { app } = await import("../src/index");
        const { signToken } = await import("../src/lib/auth");
        const { processMemory } = await import("../src/processMemory");

        await prisma.$executeRawUnsafe(
            `TRUNCATE "User", "Memories", "Chunks", "Collection", "Conversation", "Message", "UserUsage" RESTART IDENTITY CASCADE`
        );
        const user = await prisma.user.create({ data: { username: "tester", email: "t@example.com" } });
        userId = user.id;
        auth = { Authorization: `Bearer ${signToken(user.id, user.username)}` };

        const reel = await prisma.memories.create({
            data: {
                userId, type: "reel", title: "Project ideas",
                source_url: "https://www.instagram.com/reel/C8abc_12/",
                metadata: { context: "Ideas for my portfolio" },
            },
        });
        const note = await prisma.memories.create({
            data: { userId, type: "note", title: "Pasta recipe", note: "Boil pasta, add tomato sauce and basil. Cooking takes 15 minutes." },
        });
        reelId = reel.id;
        noteId = note.id;
        await processMemory(reel);
        await processMemory(note);

        server = app.listen(0);
        base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(() => {
        server?.close();
    });

    it("processes memories into chunks with summary, tags and a review date", async () => {
        const reel = await prisma.memories.findUnique({ where: { id: reelId } });
        expect(reel?.status).toBe("ready");
        expect(reel?.summary).toBe("A saved item.");
        expect(reel?.tags).toContain("auto-tag");
        expect(reel?.nextReviewAt).not.toBeNull();
        expect((reel?.metadata as any).thumbnail_url).toBe("https://cdn.example.com/thumb.jpg");
        expect(await prisma.chunks.count({ where: { MemoryId: reelId } })).toBeGreaterThan(0);
    });

    it("searching 'project' returns the saved reel with its link (the main feature)", async () => {
        const { retrieveContext } = await import("../src/rag");
        const { sources } = await retrieveContext(userId, "project", {});
        expect(sources[0]).toMatchObject({
            memoryId: reelId,
            type: "reel",
            source_url: "https://www.instagram.com/reel/C8abc_12/",
            thumbnail: "https://cdn.example.com/thumb.jpg",
            author: "code.daily",
        });
        expect(sources[0].savedAt).toEqual(expect.any(String));
    });

    it("plain search endpoint ranks the reel first for 'project ideas'", async () => {
        const res = await fetch(`${base}/api/search?q=${encodeURIComponent("project ideas")}`, { headers: auth });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.results[0].memoryId).toBe(reelId);
    });

    it("applies type filters parsed from the question, falling back when they match nothing", async () => {
        const { searchWithFallback } = await import("../src/rag");
        const reels = await searchWithFallback(userId, "my reels about cooking", {});
        expect(reels.results.every((r) => r.type === "reel")).toBe(true);

        const pdfs = await searchWithFallback(userId, "pdfs about pasta cooking", {});
        expect(pdfs.filters.types).toBeUndefined();
        expect(pdfs.results[0].memoryId).toBe(noteId);
    });

    it("archived memories are excluded from search", async () => {
        const { hybridSearch } = await import("../src/Retrieval");
        await prisma.memories.update({ where: { id: noteId }, data: { archived: true } });
        const results = await hybridSearch({ userId, question: "pasta" });
        expect(results.some((r) => r.memoryId === noteId)).toBe(false);
        await prisma.memories.update({ where: { id: noteId }, data: { archived: false } });
    });

    it("counts memories by type, starred, archived and this week", async () => {
        await prisma.memories.update({ where: { id: reelId }, data: { starred: true } });
        const res = await fetch(`${base}/api/content/counts`, { headers: auth });
        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body).toMatchObject({ total: 2, types: { reel: 1, note: 1 }, starred: 1, archived: 0, thisWeek: 2 });
        await prisma.memories.update({ where: { id: reelId }, data: { starred: false } });
    });

    it("lists memories newest or oldest first", async () => {
        const ids = async (sort: string) =>
            (await (await fetch(`${base}/api/content?sort=${sort}`, { headers: auth })).json()).memories.map((m: any) => m.id);
        expect(await ids("newest")).toEqual([noteId, reelId]);
        expect(await ids("oldest")).toEqual([reelId, noteId]);
    });

    it("builds the knowledge graph from stored embeddings", async () => {
        const res = await fetch(`${base}/api/graph`, { headers: auth });
        const body = await res.json();
        expect(body.nodes.map((n: any) => n.id).sort()).toEqual([reelId, noteId].sort());
        expect(Array.isArray(body.edges)).toBe(true);
    });

    it("re-processing replaces chunks instead of duplicating them", async () => {
        const { processMemory } = await import("../src/processMemory");
        const before = await prisma.chunks.count({ where: { MemoryId: noteId } });
        await processMemory(await prisma.memories.findUnique({ where: { id: noteId } }));
        expect(await prisma.chunks.count({ where: { MemoryId: noteId } })).toBe(before);
    });

    it("deleting a memory cascades to its chunks", async () => {
        const res = await fetch(`${base}/api/content/${noteId}`, { method: "DELETE", headers: auth });
        expect(res.status).toBe(200);
        expect(await prisma.chunks.count({ where: { MemoryId: noteId } })).toBe(0);
    });
    it("names memories saved without a title (share sheet, extension)", async () => {
        const { processMemory } = await import("../src/processMemory");
        const post = (body: object) =>
            fetch(`${base}/api/content`, { method: "POST", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(body) });

        // A link: provisional title right away, then the reel's own caption
        const res = await post({ type: "url", source_url: "https://www.instagram.com/reel/Zz9_shared/" });
        expect(res.status).toBe(201);
        const saved = await res.json();
        expect(saved).toMatchObject({ type: "reel", title: "Instagram reel", autoTitle: true });
        await processMemory(await prisma.memories.findUnique({ where: { id: saved.id } }));
        const reel = await prisma.memories.findUnique({ where: { id: saved.id } });
        expect(reel?.title).toBe("5 full-stack project ideas for your resume");
        expect((reel?.metadata as any).auto_title).toBe(false);

        // A note with no title: the AI names it from the text
        const noteRes = await post({ type: "note", note: "Boil pasta 10 min, toss with garlic, olive oil and chilli." });
        const note = await noteRes.json();
        await processMemory(await prisma.memories.findUnique({ where: { id: note.id } }));
        expect((await prisma.memories.findUnique({ where: { id: note.id } }))?.title).toBe("Weeknight pasta recipe");

        // A title the user gave is kept
        const named = await (await post({ type: "url", source_url: "https://www.instagram.com/reel/Kp2_named/", title: "My favourite ideas" })).json();
        expect(named).toMatchObject({ title: "My favourite ideas", autoTitle: false });
    });
});
