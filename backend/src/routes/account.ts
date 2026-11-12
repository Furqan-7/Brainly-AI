import path from "node:path";
import { Router } from "express";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import archiver from "archiver";
import { prisma } from "db";
import { MiddleWhere } from "../MiddleWhere";
import { clearAuthCookie, setAuthCookie, signToken } from "../lib/auth";
import { deleteStoredFile, openStoredFile } from "../lib/storage";
import { log } from "../lib/logger";
import { deleteAccountSchema } from "../types";

export const accountRouter: Router = Router();

// ─── Connected devices ───────────────────────────────────────────────────────

accountRouter.get("/api/devices", MiddleWhere, async (req, res) => {
    const devices = await prisma.device.findMany({
        where: { userId: res.locals.userId },
        orderBy: { lastUsedAt: "desc" },
        select: { id: true, name: true, createdAt: true, lastUsedAt: true },
    });
    return res.status(200).json({
        success: true,
        devices: devices.map((d) => ({ ...d, current: d.id === res.locals.deviceId })),
    });
});

/** Signs one extension out. `current` is the extension making the request (its own Disconnect). */
accountRouter.delete("/api/devices/:id", MiddleWhere, async (req, res) => {
    const id = req.params.id === "current" ? res.locals.deviceId : String(req.params.id);
    if (!id) return res.status(404).json({ message: "Device not found", success: false });
    const { count } = await prisma.device.deleteMany({ where: { id, userId: res.locals.userId } });
    if (!count) return res.status(404).json({ message: "Device not found", success: false });
    return res.status(200).json({ success: true });
});

/**
 * Signs out every browser and extension, including tokens from before devices were tracked.
 * The browser that asked stays signed in with a fresh session.
 */
accountRouter.post("/api/account/sign-out-everywhere", MiddleWhere, async (req, res) => {
    const user = await prisma.user.update({
        where: { id: res.locals.userId },
        data: { tokenVersion: { increment: 1 }, devices: { deleteMany: {} } },
        select: { id: true, username: true, tokenVersion: true },
    });
    if (!res.locals.deviceId) setAuthCookie(req, res, signToken(user.id, user.username, { tokenVersion: user.tokenVersion }));
    else clearAuthCookie(req, res);
    return res.status(200).json({ success: true });
});

// ─── Export ──────────────────────────────────────────────────────────────────

// Exports read every memory and file: a few per hour is plenty
const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
    message: { message: "You've downloaded your data a few times already. Try again in an hour.", success: false },
});

/** "My trip: Rome & Paris!" → "my-trip-rome-paris" */
function slug(text: string): string {
    return text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 60).replace(/-+$/, "") || "untitled";
}

const README = (username: string, date: string, missing: string[]) => `Your Brainly export
===================

Account: ${username}
Exported: ${date}

brainly.json   Everything you saved: memories (links, notes, your context, summaries, tags,
               stars), collections and your chats with Brainly, as JSON.
notes/         Your notes as Markdown files.
files/         The PDFs, images and audio you uploaded.

Each memory in brainly.json lists its file under "file", and its collections by name.
${missing.length ? `\nThese files could not be read and are missing from this export:\n${missing.map((m) => `  - ${m}`).join("\n")}\n` : ""}`;

/**
 * Downloads everything the user saved as a ZIP, streamed as it is built so even a large library
 * never sits in memory: brainly.json, notes as Markdown, and the uploaded files.
 */
