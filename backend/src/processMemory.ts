import { prisma } from "db";
import { GetPdfText } from "./pdfToText";
import { UrlToText } from "./UrlToText";
import { getTranscript } from "./getTranscript";
import { fetchTweet } from "./fetchTweet";
import { processImage } from "./processImage";
import { fetchReel } from "./fetchReel";
import { chunkMemory, ATOMIC_WORD_THRESHOLD } from "./chunking";
import { GetEmbeddings } from "./Embeddings";

export async function processMemory(memory: any) {
    try {
        await prisma.memories.update({
            where: { id: memory.id },
            data: { status: "processing" }
        });

        let text: string | null = null;

        if (memory.type == "url" && memory.source_url) {
            text = await UrlToText(memory.source_url);
        }
        else if (memory.type == "youtube" && memory.source_url) {
            text = await getTranscript(memory.source_url);
        }
        else if (memory.type == "tweet" && memory.source_url) {
            text = await fetchTweet(memory.source_url);
        }
        else if (memory.type == "pdf" && memory.file_path) {
            text = await GetPdfText(memory.file_path);
        }
        else if (memory.type == "note") {
            text = memory.note ?? "";
        }
        else if (memory.type == "image" && memory.file_path) {
            text = await processImage(memory.file_path);
        }
        else if (memory.type == "reel" && memory.source_url) {
            const reel = await fetchReel(memory.source_url);

            await prisma.memories.update({
                where: { id: memory.id },
                data: {
                    metadata: {
                        ...(memory.metadata ?? {}),
                        thumbnail_url: reel.thumbnail,
                        author: reel.author || null,
                        description: reel.caption || null,
                    }
                }
            });

            // Reels have little text of their own, so the title the user gave is part of
            // what makes them findable (e.g. saving "Project ideas" and later searching "project").
            text = [
                `Instagram Reel: ${memory.title}`,
                reel.author && `By @${reel.author}`,
                reel.caption,
            ].filter(Boolean).join("\n\n");
        }

        const context = memory.metadata?.context;
        if (text && context) {
            text = `${text}\n\nPersonal note: ${context}`;
        }

        if (!text) {
            console.log("Failed at Text: " + text);
            await prisma.memories.update({
                where: { id: memory.id },
                data: { status: "failed" }
            });
            return;
        }

        const wordCount = text.trim().split(/\s+/).length;
        const granularity = wordCount <= ATOMIC_WORD_THRESHOLD ? "atomic" : "long_form";

        const chunks = chunkMemory(text, granularity, { memoryId: memory.id });

        await prisma.memories.update({
            where: { id: memory.id },
            data: { granularity }
        });

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await GetEmbeddings(chunks[i].text);

            await prisma.$executeRaw`
        INSERT INTO "Chunks" ("MemoryId", content, chunk_index, embedding, metadata)
        VALUES (
          ${memory.id},
          ${chunks[i].text},
          ${i},
          ${JSON.stringify(embedding)}::vector,
          ${JSON.stringify(chunks[i].metadata ?? {})}::jsonb
        )
      `;
        }

        await prisma.memories.update({
            where: { id: memory.id },
            data: { status: "ready" }
        });
    }
    catch (error) {
        console.log("Failed at Embeddings: " + error);
        await prisma.memories.update({
            where: { id: memory.id },
            data: { status: "failed" }
        });
        return;
    }
}