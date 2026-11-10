import { Router } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { prisma, Prisma } from "db";
import { MiddleWhere } from "../MiddleWhere";
import {
    addContentSchema, listContentSchema, mergeSchema, parseTypes, reviewSchema, updateMemorySchema,
} from "../types";
import { normalizeUrl, isTikTokUrl, youtubeId } from "../lib/urls";
import { isInstagramReelUrl } from "../ingest/reel";
import { youtubeThumbnail } from "../ingest/youtube";
import { IMPORT_EXTENSIONS, parseImport } from "../ingest/imports";
import { needsAutoTitle, provisionalTitle } from "../lib/memoryTitle";
import { cleanTags } from "../ingest/enrich";
import { assertSafeUrlShape } from "../lib/safeFetch";
import { deleteStoredFile, persistUpload, sendStoredFile, TMP_UPLOAD_DIR } from "../lib/storage";
import { canAddMemories, getUsage } from "../lib/plans";
import { wakeWorker } from "../worker";
import { log } from "../lib/logger";

export const contentRouter: Router = Router();

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const upload = multer({
    dest: TMP_UPLOAD_DIR,
    limits: { fileSize: MAX_UPLOAD_BYTES, files: 20 },
});

const FILE_RULES: Record<string, { mime: RegExp; ext: string[] }> = {
    pdf: { mime: /^application\/pdf$/, ext: [".pdf"] },
    image: { mime: /^image\/(png|jpe?g|webp|gif|heic)$/, ext: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic"] },
    audio: {
        mime: /^(audio\/|video\/(webm|mp4|ogg)$)/,
        ext: [".mp3", ".m4a", ".wav", ".webm", ".ogg", ".oga", ".mp4", ".mpeg", ".mpga", ".flac"],
    },
};

const URL_TYPES = ["url", "youtube", "tweet", "reel", "tiktok"];

function fileAllowed(type: string, file: Express.Multer.File) {
    const rule = FILE_RULES[type];
    if (!rule) return false;
    const ext = path.extname(file.originalname).toLowerCase();
    return rule.mime.test(file.mimetype) && rule.ext.includes(ext);
}

/** A plain link to YouTube/Instagram/TikTok/X is saved as that type, so the right fetcher runs. */
export function detectType(type: string, url: string): string {
    if (type !== "url") return type;
    if (youtubeId(url)) return "youtube";
    if (isInstagramReelUrl(url)) return "reel";
    if (isTikTokUrl(url)) return "tiktok";
    if (/^https?:\/\/(www\.)?(twitter|x)\.com\/[^/]+\/status\/\d+/i.test(url)) return "tweet";
    return type;
}

function validateUrlForType(type: string, url: string): string | null {
    try {
        assertSafeUrlShape(url);
    } catch (e) {
        return e instanceof Error ? e.message : "Invalid URL";
    }
    if (type === "reel" && !isInstagramReelUrl(url)) return "Please provide a valid Instagram Reel URL";
    if (type === "tiktok" && !isTikTokUrl(url)) return "Please provide a valid TikTok URL";
    if (type === "youtube" && !youtubeId(url)) return "Please provide a valid YouTube URL";
    if (type === "tweet" && !/\/status\/\d+/.test(url)) return "Please provide a valid tweet URL";
    return null;
}

/** Compares normalized URLs, so it also catches memories saved before canonical_url was stored. */
async function findDuplicate(userId: number, canonicalUrl: string) {
    const saved = await prisma.memories.findMany({
        where: { userId, source_url: { not: null } },
        select: { id: true, title: true, source_url: true },
    });
    return saved.find((m) => normalizeUrl(m.source_url!) === canonicalUrl) ?? null;
}

async function ownedMemory(userId: number, id: number) {
    if (!Number.isInteger(id) || id <= 0) return null;
    const memory = await prisma.memories.findUnique({ where: { id } });
    return memory && memory.userId === userId ? memory : null;
}

async function removeTmp(file?: Express.Multer.File) {
    if (file) await fs.rm(file.path, { force: true });
}

// ─── Create ──────────────────────────────────────────────────────────────────

contentRouter.post("/api/content", MiddleWhere, upload.single("file"), async (req, res) => {
    const userId = res.locals.userId;
    const file = req.file;

    const parsed = addContentSchema.safeParse(req.body);
    if (!parsed.success) {
        await removeTmp(file);
        const issue = parsed.error.issues[0];
        const field = issue?.path.join(".");
        return res.status(411).json({
            message: field ? `Invalid ${field}: ${issue.message}` : "Invalid Input",
            success: false,
            issues: parsed.error.issues.map((i) => i.message),
        });
    }
    const input = parsed.data;
    let type = input.type;
    let sourceUrl = input.source_url?.trim() || null;

    try {
        // Files
        let filePath: string | null = null;
        if (FILE_RULES[type]) {
            if (!file) return res.status(400).json({ message: "File is required", success: false });
            if (!fileAllowed(type, file)) {
                await removeTmp(file);
                return res.status(415).json({ message: `That file type isn't supported for ${type}`, success: false });
            }
            const { plan } = await getUsage(userId);
            if (file.size > plan.maxUploadMb * 1024 * 1024) {
                await removeTmp(file);
                return res.status(413).json({ message: `Files can be up to ${plan.maxUploadMb}MB on the ${plan.name} plan`, success: false });
            }
        } else {
            await removeTmp(file);
        }

        // Links
        let canonicalUrl: string | null = null;
        if (URL_TYPES.includes(type)) {
            if (!sourceUrl) return res.status(411).json({ message: "A URL is required", success: false });
            type = detectType(type, sourceUrl) as typeof type;
            const problem = validateUrlForType(type, sourceUrl);
            if (problem) return res.status(411).json({ message: problem, success: false });

            canonicalUrl = normalizeUrl(sourceUrl);
            const allowDuplicate = input.allowDuplicate === true || input.allowDuplicate === "true";
            const duplicate = allowDuplicate ? null : await findDuplicate(userId, canonicalUrl);
            if (duplicate) {
                return res.status(409).json({
                    message: `You already saved this as "${duplicate.title}"`,
                    success: false,
                    duplicate: true,
                    existingId: duplicate.id,
                });
            }
        } else {
            sourceUrl = null;
        }

        if (type === "note" && !input.note?.trim()) {
            return res.status(411).json({ message: "Note content is required", success: false });
        }

        const quota = await canAddMemories(userId);
        if (!quota.ok) {
            await removeTmp(file);
            return res.status(402).json({ message: quota.message, success: false, upgrade: true });
        }

        if (FILE_RULES[type] && file) {
            filePath = await persistUpload(file.path, file.originalname, file.mimetype);
        }

        const legacyContext = typeof input.metadata === "string" ? input.metadata : null;
        const context = (input.context ?? legacyContext)?.trim() || null;

        const collection = input.collectionId
            ? await prisma.collection.findFirst({ where: { id: input.collectionId, userId }, select: { id: true } })
            : null;

        // No title (or just the link)? Show a provisional one now; processing fills in the real one
        const autoTitle = needsAutoTitle(input.title, sourceUrl);
        const title = autoTitle ? provisionalTitle(type, sourceUrl, type === "note" ? input.note : null, file?.originalname) : input.title!.trim();

        const memory = await prisma.memories.create({
            data: {
                userId,
                type: type as any,
                title,
                source_url: sourceUrl,
                file_path: filePath,
                note: type === "note" ? input.note : null,
                tags: cleanTags(input.tags ?? [], 10),
                metadata: {
                    context,
                    canonical_url: canonicalUrl,
                    thumbnail_url: type === "youtube" && sourceUrl ? youtubeThumbnail(sourceUrl) : null,
                    ...(autoTitle ? { auto_title: true } : {}),
                },
                collections: collection ? { connect: { id: collection.id } } : undefined,
            },
        });

        wakeWorker();
        return res.status(201).json({ message: "Content saved, processing...", success: true, id: memory.id, type, title: memory.title, autoTitle });
    } catch (error) {
        await removeTmp(file);
        log("error", "create memory failed", { error: String(error) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

/** Bulk import of Notion / Google Docs exports and Markdown/text files as notes. */
contentRouter.post("/api/import", MiddleWhere, upload.array("files", 20), async (req, res) => {
    const userId = res.locals.userId;
    const files = (req.files as Express.Multer.File[]) ?? [];
    try {
        const docs = [];
        for (const file of files) {
            const ext = path.extname(file.originalname).toLowerCase();
            if (IMPORT_EXTENSIONS.includes(ext)) {
                docs.push(...(await parseImport(file.originalname, await fs.readFile(file.path))));
            }
        }
        if (docs.length === 0) {
            return res.status(400).json({ message: `No importable files found. Supported: ${IMPORT_EXTENSIONS.join(", ")}`, success: false });
        }

        const quota = await canAddMemories(userId, docs.length);
        if (!quota.ok) return res.status(402).json({ message: quota.message, success: false, upgrade: true });

        const collectionId = Number(req.body.collectionId) || null;
        const collection = collectionId
            ? await prisma.collection.findFirst({ where: { id: collectionId, userId }, select: { id: true } })
            : null;

        await prisma.$transaction(
            docs.map((doc) =>
                prisma.memories.create({
                    data: {
                        userId,
                        type: "note",
                        title: doc.title,
                        note: doc.text,
                        metadata: { imported_from: "file" },
                        collections: collection ? { connect: { id: collection.id } } : undefined,
                    },
                })
            )
        );
        wakeWorker();
        return res.status(201).json({ message: `Imported ${docs.length} notes`, success: true, count: docs.length });
    } catch (error) {
        log("error", "import failed", { error: String(error) });
        return res.status(500).json({ message: "Import failed", success: false });
    } finally {
        await Promise.all(files.map((f) => fs.rm(f.path, { force: true })));
    }
});

// ─── Read ────────────────────────────────────────────────────────────────────

/** One paginated, filterable endpoint replaces the old per-type routes. */
contentRouter.get("/api/content", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const parsed = listContentSchema.safeParse(req.query);
    if (!parsed.success) return res.status(411).json({ message: "Invalid query", success: false });
    const { types, q, tag, view, collectionId, cursor, sort, limit } = parsed.data;
    const oldest = sort === "oldest";

    const where: Prisma.MemoriesWhereInput = {
        userId,
        archived: view === "archived",
        ...(view === "starred" ? { starred: true } : {}),
        ...(parseTypes(types) ? { type: { in: parseTypes(types) as any } } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(collectionId ? { collections: { some: { id: collectionId } } } : {}),
        ...(q
            ? {
                OR: [
                    { title: { contains: q, mode: "insensitive" } },
                    { summary: { contains: q, mode: "insensitive" } },
                    { note: { contains: q, mode: "insensitive" } },
                    { source_url: { contains: q, mode: "insensitive" } },
                    { tags: { has: q.toLowerCase() } },
                ],
            }
            : {}),
        ...(cursor ? { id: oldest ? { gt: cursor } : { lt: cursor } } : {}),
    };

    try {
        const rows = await prisma.memories.findMany({
            where,
            orderBy: { id: oldest ? "asc" : "desc" },
            take: limit + 1,
            include: { collections: { select: { id: true, name: true } } },
        });
        const page = rows.slice(0, limit);
        return res.status(200).json({
            message: "Memories fetched successfully",
            success: true,
            memories: page,
            nextCursor: rows.length > limit ? page[page.length - 1].id : null,
        });
    } catch (error) {
        log("error", "list memories failed", { error: String(error) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Counts for the library's type tabs and the sidebar: per type, starred, archived and added this week. */
contentRouter.get("/api/content/counts", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const active = { userId, archived: false };
    try {
        const [byType, starred, archived, thisWeek] = await Promise.all([
            prisma.memories.groupBy({ by: ["type"], where: active, _count: { _all: true } }),
            prisma.memories.count({ where: { ...active, starred: true } }),
            prisma.memories.count({ where: { userId, archived: true } }),
            prisma.memories.count({ where: { ...active, createdAt: { gte: new Date(Date.now() - WEEK_MS) } } }),
        ]);
        const types = Object.fromEntries(byType.map((r) => [r.type, r._count._all]));
        return res.status(200).json({
            success: true,
            total: byType.reduce((sum, r) => sum + r._count._all, 0),
            types,
            starred,
            archived,
            thisWeek,
        });
    } catch (error) {
        log("error", "count memories failed", { error: String(error) });
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
});

/** Lightweight status polling for memories that are still processing. */
contentRouter.get("/api/content/status", MiddleWhere, async (req, res) => {
    const ids = String(req.query.ids ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 100);
    const memories = await prisma.memories.findMany({
        where: { userId: res.locals.userId, id: { in: ids } },
        include: { collections: { select: { id: true, name: true } } },
    });
    return res.status(200).json({ success: true, memories });
});

contentRouter.get("/api/tags", MiddleWhere, async (req, res) => {
    const rows = await prisma.$queryRaw<{ tag: string; count: bigint }[]>`
        SELECT tag, COUNT(*) AS count
        FROM "Memories", unnest(tags) AS tag
        WHERE "userId" = ${res.locals.userId} AND archived = false
        GROUP BY tag ORDER BY count DESC, tag LIMIT 100
    `;
    return res.status(200).json({ success: true, tags: rows.map((r) => ({ tag: r.tag, count: Number(r.count) })) });
});

contentRouter.get("/api/content/duplicates", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const memories = await prisma.memories.findMany({
        where: { userId },
        select: { id: true, title: true, type: true, source_url: true, metadata: true, createdAt: true, note: true },
        orderBy: { id: "asc" },
    });

    const groups = new Map<string, typeof memories>();
    for (const m of memories) {
        const meta = (m.metadata ?? {}) as Record<string, any>;
        const key = m.source_url
            ? `url:${meta.canonical_url ?? normalizeUrl(m.source_url)}`
            : m.type === "note"
                ? `note:${m.title.trim().toLowerCase()}:${(m.note ?? "").trim().slice(0, 200).toLowerCase()}`
                : null;
        if (!key) continue;
        groups.set(key, [...(groups.get(key) ?? []), m]);
    }
    const duplicates = [...groups.entries()]
        .filter(([, list]) => list.length > 1)
        .map(([key, list]) => ({ key, memories: list.map(({ note, metadata, ...rest }) => rest) }));
    return res.status(200).json({ success: true, groups: duplicates });
});

/** Serves an uploaded file to its owner, or to anyone if it's in a publicly shared collection. */
contentRouter.get("/api/files/:id", async (req, res, next) => {
    const id = Number(req.params.id);
    const memory = await prisma.memories.findUnique({
        where: { id },
        select: { file_path: true, userId: true, collections: { where: { shareSlug: { not: null } }, select: { id: true } } },
    });
    if (!memory?.file_path) return res.status(404).json({ message: "File not found", success: false });
    if (memory.collections.length > 0) return sendStoredFile(res, memory.file_path);

    // Private file — require the owner's session
    MiddleWhere(req, res, async () => {
        if (res.locals.userId !== memory.userId) return res.status(404).json({ message: "File not found", success: false });
        try {
            await sendStoredFile(res, memory.file_path!);
        } catch (e) {
            next(e);
        }
    });
});

// ─── Update ──────────────────────────────────────────────────────────────────

contentRouter.patch("/api/content/:id", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const memory = await ownedMemory(userId, Number(req.params.id));
    if (!memory) return res.status(404).json({ message: "Memory not found", success: false });

    const parsed = updateMemorySchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Invalid Input", success: false });
    const input = parsed.data;

    const meta = (memory.metadata ?? {}) as Record<string, any>;
    const contextChanged = input.context !== undefined && (input.context?.trim() || null) !== (meta.context ?? null);
    const noteChanged = input.note !== undefined && memory.type === "note" && input.note !== memory.note;
    const titleChanged = input.title !== undefined && input.title !== memory.title;
    // Title, note and context are all part of the indexed text, so changing them re-indexes
    const reindex = contextChanged || noteChanged || titleChanged;

    const updated = await prisma.memories.update({
        where: { id: memory.id },
        data: {
            title: input.title,
            note: memory.type === "note" ? input.note ?? undefined : undefined,
            tags: input.tags ? cleanTags(input.tags, 10) : undefined,
            starred: input.starred,
            archived: input.archived,
            // A title the user typed is kept from then on, instead of the automatic one
            metadata: contextChanged || (titleChanged && meta.auto_title)
                ? { ...meta, ...(contextChanged ? { context: input.context?.trim() || null } : {}), ...(titleChanged ? { auto_title: false } : {}) }
                : undefined,
            ...(reindex ? { status: "pending", attempts: 0, nextAttemptAt: null, error: null } : {}),
        },
        include: { collections: { select: { id: true, name: true } } },
    });
    if (reindex) wakeWorker();
    return res.status(200).json({ success: true, memory: updated, reindexing: reindex });
});

contentRouter.post("/api/content/:id/retry", MiddleWhere, async (req, res) => {
    const memory = await ownedMemory(res.locals.userId, Number(req.params.id));
    if (!memory) return res.status(404).json({ message: "Memory not found", success: false });
    await prisma.memories.update({
        where: { id: memory.id },
        data: { status: "pending", attempts: 0, nextAttemptAt: null, error: null },
    });
    wakeWorker();
    return res.status(200).json({ success: true });
});

/** Spaced repetition: remembering doubles the interval (max ~6 months), forgetting resets it. */
contentRouter.post("/api/content/:id/review", MiddleWhere, async (req, res) => {
    const memory = await ownedMemory(res.locals.userId, Number(req.params.id));
    if (!memory) return res.status(404).json({ message: "Memory not found", success: false });
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Invalid Input", success: false });

    const interval = parsed.data.remembered ? Math.min(memory.reviewInterval * 2, 180) : 1;
    const updated = await prisma.memories.update({
        where: { id: memory.id },
        data: { reviewInterval: interval, nextReviewAt: new Date(Date.now() + interval * 24 * 60 * 60 * 1000) },
        select: { id: true, reviewInterval: true, nextReviewAt: true },
    });
    return res.status(200).json({ success: true, memory: updated });
});

contentRouter.post("/api/content/merge", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const parsed = mergeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Invalid Input", success: false });
    const { keepId } = parsed.data;
    const removeIds = parsed.data.removeIds.filter((id) => id !== keepId);

    const all = await prisma.memories.findMany({
        where: { userId, id: { in: [keepId, ...removeIds] } },
        include: { collections: { select: { id: true } } },
    });
    const keep = all.find((m) => m.id === keepId);
    const remove = all.filter((m) => m.id !== keepId);
    if (!keep || remove.length !== removeIds.length) {
        return res.status(404).json({ message: "Memory not found", success: false });
    }

    const contexts = [keep, ...remove]
        .map((m) => ((m.metadata ?? {}) as Record<string, any>).context)
        .filter((c): c is string => Boolean(c));
    const mergedContext = [...new Set(contexts)].join("\n\n") || null;
    const keepMeta = (keep.metadata ?? {}) as Record<string, any>;

    await prisma.$transaction([
        prisma.memories.update({
            where: { id: keep.id },
            data: {
                tags: cleanTags([...keep.tags, ...remove.flatMap((m) => m.tags)], 10),
                starred: keep.starred || remove.some((m) => m.starred),
                collections: { connect: remove.flatMap((m) => m.collections).map((c) => ({ id: c.id })) },
                ...(mergedContext !== (keepMeta.context ?? null)
                    ? { metadata: { ...keepMeta, context: mergedContext }, status: "pending", attempts: 0, nextAttemptAt: null }
                    : {}),
            },
        }),
        prisma.memories.deleteMany({ where: { id: { in: removeIds }, userId } }),
    ]);
    await Promise.all(remove.map((m) => (m.file_path !== keep.file_path ? deleteStoredFile(m.file_path) : null)));
    wakeWorker();
    return res.status(200).json({ success: true, keptId: keep.id, removed: removeIds.length });
});

// ─── Delete ──────────────────────────────────────────────────────────────────

async function deleteMemory(userId: number, id: number) {
    const memory = await ownedMemory(userId, id);
    if (!memory) return false;
    // Chunks and collection links cascade in the database
    await prisma.memories.delete({ where: { id } });
    await deleteStoredFile(memory.file_path);
    return true;
}

// Kept for older clients that send the id in the body (registered before /:id so it isn't shadowed)
contentRouter.delete("/api/content/delete", MiddleWhere, async (req, res) => {
    const deleted = await deleteMemory(res.locals.userId, Number(req.body?.memoryId));
    if (!deleted) return res.status(404).json({ message: "Memory not found", success: false });
    return res.status(200).json({ message: "Memory deleted successfully", success: true });
});

contentRouter.delete("/api/content/:id", MiddleWhere, async (req, res) => {
    const deleted = await deleteMemory(res.locals.userId, Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Memory not found", success: false });
    return res.status(200).json({ message: "Memory deleted successfully", success: true });
});

