// retrieval.ts
import { prisma } from "db";
import { GetEmbeddings } from "./Embeddings";
import { CohereClient } from "cohere-ai";
import { canUseCohere, incrementCohereUsage } from "./apiUsage";

interface RetrievedChunk {
  id: number;
  content: string;
  memoryId: number;
  chunk_index: number;
  metadata: Record<string, any>;
  title: string;
  type: string;
  source_url: string | null;
  vector_score: number;
  keyword_score: number;
  combined_score: number;
}

export async function hybridSearch(
  query: string,
  userId: number,
  topK: number = 6
): Promise<RetrievedChunk[]> {
  const embeddingStart = performance.now();
  const queryEmbedding = await GetEmbeddings(query);
  console.log("Embedding:", performance.now() - embeddingStart);

  const retrievalStart = performance.now();
  // reciprocal rank fusion (RRF) — combines two ranked lists without needing
  // to normalize/compare raw scores directly, which is the standard approach
  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    WITH vector_search AS (
      SELECT c.id, c.content, c."MemoryId" as "memoryId", c.chunk_index, c.metadata,
             m.title, m.type, m.source_url,
             ROW_NUMBER() OVER (ORDER BY c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as rank
      FROM "Chunks" c
      JOIN "Memories" m ON m.id = c."MemoryId"
      WHERE m."userId" = ${userId}
      ORDER BY c.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT 20
    ),
    keyword_search AS (
      SELECT c.id, c.content, c."MemoryId" as "memoryId", c.chunk_index, c.metadata,
             m.title, m.type, m.source_url,
             ROW_NUMBER() OVER (ORDER BY ts_rank(c.content_tsv, plainto_tsquery('english', ${query})) DESC) as rank
      FROM "Chunks" c
      JOIN "Memories" m ON m.id = c."MemoryId"
      WHERE m."userId" = ${userId}
        AND c.content_tsv @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank(c.content_tsv, plainto_tsquery('english', ${query})) DESC
      LIMIT 20
    )
    SELECT
      COALESCE(v.id, k.id) as id,
      COALESCE(v.content, k.content) as content,
      COALESCE(v."memoryId", k."memoryId") as "memoryId",
      COALESCE(v.chunk_index, k.chunk_index) as chunk_index,
      COALESCE(v.metadata, k.metadata) as metadata,
      COALESCE(v.title, k.title) as title,
      COALESCE(v.type, k.type) as type,
      COALESCE(v.source_url, k.source_url) as source_url,
      (1.0 / (60 + COALESCE(v.rank, 1000))) + (1.0 / (60 + COALESCE(k.rank, 1000))) as combined_score
    FROM vector_search v
    FULL OUTER JOIN keyword_search k ON v.id = k.id
    ORDER BY combined_score DESC
    LIMIT ${topK}
  `;
  console.log("Retrieval:", performance.now() - retrievalStart);

  return results;
}




export async function expandWithNeighbors(chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
  const expanded = await Promise.all(
    chunks.map(async (chunk) => {
      const neighbors = await prisma.chunks.findMany({
        where: {
          MemoryId: chunk.memoryId,
          chunk_index: { in: [chunk.chunk_index - 1, chunk.chunk_index + 1] }
        }
      });
      const combinedText = [...neighbors.filter(n => n.chunk_index < chunk.chunk_index), chunk, ...neighbors.filter(n => n.chunk_index > chunk.chunk_index)]
        .sort((a, b) => a.chunk_index - b.chunk_index)
        .map(c => c.content)
        .join(" ");
      return { ...chunk, content: combinedText };
    })
  );
  return expanded;
}




const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  topN: number = 5
): Promise<RetrievedChunk[]> {
  if (chunks.length === 0) return [];

  const hasQuota = await canUseCohere();
  if (!hasQuota) {
    console.log("Cohere rerank limit reached this month — skipping reranking");
    return chunks.slice(0, topN);
  }

  try {
    const rerankResponse = await cohere.rerank({
      model: "rerank-v3.5",
      query,
      documents: chunks.map((c) => c.content.slice(0, 800)), // cap ~150-200 words per doc for scoring
      topN,
    });

    await incrementCohereUsage();

    return rerankResponse.results.map((result) => ({
      ...chunks[result.index], // full original content preserved for the actual LLM context
      rerank_score: result.relevanceScore,
    }));
  } catch (error) {
    console.error("Cohere rerank error, falling back:", error);
    return chunks.slice(0, topN);
  }
}