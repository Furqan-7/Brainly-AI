import { prisma } from "db";
import { GetPdfText } from "./pdfToText";
import { UrlToText } from "./UrlToText";
import { getTranscript } from "./getTranscript";
import { fetchTweet } from "./fetchTweet";
import { processImage } from "./processImage";
import { splitIntoChunks } from "./splitIntoChunks";
import { GetEmbeddings } from "./Embeddings";


export async function processMemory(memory: any) {
    try {
        await prisma.memories.update({
            where: { id: memory.id },
            data: { status: "processing" }
        });

        let text: string | null = "";

        console.log(memory);

        if (memory.type == "url" && memory.source_url)
            text = await UrlToText(memory.source_url);
        else if (memory.type == "youtube" && memory.source_url)
            text = await getTranscript(memory.source_url);
        else if (memory.type == "tweet" && memory.source_url)
            text = await fetchTweet(memory.source_url);
        else if (memory.type == "pdf" && memory.file_path) {
            console.log("called Get Pdf Function ");
            text = await GetPdfText(memory.file_path);
        }
        else if (memory.type == "note")
            text = (memory.metadata as any)?.content ?? "";
        else if (memory.type == "image" && memory.file_path)
            text = await processImage(memory.file_path);

        if (!text) {
            console.log("Falied at Text" + text);
            await prisma.memories.update({
                where: { id: memory.id },
                data: { status: "failed" }
            });
            return;
        }
        const chunks = splitIntoChunks(text);

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await GetEmbeddings(chunks[i]);

            await prisma.$executeRaw`
        INSERT INTO "Chunks" ("MemoryId", content, chunk_index, embedding)
        VALUES (
          ${memory.id},
          ${chunks[i]},
          ${i},
          ${JSON.stringify(embedding)}::vector
        )
      `;
        }

        await prisma.memories.update({
            where: { id: memory.id },
            data: { status: "ready" }
        })
    }
    catch (error) {
        console.log("Failed at Embeddings" + error);
        await prisma.memories.update({
            where: { id: memory.id },
            data: { status: "failed" }
        });
        return;
    }
}