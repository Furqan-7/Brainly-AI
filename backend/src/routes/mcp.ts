import { Router, Request, Response, NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { prisma } from "db";
import { MiddleWhere } from "../MiddleWhere";
import { MEMORY_TYPES, MemoryType } from "../lib/searchFilters";
import { searchWithFallback, toSources } from "../rag";
import { applyVectorCutoff, dedupeByMemory } from "../Retrieval";
import { stripTimestamps } from "../ingest/timestamps";
import { normalizeUrl } from "../lib/urls";
import { canAddMemories } from "../lib/plans";
import { needsAutoTitle, provisionalTitle } from "../lib/memoryTitle";
import { cleanTags } from "../ingest/enrich";
import { youtubeThumbnail } from "../ingest/youtube";
import { wakeWorker } from "../worker";
import { log } from "../lib/logger";
import { detectType, findDuplicate, validateUrlForType } from "./content";

/**
 * Brainly as an MCP server (Model Context Protocol), so AI assistants such as Claude, ChatGPT or
 * Cursor can search, read and add to the user's memories. Streamable HTTP, stateless: every
 * POST /mcp is one JSON-RPC exchange, signed in with a Brainly token (the one from /extension).
 */
export const mcpRouter: Router = Router();

const SERVER_INFO = { name: "brainly", version: "1.0.0" };

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const json = (value: unknown): ToolResult => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });
const fail = (message: string): ToolResult => ({ content: [{ type: "text", text: message }], isError: true });

/** Chunks overlap (the next one repeats the end of the previous one); joins them without the repeats. */
export function joinChunks(chunks: string[]): string {
    let words: string[] = [];
    for (const chunk of chunks) {
        const next = chunk.split(/\s+/).filter(Boolean);
        let overlap = 0;
        for (let n = Math.min(80, words.length, next.length); n > 0; n--) {
            if (words.slice(-n).join(" ") === next.slice(0, n).join(" ")) {
                overlap = n;
                break;
            }
        }
        words = words.concat(next.slice(overlap));
    }
    return words.join(" ");
}

const typeList = z.array(z.enum(MEMORY_TYPES as [MemoryType, ...MemoryType[]])).optional();

