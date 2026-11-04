import { Router } from "express";
import crypto from "node:crypto";
import { prisma } from "db";
import { MiddleWhere } from "../MiddleWhere";
import { collectionMemoriesSchema, collectionSchema } from "../types";

export const collectionsRouter: Router = Router();

async function ownedCollection(userId: number, id: number) {
    if (!Number.isInteger(id) || id <= 0) return null;
    return prisma.collection.findFirst({ where: { id, userId } });
}

function isUniqueViolation(error: unknown) {
    return typeof error === "object" && error !== null && (error as any).code === "P2002";
}

collectionsRouter.get("/api/collections", MiddleWhere, async (req, res) => {
    const collections = await prisma.collection.findMany({
        where: { userId: res.locals.userId },
        orderBy: { name: "asc" },
        include: { _count: { select: { memories: true } } },
    });
    return res.status(200).json({
        success: true,
        collections: collections.map(({ _count, ...c }) => ({ ...c, memoryCount: _count.memories })),
    });
});

collectionsRouter.post("/api/collections", MiddleWhere, async (req, res) => {
    const parsed = collectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Invalid Input", success: false });
    try {
        const collection = await prisma.collection.create({ data: { ...parsed.data, userId: res.locals.userId } });
        return res.status(201).json({ success: true, collection: { ...collection, memoryCount: 0 } });
    } catch (error) {
        if (isUniqueViolation(error)) return res.status(409).json({ message: "You already have a collection with that name", success: false });
        throw error;
    }
});

collectionsRouter.patch("/api/collections/:id", MiddleWhere, async (req, res) => {
    const collection = await ownedCollection(res.locals.userId, Number(req.params.id));
    if (!collection) return res.status(404).json({ message: "Collection not found", success: false });
    const parsed = collectionSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Invalid Input", success: false });
    try {
        const updated = await prisma.collection.update({ where: { id: collection.id }, data: parsed.data });
        return res.status(200).json({ success: true, collection: updated });
    } catch (error) {
        if (isUniqueViolation(error)) return res.status(409).json({ message: "You already have a collection with that name", success: false });
        throw error;
    }
});

collectionsRouter.delete("/api/collections/:id", MiddleWhere, async (req, res) => {
    const collection = await ownedCollection(res.locals.userId, Number(req.params.id));
    if (!collection) return res.status(404).json({ message: "Collection not found", success: false });
    // Deletes the collection only; its memories stay in the brain
    await prisma.collection.delete({ where: { id: collection.id } });
    return res.status(200).json({ success: true });
});

collectionsRouter.post("/api/collections/:id/memories", MiddleWhere, async (req, res) => {
    const userId = res.locals.userId;
    const collection = await ownedCollection(userId, Number(req.params.id));
    if (!collection) return res.status(404).json({ message: "Collection not found", success: false });
    const parsed = collectionMemoriesSchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Invalid Input", success: false });

    // Only the user's own memories can be added
    const owned = await prisma.memories.findMany({ where: { userId, id: { in: parsed.data.memoryIds } }, select: { id: true } });
    await prisma.collection.update({ where: { id: collection.id }, data: { memories: { connect: owned } } });
    return res.status(200).json({ success: true, added: owned.length });
});

collectionsRouter.delete("/api/collections/:id/memories/:memoryId", MiddleWhere, async (req, res) => {
    const collection = await ownedCollection(res.locals.userId, Number(req.params.id));
    if (!collection) return res.status(404).json({ message: "Collection not found", success: false });
    await prisma.collection.update({
        where: { id: collection.id },
        data: { memories: { disconnect: { id: Number(req.params.memoryId) || 0 } } },
    });
    return res.status(200).json({ success: true });
});

collectionsRouter.post("/api/collections/:id/share", MiddleWhere, async (req, res) => {
    const collection = await ownedCollection(res.locals.userId, Number(req.params.id));
    if (!collection) return res.status(404).json({ message: "Collection not found", success: false });
    const shareSlug = collection.shareSlug ?? crypto.randomBytes(9).toString("base64url");
    await prisma.collection.update({ where: { id: collection.id }, data: { shareSlug } });
    return res.status(200).json({ success: true, shareSlug });
});

collectionsRouter.delete("/api/collections/:id/share", MiddleWhere, async (req, res) => {
    const collection = await ownedCollection(res.locals.userId, Number(req.params.id));
    if (!collection) return res.status(404).json({ message: "Collection not found", success: false });
    await prisma.collection.update({ where: { id: collection.id }, data: { shareSlug: null } });
    return res.status(200).json({ success: true });
});

/** Public, read-only view of a shared collection. Exposes no private fields (notes, context). */
collectionsRouter.get("/api/public/collections/:slug", async (req, res) => {
    const collection = await prisma.collection.findUnique({
        where: { shareSlug: req.params.slug },
        include: {
            user: { select: { username: true } },
            memories: {
                where: { status: "ready", archived: false },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, title: true, type: true, source_url: true, file_path: true,
                    summary: true, tags: true, metadata: true, createdAt: true,
                },
            },
        },
    });
    if (!collection) return res.status(404).json({ message: "Collection not found", success: false });

    return res.status(200).json({
        success: true,
        collection: {
            name: collection.name,
            description: collection.description,
            owner: collection.user.username,
            memories: collection.memories.map(({ file_path, metadata, ...m }) => {
                const meta = (metadata ?? {}) as Record<string, any>;
                return {
                    ...m,
                    has_file: Boolean(file_path),
                    thumbnail_url: meta.thumbnail_url ?? null,
                    description: meta.description ?? null,
                };
            }),
        },
    });
});
