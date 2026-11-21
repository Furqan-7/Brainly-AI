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

// Emails are captured instead of sent
const sentEmails = vi.hoisted(() => [] as { to: string; subject: string; text: string }[]);
vi.mock("../src/lib/mailer", () => ({
    emailProvider: () => null,
    sendEmail: async (email: any) => void sentEmails.push(email),
    sendEmailLater: (email: any) => void sentEmails.push(email),
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
            `TRUNCATE "User", "Memories", "Chunks", "Collection", "Conversation", "Message", "UserUsage", "Device" RESTART IDENTITY CASCADE`
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

    it("imports a browser bookmarks file as links, skipping ones already saved", async () => {
        const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1><TITLE>Bookmarks</TITLE><DL><p>
            <DT><H3>Bookmarks bar</H3><DL><p>
                <DT><H3>Cooking</H3><DL><p>
                    <DT><A HREF="https://www.youtube.com/watch?v=pasta12345" ADD_DATE="1600000000">How to make pasta</A>
                    <DT><A HREF="https://example.com/sauces">https://example.com/sauces</A>
                </DL><p>
                <DT><A HREF="https://instagram.com/reel/Zz9_shared?igsh=abc">Already saved reel</A>
                <DT><A HREF="ftp://files.example.com/a.zip">Not a web page</A>
            </DL><p></DL>`;
        const form = new FormData();
        form.append("files", new Blob([html], { type: "text/html" }), "bookmarks.html");
        const res = await fetch(`${base}/api/import`, { method: "POST", headers: auth, body: form });
        const body = await res.json();
        expect(res.status).toBe(201);
        expect(body).toMatchObject({ links: 2, notes: 0, duplicates: 1, overLimit: 0 });
        expect(body.message).toBe("Imported 2 links (skipped 1 already saved)");

        const video = await prisma.memories.findFirst({ where: { userId, source_url: "https://www.youtube.com/watch?v=pasta12345" } });
        expect(video).toMatchObject({ type: "youtube", title: "How to make pasta", tags: ["cooking"] });
        expect(video?.createdAt.getTime()).toBe(1600000000 * 1000);
        expect(video?.metadata).toMatchObject({ imported_from: "bookmarks", bulk: true, canonical_url: "https://youtube.com/watch?v=pasta12345" });

        // A bookmark titled with its own URL gets an automatic title, like a quick save
        const link = await prisma.memories.findFirst({ where: { userId, source_url: "https://example.com/sauces" } });
        expect(link).toMatchObject({ type: "url", title: "Link from example.com" });
        expect(link?.metadata).toMatchObject({ auto_title: true });

        // Importing the same file again adds nothing
        const again = new FormData();
        again.append("files", new Blob([html], { type: "text/html" }), "bookmarks.html");
        const second = await (await fetch(`${base}/api/import`, { method: "POST", headers: auth, body: again })).json();
        expect(second).toMatchObject({ count: 0, duplicates: 3, message: "Imported nothing new (skipped 3 already saved)" });
    });

    it("an import bigger than the plan saves what fits and says how many didn't", async () => {
        const { PLANS } = await import("../src/lib/plans");
        const original = PLANS.free.maxMemories;
        PLANS.free.maxMemories = (await prisma.memories.count({ where: { userId } })) + 1;
        try {
            const form = new FormData();
            form.append("files", new Blob(["title,url\nOne,https://example.com/one\nTwo,https://example.com/two\n"], { type: "text/csv" }), "raindrop.csv");
            const res = await fetch(`${base}/api/import`, { method: "POST", headers: auth, body: form });
            const body = await res.json();
            expect(res.status).toBe(201);
            expect(body).toMatchObject({ links: 1, overLimit: 1, upgrade: true });

            const full = new FormData();
            full.append("files", new Blob(["title,url\nThree,https://example.com/three\n"], { type: "text/csv" }), "raindrop.csv");
            expect((await fetch(`${base}/api/import`, { method: "POST", headers: auth, body: full })).status).toBe(402);
        } finally {
            PLANS.free.maxMemories = original;
        }
    });

    it("the worker takes everyday saves before a bulk import's backlog", async () => {
        const { claimJob } = await import("../src/worker");
        const everyday = await prisma.memories.create({ data: { userId, type: "note", title: "Quick note", note: "Call the bank" } });
        const job = await claimJob();
        expect(job?.id).toBe(everyday.id);
        await prisma.memories.delete({ where: { id: everyday.id } });
    });

    it("publishes a shared collection as an RSS feed, and removes it when unshared", async () => {
        const json = { ...auth, "Content-Type": "application/json" };
        const created = await (await fetch(`${base}/api/collections`, { method: "POST", headers: json, body: JSON.stringify({ name: "Reading <list> & more" }) })).json();
        const id = created.collection.id;
        await fetch(`${base}/api/collections/${id}/memories`, { method: "POST", headers: json, body: JSON.stringify({ memoryIds: [reelId] }) });
        const shared = await (await fetch(`${base}/api/collections/${id}/share`, { method: "POST", headers: auth })).json();
        const slug = shared.shareSlug ?? shared.collection?.shareSlug ?? shared.slug;
        expect(slug).toEqual(expect.any(String));

        const res = await fetch(`${base}/api/public/collections/${slug}/feed.xml`);
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/rss+xml");
        const xml = await res.text();
        expect(xml).toContain("<title>Reading &lt;list&gt; &amp; more · Brainly AI</title>");
        expect(xml).toContain(`<link>http://localhost:3000/c/${slug}</link>`);
        expect(xml).toContain("<link>https://www.instagram.com/reel/C8abc_12/</link>");
        expect(xml).toContain(`<guid isPermaLink="false">brainly-memory-${reelId}</guid>`);

        await fetch(`${base}/api/collections/${id}/share`, { method: "DELETE", headers: auth });
        expect((await fetch(`${base}/api/public/collections/${slug}/feed.xml`)).status).toBe(404);
        await fetch(`${base}/api/collections/${id}`, { method: "DELETE", headers: auth });
    });

    it("serves memories to AI assistants over MCP, signed in with a Bearer token only", async () => {
        const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
        const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
        const { signToken } = await import("../src/lib/auth");

        // No token, or only the site cookie: refused
        const initialize = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } };
        const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };
        expect((await fetch(`${base}/mcp`, { method: "POST", headers, body: JSON.stringify(initialize) })).status).toBe(401);
        const { AUTH_COOKIE } = await import("../src/lib/auth");
        const cookie = `${AUTH_COOKIE}=${auth.Authorization.slice(7)}`;
        expect((await fetch(`${base}/mcp`, { method: "POST", headers: { ...headers, Cookie: cookie }, body: JSON.stringify(initialize) })).status).toBe(401);

        const client = new Client({ name: "test-client", version: "1.0.0" });
        await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), { requestInit: { headers: auth } }));
        const call = async (name: string, args: Record<string, unknown>) => {
            const result = (await client.callTool({ name, arguments: args })) as any;
            return { ...result, data: result.isError ? null : JSON.parse(result.content[0].text) };
        };

        const { tools } = await client.listTools();
        expect(tools.map((t) => t.name).sort()).toEqual(["get_memory", "list_recent_memories", "save_memory", "search_memories"]);

        const search = await call("search_memories", { query: "project ideas" });
        expect(search.data.results[0]).toMatchObject({ id: reelId, type: "reel", url: "https://www.instagram.com/reel/C8abc_12/" });

        const memory = await call("get_memory", { id: reelId });
        expect(memory.data).toMatchObject({ id: reelId, personal_note: "Ideas for my portfolio" });
        expect(memory.data.text).toContain("5 full-stack project ideas");
        expect(memory.data.text).not.toContain("Personal note:");

        const saved = await call("save_memory", { note: "Remember: try HyDE with a 1.5s timeout.", tags: ["RAG"] });
        expect(saved.data).toMatchObject({ saved: true, type: "note" });
        const row = await prisma.memories.findUnique({ where: { id: saved.data.id } });
        expect(row).toMatchObject({ userId, type: "note", tags: ["rag"] });
        expect(row?.metadata).toMatchObject({ saved_from: "mcp" });

        const again = await call("save_memory", { url: "https://instagram.com/reel/C8abc_12" });
        expect(again.data).toMatchObject({ saved: false, already_saved: true, id: reelId });

        expect((await call("save_memory", {})).isError).toBe(true);
        const recent = await call("list_recent_memories", { limit: 50 });
        expect(recent.data.memories.some((m: any) => m.id === saved.data.id)).toBe(true);

        // Another user's memory is invisible
        const other = await prisma.user.create({ data: { username: "other", email: "other-mcp@example.com" } });
        const otherClient = new Client({ name: "other", version: "1.0.0" });
        await otherClient.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
            requestInit: { headers: { Authorization: `Bearer ${signToken(other.id, other.username)}` } },
        }));
        const peek = (await otherClient.callTool({ name: "get_memory", arguments: { id: reelId } })) as any;
        expect(peek.isError).toBe(true);
        await client.close();
        await otherClient.close();
        await prisma.memories.delete({ where: { id: saved.data.id } });
        await prisma.user.delete({ where: { id: other.id } });
    });
});

