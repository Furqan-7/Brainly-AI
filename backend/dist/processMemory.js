"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMemory = processMemory;
const db_1 = require("db");
const pdfToText_1 = require("./pdfToText");
const UrlToText_1 = require("./UrlToText");
const getTranscript_1 = require("./getTranscript");
const fetchTweet_1 = require("./fetchTweet");
const processImage_1 = require("./processImage");
const chunking_1 = require("./chunking");
const Embeddings_1 = require("./Embeddings");
async function processMemory(memory) {
    try {
        await db_1.prisma.memories.update({
            where: { id: memory.id },
            data: { status: "processing" }
        });
        let text = null;
        if (memory.type == "url" && memory.source_url) {
            text = await (0, UrlToText_1.UrlToText)(memory.source_url);
        }
        else if (memory.type == "youtube" && memory.source_url) {
            text = await (0, getTranscript_1.getTranscript)(memory.source_url);
        }
        else if (memory.type == "tweet" && memory.source_url) {
            text = await (0, fetchTweet_1.fetchTweet)(memory.source_url);
        }
        else if (memory.type == "pdf" && memory.file_path) {
            text = await (0, pdfToText_1.GetPdfText)(memory.file_path);
        }
        else if (memory.type == "note") {
            text = memory.note ?? "";
        }
        else if (memory.type == "image" && memory.file_path) {
            text = await (0, processImage_1.processImage)(memory.file_path);
        }
        if (!text) {
            console.log("Failed at Text: " + text);
            await db_1.prisma.memories.update({
                where: { id: memory.id },
                data: { status: "failed" }
            });
            return;
        }
        const wordCount = text.trim().split(/\s+/).length;
        const granularity = wordCount <= chunking_1.ATOMIC_WORD_THRESHOLD ? "atomic" : "long_form";
        const chunks = (0, chunking_1.chunkMemory)(text, granularity, { memoryId: memory.id });
        await db_1.prisma.memories.update({
            where: { id: memory.id },
            data: { granularity }
        });
        for (let i = 0; i < chunks.length; i++) {
            const embedding = await (0, Embeddings_1.GetEmbeddings)(chunks[i].text);
            await db_1.prisma.$executeRaw `
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
        await db_1.prisma.memories.update({
            where: { id: memory.id },
            data: { status: "ready" }
        });
    }
    catch (error) {
        console.log("Failed at Embeddings: " + error);
        await db_1.prisma.memories.update({
            where: { id: memory.id },
            data: { status: "failed" }
        });
        return;
    }
}
//# sourceMappingURL=processMemory.js.map