accountRouter.get("/api/account/export", MiddleWhere, exportLimiter, async (req, res) => {
    const userId = res.locals.userId;
    const [user, memories, collections, conversations] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true, createdAt: true, isPremium: true } }),
        prisma.memories.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true, type: true, title: true, source_url: true, file_path: true, note: true, metadata: true, summary: true,
                tags: true, starred: true, archived: true, status: true, createdAt: true, collections: { select: { name: true } },
            },
        }),
        prisma.collection.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true, description: true, shareSlug: true, createdAt: true, memories: { select: { id: true } } },
        }),
        prisma.conversation.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: { id: true, title: true, createdAt: true, messages: { orderBy: { createdAt: "asc" }, select: { role: true, content: true, sources: true, createdAt: true } } },
        }),
    ]);
    if (!user) return res.status(401).json({ message: "Not signed in", success: false });

    const exportedAt = new Date().toISOString();
    const files: { name: string; filePath: string }[] = [];
    const used = new Set<string>();
    const unique = (name: string) => {
        let candidate = name;
        for (let i = 2; used.has(candidate); i++) candidate = name.replace(/(\.[^./]*)?$/, `-${i}$1`);
        used.add(candidate);
        return candidate;
    };

    const data = {
        exportedAt,
        account: { username: user.username, email: user.email, createdAt: user.createdAt, plan: user.isPremium ? "premium" : "free" },
        memories: memories.map((m) => {
            const { context, ...metadata } = (m.metadata ?? {}) as Record<string, unknown>;
            let file: string | null = null;
            if (m.file_path) {
                file = unique(`files/${m.id}-${slug(m.title)}${path.extname(m.file_path).toLowerCase()}`);
                files.push({ name: file, filePath: m.file_path });
            }
            return {
                id: m.id, type: m.type, title: m.title, url: m.source_url, note: m.note, context: context ?? null,
                summary: m.summary, tags: m.tags, starred: m.starred, archived: m.archived, status: m.status,
                savedAt: m.createdAt, collections: m.collections.map((c) => c.name), file, metadata,
            };
        }),
        collections: collections.map((c) => ({
            id: c.id, name: c.name, description: c.description, sharedPublicly: Boolean(c.shareSlug), createdAt: c.createdAt,
            memoryIds: c.memories.map((m) => m.id),
        })),
        chats: conversations.map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt, messages: c.messages })),
    };

    const archive = archiver("zip", { zlib: { level: 6 } });
    let aborted = false;
    // Names of entries written to the ZIP so far, and a waiter for the next one
    const written = new Set<string>();
    let wake: () => void = () => undefined;
    const stop = () => {
        aborted = true;
        wake();
    };
    const writtenToZip = (name: string) =>
        new Promise<void>((resolve) => {
            const check = () => (aborted || written.has(name) ? resolve() : void (wake = check));
            check();
        });

    archive.on("entry", (entry) => {
        written.add(entry.name);
        wake();
    });
    res.on("close", () => {
        if (res.writableFinished) return;
        stop();
        archive.abort();
    });
    archive.on("warning", (err) => log("warn", "export warning", { error: err.message }));
    archive.on("error", (err) => {
        log("error", "export failed", { userId, error: err.message });
        stop();
        res.destroy(err);
    });

    res.status(200);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="brainly-export-${exportedAt.slice(0, 10)}.zip"`);
    res.setHeader("Cache-Control", "no-store");
    archive.pipe(res);

    archive.append(JSON.stringify(data, null, 2), { name: "brainly.json" });
    for (const m of memories) {
        if (m.type !== "note" || !m.note) continue;
        archive.append(`# ${m.title}\n\n${m.note}\n`, { name: unique(`notes/${m.id}-${slug(m.title)}.md`), date: m.createdAt });
    }

    // One file at a time: the next download starts only once the previous one is in the ZIP
    const missing: string[] = [];
    for (const file of files) {
        if (aborted) return;
        let stream;
        try {
            stream = await openStoredFile(file.filePath);
        } catch {
            missing.push(file.name);
            continue;
        }
        archive.append(stream, { name: file.name });
        await writtenToZip(file.name);
    }
    if (aborted) return;
    archive.append(README(user.username, exportedAt, missing), { name: "README.txt" });
    await archive.finalize();
});

// ─── Delete account ──────────────────────────────────────────────────────────

const deleteLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

/**
 * Deletes the account and everything in it: memories (and their search index), uploaded files,
 * collections (shared links stop working), chats, connected devices and linked Google / GitHub
 * sign-ins. Confirmed by typing the account's email, plus the password if it has one.
 */
accountRouter.delete("/api/account", MiddleWhere, deleteLimiter, async (req, res) => {
    const parsed = deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(411).json({ message: "Type your email to confirm.", success: false });

    const user = await prisma.user.findUnique({ where: { id: res.locals.userId } });
    if (!user) return res.status(401).json({ message: "Not signed in", success: false });
    if (parsed.data.confirm.toLowerCase() !== user.email.toLowerCase()) {
        return res.status(400).json({ message: "That isn't your account's email.", success: false });
    }
    if (user.password && !(await bcrypt.compare(parsed.data.password ?? "", user.password))) {
        return res.status(402).json({ message: "Incorrect password.", success: false });
    }

    const stored = await prisma.memories.findMany({ where: { userId: user.id, file_path: { not: null } }, select: { file_path: true } });
    // Everything else cascades in the database
    await prisma.user.delete({ where: { id: user.id } });
    // Files last, so a failure here never leaves an account whose files are gone
    for (const { file_path } of stored) await deleteStoredFile(file_path);

    log("info", "account deleted", { userId: user.id, files: stored.length });
    clearAuthCookie(req, res);
    return res.status(200).json({ success: true });
});