describe.skipIf(!TEST_DB)("account: email, devices, export, delete (real Postgres)", () => {
    let prisma: typeof import("db").prisma;
    let server: Server;
    let base: string;

    /** A cookie-jar-less client: returns the session cookie the server set */
    async function call(path: string, init: RequestInit & { cookie?: string; bearer?: string } = {}) {
        const headers: Record<string, string> = { "Content-Type": "application/json", Origin: "http://localhost:3000", ...(init.headers as any) };
        if (init.cookie) headers.Cookie = init.cookie;
        if (init.bearer) headers.Authorization = `Bearer ${init.bearer}`;
        const res = await fetch(`${base}${path}`, { ...init, headers });
        const setCookie = res.headers.get("set-cookie");
        const cookie = setCookie?.match(/brainly_token=([^;]*)/)?.[1];
        return { res, cookie: cookie ? `brainly_token=${cookie}` : undefined };
    }
    const json = (body: unknown) => JSON.stringify(body);
    const lastLink = (path: string) => {
        const text = sentEmails.at(-1)!.text;
        return decodeURIComponent(text.match(new RegExp(`${path}\\?token=([^\\s]+)`))![1]);
    };

    beforeAll(async () => {
        ({ prisma } = await import("db"));
        const { app } = await import("../src/index");
        server = app.listen(0);
        base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(() => {
        server?.close();
    });

    it("signs up, emails a verification link, and verifies the address", async () => {
        sentEmails.length = 0;
        const { res, cookie } = await call("/signup", { method: "POST", body: json({ username: "verifier", email: "Verify@Example.com", password: "secret12" }) });
        expect(res.status).toBe(200);
        await new Promise((r) => setTimeout(r, 10));
        expect(sentEmails).toHaveLength(1);
        expect(sentEmails[0].to).toBe("Verify@Example.com");

        let me = await (await call("/api/me", { cookie })).res.json();
        expect(me.user).toMatchObject({ emailVerified: false, hasPassword: true });
        expect(me.user.password).toBeUndefined();

        const verified = await call("/auth/verify-email", { method: "POST", body: json({ token: lastLink("/auth/verify") }) });
        expect(verified.res.status).toBe(200);
        me = await (await call("/api/me", { cookie })).res.json();
        expect(me.user.emailVerified).toBe(true);

        // Signing up again with different capitals is still the same email
        const dup = await call("/signup", { method: "POST", body: json({ username: "verifier", email: "verify@example.com", password: "secret12" }) });
        expect(dup.res.status).toBe(400);
    });

    it("resets a forgotten password once, signing out every other session and extension", async () => {
        sentEmails.length = 0;
        const signup = await call("/signup", { method: "POST", body: json({ username: "forgetful", email: "forget@example.com", password: "oldpass1" }) });
        const oldCookie = signup.cookie!;
        const ext = await (await call("/api/extension-token", { method: "POST", cookie: oldCookie })).res.json();

        // Unknown emails get the same answer and no email
        const unknown = await call("/auth/forgot-password", { method: "POST", body: json({ email: "nobody@example.com" }) });
        expect(unknown.res.status).toBe(200);
        await new Promise((r) => setTimeout(r, 10));
        expect(sentEmails.filter((e) => e.subject.includes("Reset"))).toHaveLength(0);

        await call("/auth/forgot-password", { method: "POST", body: json({ email: "FORGET@example.com" }) });
        await new Promise((r) => setTimeout(r, 10));
        const token = lastLink("/auth/reset");

        const reset = await call("/auth/reset-password", { method: "POST", body: json({ token, password: "newpass1" }) });
        expect(reset.res.status).toBe(200);
        expect(reset.cookie).toBeDefined();

        // The link works only once
        const again = await call("/auth/reset-password", { method: "POST", body: json({ token, password: "another1" }) });
        expect(again.res.status).toBe(400);

        // Old browser session and the extension are signed out; the resetting browser is signed in
        expect((await call("/api/me", { cookie: oldCookie })).res.status).toBe(401);
        expect((await call("/api/me", { bearer: ext.token })).res.status).toBe(401);
        expect((await call("/api/me", { cookie: reset.cookie })).res.status).toBe(200);

        expect((await call("/signin", { method: "POST", body: json({ email: "forget@example.com", password: "oldpass1" }) })).res.status).toBe(402);
        expect((await call("/signin", { method: "POST", body: json({ email: "forget@example.com", password: "newpass1" }) })).res.status).toBe(200);
        // Getting the email proved they own the address
        expect((await prisma.user.findFirst({ where: { email: "forget@example.com" } }))?.emailVerified).not.toBeNull();
    });

    it("lists connected extensions and signs one out without touching the others", async () => {
        const { cookie } = await call("/signup", { method: "POST", body: json({ username: "laptops", email: "devices@example.com", password: "secret12" }) });
        const ua = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" };
        const lost = (await (await call("/api/extension-token", { method: "POST", cookie, headers: ua })).res.json()).token;
        const kept = (await (await call("/api/extension-token", { method: "POST", cookie, headers: ua, body: json({ kind: "copy" }) })).res.json()).token;

        const { devices } = await (await call("/api/devices", { cookie })).res.json();
        expect(devices.map((d: any) => d.name).sort()).toEqual(["Chrome on Windows", "Copied token (Chrome on Windows)"]);
        expect((await call("/api/me", { bearer: lost })).res.status).toBe(200);

        const lostDevice = devices.find((d: any) => d.name === "Chrome on Windows");
        expect((await call(`/api/devices/${lostDevice.id}`, { method: "DELETE", cookie })).res.status).toBe(200);
        expect((await call("/api/me", { bearer: lost })).res.status).toBe(401);
        expect((await call("/api/me", { bearer: kept })).res.status).toBe(200);
        expect((await call("/api/me", { cookie })).res.status).toBe(200);

        // Another user can't sign your devices out
        const other = await call("/signup", { method: "POST", body: json({ username: "intruder", email: "intruder@example.com", password: "secret12" }) });
        const keptDevice = devices.find((d: any) => d.name !== "Chrome on Windows");
        expect((await call(`/api/devices/${keptDevice.id}`, { method: "DELETE", cookie: other.cookie })).res.status).toBe(404);

        // The extension can disconnect itself
        expect((await call("/api/devices/current", { method: "DELETE", bearer: kept })).res.status).toBe(200);
        expect((await call("/api/me", { bearer: kept })).res.status).toBe(401);
    });

    it("signs out everywhere, including tokens from before devices existed, but keeps this browser", async () => {
        const { cookie } = await call("/signup", { method: "POST", body: json({ username: "everywhere", email: "everywhere@example.com", password: "secret12" }) });
        const user = await prisma.user.findFirstOrThrow({ where: { email: "everywhere@example.com" } });
        const { signToken } = await import("../src/lib/auth");
        const jwt = (await import("jsonwebtoken")).default;
        // An extension token issued by the previous version: no version, no device
        const legacy = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_TOKEN as string, { expiresIn: "90d" });
        const otherBrowser = `brainly_token=${signToken(user.id, user.username)}`;
        expect((await call("/api/me", { bearer: legacy })).res.status).toBe(200);

        const out = await call("/api/account/sign-out-everywhere", { method: "POST", cookie });
        expect(out.res.status).toBe(200);
        expect((await call("/api/me", { bearer: legacy })).res.status).toBe(401);
        expect((await call("/api/me", { cookie: otherBrowser })).res.status).toBe(401);
        expect((await call("/api/me", { cookie: out.cookie })).res.status).toBe(200);
    });

    it("exports everything as a ZIP", async () => {
        const { cookie } = await call("/signup", { method: "POST", body: json({ username: "exporter", email: "export@example.com", password: "secret12" }) });
        const user = await prisma.user.findFirstOrThrow({ where: { email: "export@example.com" } });
        const note = await prisma.memories.create({ data: { userId: user.id, type: "note", title: "Shopping list", note: "Eggs, milk", tags: ["home"] } });
        await prisma.memories.create({ data: { userId: user.id, type: "url", title: "A site", source_url: "https://example.com", metadata: { context: "for later" } } });
        await prisma.collection.create({ data: { userId: user.id, name: "Errands", memories: { connect: [{ id: note.id }] } } });
        // Two uploaded files (streamed into the ZIP one after another) and one that has gone missing
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const uploads = path.resolve(__dirname, "../uploads");
        await fs.mkdir(uploads, { recursive: true });
        await fs.writeFile(path.join(uploads, "export-test-a.pdf"), "%PDF-1.4 first");
        await fs.writeFile(path.join(uploads, "export-test-b.png"), Buffer.alloc(300_000, 7));
        await prisma.memories.createMany({
            data: [
                { userId: user.id, type: "pdf", title: "Report", file_path: "uploads/export-test-a.pdf" },
                { userId: user.id, type: "image", title: "Report", file_path: "uploads/export-test-b.png" },
                { userId: user.id, type: "pdf", title: "Lost", file_path: "uploads/export-test-missing.pdf" },
            ],
        });
        const convo = await prisma.conversation.create({ data: { userId: user.id, title: "Groceries" } });
        await prisma.message.create({ data: { conversationId: convo.id, role: "user", content: "What do I need?" } });

        const { res } = await call("/api/account/export", { cookie });
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe("application/zip");
        expect(res.headers.get("content-disposition")).toMatch(/attachment; filename="brainly-export-\d{4}-\d{2}-\d{2}\.zip"/);

        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(await res.arrayBuffer());
        const data = JSON.parse(await zip.file("brainly.json")!.async("string"));
        expect(data.account.email).toBe("export@example.com");
        expect(data.memories).toHaveLength(5);
        expect(data.memories[0]).toMatchObject({ title: "Shopping list", note: "Eggs, milk", tags: ["home"], collections: ["Errands"] });
        expect(data.memories[1]).toMatchObject({ url: "https://example.com", context: "for later" });
        expect(data.collections[0]).toMatchObject({ name: "Errands", memoryIds: [note.id] });
        expect(data.chats[0].messages[0].content).toBe("What do I need?");
        expect(await zip.file(`notes/${note.id}-shopping-list.md`)!.async("string")).toContain("Eggs, milk");
        const [pdf, png, lost] = data.memories.slice(2);
        expect(await zip.file(pdf.file)!.async("string")).toBe("%PDF-1.4 first");
        expect((await zip.file(png.file)!.async("uint8array")).length).toBe(300_000);
        expect(zip.file(lost.file)).toBeNull();
        expect(await zip.file("README.txt")!.async("string")).toContain(lost.file);
        await fs.rm(path.join(uploads, "export-test-a.pdf"));
        await fs.rm(path.join(uploads, "export-test-b.png"));
        // Only your own data
        expect(JSON.stringify(data)).not.toContain("Pasta recipe");
    });

    it("Google sign-in takes over an unverified password account (someone may have signed up with your email)", async () => {
        const { signInWithProvider } = await import("../src/config/passport");
        const squatter = await call("/signup", { method: "POST", body: json({ username: "squatter", email: "owner@example.com", password: "secret12" }) });
        const user = await signInWithProvider({ provider: "google", providerAccountId: "g-owner", email: "owner@example.com", username: "Owner" });
        const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
        expect(row.password).toBeNull();
        expect(row.emailVerified).not.toBeNull();
        expect((await call("/api/me", { cookie: squatter.cookie })).res.status).toBe(401);
        expect((await call("/signin", { method: "POST", body: json({ email: "owner@example.com", password: "secret12" }) })).res.status).toBe(402);

        // A verified account keeps its password when Google is linked
        const { cookie } = await call("/signup", { method: "POST", body: json({ username: "careful", email: "careful@example.com", password: "secret12" }) });
        await prisma.user.updateMany({ where: { email: "careful@example.com" }, data: { emailVerified: new Date() } });
        await signInWithProvider({ provider: "google", providerAccountId: "g-careful", email: "careful@example.com", username: "Careful" });
        expect((await call("/api/me", { cookie })).res.status).toBe(200);
    });

    it("deletes the account and everything in it after confirming", async () => {
        const { cookie } = await call("/signup", { method: "POST", body: json({ username: "leaver", email: "leave@example.com", password: "secret12" }) });
        const user = await prisma.user.findFirstOrThrow({ where: { email: "leave@example.com" } });
        const memory = await prisma.memories.create({ data: { userId: user.id, type: "note", title: "Bye", note: "Gone soon" } });
        await prisma.chunks.create({ data: { MemoryId: memory.id, content: "Gone soon", chunk_index: 0 } });
        const ext = (await (await call("/api/extension-token", { method: "POST", cookie })).res.json()).token;

        expect((await call("/api/account", { method: "DELETE", cookie, body: json({ confirm: "someone@example.com", password: "secret12" }) })).res.status).toBe(400);
        expect((await call("/api/account", { method: "DELETE", cookie, body: json({ confirm: "leave@example.com", password: "wrong" }) })).res.status).toBe(402);
        expect(await prisma.user.findUnique({ where: { id: user.id } })).not.toBeNull();

        const deleted = await call("/api/account", { method: "DELETE", cookie, body: json({ confirm: "LEAVE@example.com", password: "secret12" }) });
        expect(deleted.res.status).toBe(200);
        expect(await prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
        expect(await prisma.memories.count({ where: { userId: user.id } })).toBe(0);
        expect(await prisma.chunks.count({ where: { MemoryId: memory.id } })).toBe(0);
        expect(await prisma.device.count({ where: { userId: user.id } })).toBe(0);
        // Old cookie and extension token no longer work
        expect((await call("/api/me", { cookie })).res.status).toBe(401);
        expect((await call("/api/me", { bearer: ext })).res.status).toBe(401);
    });
});
