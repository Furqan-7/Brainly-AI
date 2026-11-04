import { Router } from "express";
import { prisma } from "db";
import { MiddleWhere } from "../MiddleWhere";

export const insightsRouter: Router = Router();

const GRAPH_MAX_NODES = 300;
const GRAPH_MIN_SIMILARITY = Number(process.env.GRAPH_MIN_SIMILARITY ?? 0.55);

/**
 * Knowledge graph: one node per memory, edges between memories whose average chunk
 * embeddings are similar. Shared tags are returned so the client can colour/cluster.
 */
insightsRouter.get("/api/graph", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;

    const nodes = await prisma.memories.findMany({
        where: { userId, status: "ready", archived: false },
        orderBy: { createdAt: "desc" },
        take: GRAPH_MAX_NODES,
        select: { id: true, title: true, type: true, tags: true, source_url: true, starred: true },
    });
    if (nodes.length < 2) return res.status(200).json({ success: true, nodes, edges: [] });

    const ids = nodes.map((n) => n.id);
    const edges = await prisma.$queryRaw<{ source: number; target: number; similarity: number }[]>`
        WITH mem AS (
            SELECT c."MemoryId" AS id, AVG(c.embedding) AS emb
            FROM "Chunks" c
            WHERE c."MemoryId" = ANY(${ids}::int[]) AND c.embedding IS NOT NULL
            GROUP BY c."MemoryId"
        )
        SELECT a.id AS source, b.id AS target, 1 - (a.emb <=> b.emb) AS similarity
        FROM mem a JOIN mem b ON a.id < b.id
        WHERE 1 - (a.emb <=> b.emb) >= ${GRAPH_MIN_SIMILARITY}
        ORDER BY similarity DESC
        LIMIT 600
    `;

    return res.status(200).json({
        success: true,
        nodes,
        edges: edges.map((e) => ({ source: e.source, target: e.target, similarity: Number(Number(e.similarity).toFixed(3)) })),
    });
});

/**
 * "Rediscover" digest: memories due for spaced-repetition review, plus a throwback —
 * something saved over a month ago that the user may have forgotten about.
 */
insightsRouter.get("/api/rediscover", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const select = {
        id: true, title: true, type: true, source_url: true, summary: true, metadata: true,
        tags: true, createdAt: true, reviewInterval: true, file_path: true,
    } as const;

    const due = await prisma.memories.findMany({
        where: { userId, status: "ready", archived: false, nextReviewAt: { lte: new Date() } },
        orderBy: { nextReviewAt: "asc" },
        take: 5,
        select,
    });
    // The throwback is something not already shown as due for review
    const dueIds = due.map((d) => d.id).concat(0);
    const throwbackRows = await prisma.$queryRaw<{ id: number }[]>`
        SELECT id FROM "Memories"
        WHERE "userId" = ${userId} AND status = 'ready' AND archived = false
          AND "createdAt" < now() - interval '30 days'
          AND id <> ALL(${dueIds}::int[])
        ORDER BY random() LIMIT 1
    `;

    const throwback = throwbackRows[0]
        ? await prisma.memories.findUnique({ where: { id: throwbackRows[0].id }, select })
        : null;

    const shape = ({ file_path, ...m }: any) => ({ ...m, has_file: Boolean(file_path) });
    return res.status(200).json({
        success: true,
        due: due.map(shape),
        throwback: throwback ? shape(throwback) : null,
    });
});