/** One server per request (stateless), with the tools bound to the signed-in user. */
export function buildServer(userId: number): McpServer {
    const server = new McpServer(SERVER_INFO, {
        instructions:
            "Brainly is the user's personal knowledge base: links, YouTube videos, Instagram reels, TikToks, tweets, PDFs, images, " +
            "voice notes and notes they saved. Use search_memories to find what they saved about a topic, get_memory to read one " +
            "in full, list_recent_memories for what they saved lately, and save_memory to add a link or note when they ask.",
    });

    server.registerTool(
        "search_memories",
        {
            title: "Search Brainly",
            description:
                "Search the user's saved memories by meaning and keywords. Returns the best matches with title, type, link, " +
                "AI summary and the passage that matched. Words like 'reels', 'PDFs' or 'last month' in the query also filter.",
            inputSchema: {
                query: z.string().min(1).max(500).describe("What to look for, in plain words"),
                types: typeList.describe("Only these kinds of memory"),
                collection: z.string().max(100).optional().describe("Only memories in the collection with this name"),
                limit: z.number().int().min(1).max(20).optional().describe("How many results (default 8)"),
            },
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ query, types, collection, limit }) => {
            let collectionId: number | undefined;
            if (collection) {
                const found = await prisma.collection.findFirst({
                    where: { userId, name: { equals: collection, mode: "insensitive" } },
                    select: { id: true },
                });
                if (!found) return fail(`No collection named "${collection}"`);
                collectionId = found.id;
            }
            const { results } = await searchWithFallback(userId, query, { types, collectionId }, undefined, 40);
            const matches = toSources(applyVectorCutoff(dedupeByMemory(results)).slice(0, limit ?? 8));
            return json({
                results: matches.map((s) => ({
                    id: s.memoryId,
                    title: s.title,
                    type: s.type,
                    url: s.source_url,
                    summary: s.summary,
                    passage: s.passage,
                    author: s.author,
                    site: s.site_name,
                    saved_at: s.savedAt,
                    ...(s.timestamp ? { video_time_seconds: s.timestamp } : {}),
                })),
            });
        }
    );

    server.registerTool(
        "get_memory",
        {
            title: "Read a memory",
            description: "Read one saved memory in full: its text (page, transcript, PDF or note), summary, tags, the user's own note and collections.",
            inputSchema: { id: z.number().int().positive().describe("The memory id from search_memories or list_recent_memories") },
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ id }) => {
            const memory = await prisma.memories.findFirst({
                where: { id, userId },
                include: {
                    chunks: { orderBy: { chunk_index: "asc" }, select: { content: true } },
                    collections: { select: { name: true } },
                },
            });
            if (!memory) return fail(`No memory with id ${id}`);
            const meta = (memory.metadata ?? {}) as Record<string, any>;
            let text = memory.type === "note" ? memory.note ?? "" : joinChunks(memory.chunks.map((c) => c.content));
            if (memory.type === "youtube") text = stripTimestamps(text);
            text = text.replace(/\n*Personal note: [\s\S]*$/, "").trim();
            return json({
                id: memory.id,
                title: memory.title,
                type: memory.type,
                url: memory.source_url,
                status: memory.status,
                saved_at: memory.createdAt.toISOString(),
                summary: memory.summary,
                tags: memory.tags,
                starred: memory.starred,
                personal_note: meta.context ?? null,
                collections: memory.collections.map((c) => c.name),
                text: text.length > 60_000 ? `${text.slice(0, 60_000)}… (cut off)` : text,
            });
        }
    );

    server.registerTool(
        "list_recent_memories",
        {
            title: "Recent saves",
            description: "List what the user saved most recently, newest first.",
            inputSchema: {
                types: typeList.describe("Only these kinds of memory"),
                limit: z.number().int().min(1).max(50).optional().describe("How many (default 15)"),
            },
            annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ types, limit }) => {
            const rows = await prisma.memories.findMany({
                where: { userId, archived: false, ...(types?.length ? { type: { in: types } } : {}) },
                orderBy: { createdAt: "desc" },
                take: limit ?? 15,
                select: { id: true, title: true, type: true, source_url: true, summary: true, tags: true, createdAt: true, status: true },
            });
            return json({
                memories: rows.map((m) => ({
                    id: m.id, title: m.title, type: m.type, url: m.source_url, summary: m.summary, tags: m.tags,
                    saved_at: m.createdAt.toISOString(), status: m.status,
                })),
            });
        }
    );

    server.registerTool(
        "save_memory",
        {
            title: "Save to Brainly",
            description:
                "Save a link (article, YouTube, Instagram reel, TikTok, X post…) or a text note to the user's Brainly. " +
                "Give either url or note. Brainly reads it, names it and adds a summary and tags in the background.",
            inputSchema: {
                url: z.string().max(2000).optional().describe("A web link to save"),
                note: z.string().max(200_000).optional().describe("Text to save as a note (Markdown is fine)"),
                title: z.string().max(300).optional().describe("A title; leave out to let Brainly name it"),
                context: z.string().max(5000).optional().describe("Why it's being saved, kept as the user's personal note"),
                tags: z.array(z.string().max(40)).max(10).optional(),
            },
            annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        },
        async ({ url, note, title, context, tags }) => {
            const sourceUrl = url?.trim() || null;
            const text = note?.trim() || null;
            if (!sourceUrl === !text) return fail("Give either url or note (not both).");

            let type = "note";
            let canonicalUrl: string | null = null;
            if (sourceUrl) {
                type = detectType("url", sourceUrl);
                const problem = validateUrlForType(type, sourceUrl);
                if (problem) return fail(problem);
                canonicalUrl = normalizeUrl(sourceUrl);
                const duplicate = await findDuplicate(userId, canonicalUrl);
                if (duplicate) return json({ saved: false, already_saved: true, id: duplicate.id, title: duplicate.title });
            }
            const quota = await canAddMemories(userId);
            if (!quota.ok) return fail(quota.message ?? "Plan limit reached");

            const autoTitle = needsAutoTitle(title, sourceUrl);
            const memory = await prisma.memories.create({
                data: {
                    userId,
                    type: type as any,
                    title: autoTitle ? provisionalTitle(type, sourceUrl, text) : title!.trim(),
                    source_url: sourceUrl,
                    note: text,
                    tags: cleanTags(tags ?? [], 10),
                    metadata: {
                        context: context?.trim() || null,
                        canonical_url: canonicalUrl,
                        thumbnail_url: type === "youtube" && sourceUrl ? youtubeThumbnail(sourceUrl) : null,
                        saved_from: "mcp",
                        ...(autoTitle ? { auto_title: true } : {}),
                    },
                },
            });
            wakeWorker();
            return json({ saved: true, id: memory.id, type, title: memory.title, status: "processing" });
        }
    );

    return server;
}

/**
 * Only an explicit token signs in here, never the site cookie: an AI client always sends one,
 * and it keeps a web page from driving the endpoint with the visitor's session.
 */
function requireBearer(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
        res.setHeader("WWW-Authenticate", 'Bearer realm="brainly"');
        return res.status(401).json({
            jsonrpc: "2.0",
            error: { code: -32001, message: "Add your Brainly token as an 'Authorization: Bearer <token>' header (get one on the Extension page)." },
            id: null,
        });
    }
    return MiddleWhere(req, res, next);
}

mcpRouter.post("/mcp", requireBearer, async (req, res) => {
    const server = buildServer(res.locals.userId);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => {
        void transport.close();
        void server.close();
    });
    try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        log("error", "mcp request failed", { error: String(error) });
        if (!res.headersSent) {
            res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
        }
    }
});

// Stateless server: no standalone event stream and no sessions to end
const notAllowed = (_req: Request, res: Response) => {
    res.setHeader("Allow", "POST");
    res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
};
mcpRouter.get("/mcp", notAllowed);
mcpRouter.delete("/mcp", notAllowed);
