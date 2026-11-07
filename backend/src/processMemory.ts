import { prisma } from "db";
import { GetPdfText } from "./pdfToText";
import { fetchTweet } from "./fetchTweet";
import { processImage } from "./processImage";
import { chunkMemory, ATOMIC_WORD_THRESHOLD } from "./chunking";
import { GetEmbeddingsBatch } from "./Embeddings";
import { fetchWebPage } from "./ingest/web";
import { fetchYoutube } from "./ingest/youtube";
import { fetchReel } from "./ingest/reel";
import { fetchTikTok } from "./ingest/tiktok";
import { transcribeFile } from "./ingest/transcribe";
import { enrichMemory, cleanTags } from "./ingest/enrich";
import { withLocalFile } from "./lib/storage";
import { cleanTitle } from "./lib/memoryTitle";

interface Extracted {
    text: string;
    metadata?: Record<string, unknown>;
    /** The real title of the page, video or post, when the source has one */
    title?: string | null;
}

/** Turns a memory's source (URL, file or note) into indexable text plus display metadata. */
async function extractText(memory: any): Promise<Extracted> {
    const url: string | null = memory.source_url;

    switch (memory.type) {
        case "url": {
            const page = await fetchWebPage(url!);
            return {
                text: page.text,
                title: page.title,
                metadata: { description: page.description, thumbnail_url: page.image, site_name: page.siteName },
            };
        }
        case "youtube": {
            const video = await fetchYoutube(url!);
            return {
                text: video.text,
                title: video.title,
                metadata: { thumbnail_url: video.thumbnail, duration: video.duration, author: video.author, video_title: video.title },
            };
        }
        case "reel":
        case "tiktok": {
            const info = memory.type === "reel" ? await fetchReel(url!) : await fetchTikTok(url!);
            const label = memory.type === "reel" ? "Instagram Reel" : "TikTok video";
            // Short videos have little text of their own, so the title the user gave is part of
            // what makes them findable (e.g. saving "Project ideas" and later searching "project").
            return {
                text: [
                    `${label}: ${memory.title}`,
                    info.author && `By @${info.author}`,
                    info.caption,
                    info.transcript && `Transcript: ${info.transcript}`,
                ].filter(Boolean).join("\n\n"),
                // The caption's first line usually says what the video is
                title: info.caption ? cleanTitle(info.caption) : null,
                metadata: {
                    thumbnail_url: info.thumbnail,
                    author: info.author || null,
                    description: info.caption || null,
                    has_transcript: Boolean(info.transcript),
                },
            };
        }
        case "tweet":
            return { text: await fetchTweet(url!) };
        case "pdf":
            return { text: await withLocalFile(memory.file_path, GetPdfText) };
        case "image":
            return { text: await withLocalFile(memory.file_path, processImage) };
        case "audio": {
            const transcript = await withLocalFile(memory.file_path, transcribeFile);
            return { text: transcript ? `Voice note: ${memory.title}\n\n${transcript}` : "", metadata: { description: transcript.slice(0, 280) || null } };
        }
        case "note":
            return { text: memory.note ?? "" };
        default:
            throw new Error(`Unsupported memory type: ${memory.type}`);
    }
}

/**
 * Extracts, chunks, embeds and enriches a memory. Throws on failure so the worker can retry;
 * the worker owns status transitions for failures.
 */
export async function processMemory(memory: any) {
    const extracted = await extractText(memory);
    let text = extracted.text?.trim() ?? "";

    if (!text) {
        throw new Error("Could not extract any text from this content");
    }

    const context = memory.metadata?.context;
    if (context) {
        text = `${text}\n\nPersonal note: ${context}`;
    }

    const wordCount = text.split(/\s+/).length;
    const granularity = wordCount <= ATOMIC_WORD_THRESHOLD ? "atomic" : "long_form";
    const chunks = chunkMemory(text, granularity, { memoryId: memory.id });

    // Saved without a title (share sheet, extension): use the source's own title, or ask the AI
    const autoTitle = memory.metadata?.auto_title === true;
    const sourceTitle = autoTitle ? cleanTitle(extracted.title) : null;

    const [embeddings, enrichment] = await Promise.all([
        GetEmbeddingsBatch(chunks.map((c) => c.text)),
        enrichMemory(sourceTitle ?? memory.title, text, { wantTitle: autoTitle && !sourceTitle }),
    ]);
    const title = autoTitle ? sourceTitle ?? cleanTitle(enrichment.title) ?? memory.title : memory.title;

    // Fill gaps in fetched metadata, but never overwrite what the user or an earlier run set
    const metadata: Record<string, unknown> = { ...(memory.metadata ?? {}) };
    for (const [key, value] of Object.entries(extracted.metadata ?? {})) {
        if (value !== null && value !== undefined && value !== "") metadata[key] = value;
    }
    if (!metadata.description && enrichment.summary) metadata.description = enrichment.summary;
    // Once named, the title stays (a retry or edit doesn't rename it)
    if (autoTitle && title !== memory.title) metadata.auto_title = false;

    const tags = cleanTags([...(memory.tags ?? []), ...enrichment.tags], 10);
    const nextReviewAt = memory.nextReviewAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.$transaction([
        // Re-processing (edit, retry) replaces the old chunks
        prisma.chunks.deleteMany({ where: { MemoryId: memory.id } }),
        ...chunks.map((chunk, i) => prisma.$executeRaw`
            INSERT INTO "Chunks" ("MemoryId", content, chunk_index, embedding, metadata, token_count)
            VALUES (
              ${memory.id},
              ${chunk.text},
              ${i},
              ${JSON.stringify(embeddings[i])}::vector,
              ${JSON.stringify(chunk.metadata ?? {})}::jsonb,
              ${chunk.text.split(/\s+/).length}
            )
        `),
        prisma.memories.update({
            where: { id: memory.id },
            data: {
                title,
                granularity,
                metadata: metadata as any,
                summary: enrichment.summary || null,
                tags,
                status: "ready",
                error: null,
                nextAttemptAt: null,
                nextReviewAt,
            },
        }),
    ]);
}
