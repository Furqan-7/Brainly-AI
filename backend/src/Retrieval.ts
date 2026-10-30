// retrieval.ts
import { prisma, Prisma } from "db";
import { GetEmbeddings } from "./Embeddings";
import { CohereClient } from "cohere-ai";
import { canUseCohere, incrementCohereUsage } from "./apiUsage";
import type { SearchFilters } from "./lib/searchFilters";

export interface RetrievedChunk {
  id: number;
  content: string;
  memoryId: number;
  chunk_index: number;
  metadata: Record<string, any>;
  title: string;
  type: string;
  source_url: string | null;
  file_path: string | null;
  memory_metadata: Record<string, any> | null;
  summary: string | null;
  createdAt: Date;
  vector_distance: number | null;
  keyword_rank: number | null;
  combined_score: number;
  rerank_score?: number;
}

export interface HybridSearchOptions {
  userId: number;
  /** The user's question, embedded as a query and used for keyword search */
  question: string;
  /** Optional HyDE hypothetical answer, embedded as a document */
  hypotheticalAnswer?: string;
  topK?: number;
  filters?: SearchFilters;
}

// Results weaker than these are dropped instead of being passed to the LLM as "sources".
// Tunable per deployment since score distributions depend on the embedding/rerank models.
const MIN_RERANK_SCORE = Number(process.env.MIN_RERANK_SCORE ?? 0.1);
const MAX_VECTOR_DISTANCE = Number(process.env.MAX_VECTOR_DISTANCE ?? 0.6);

function filterSql(userId: number, filters: SearchFilters = {}) {
  const parts = [
    Prisma.sql`m."userId" = ${userId}`,
    Prisma.sql`m.status = 'ready'`,
    Prisma.sql`m.archived = false`,
  ];
  if (filters.types?.length) parts.push(Prisma.sql`m.type::text IN (${Prisma.join(filters.types)})`);
  if (filters.from) parts.push(Prisma.sql`m."createdAt" >= ${filters.from}`);
  if (filters.to) parts.push(Prisma.sql`m."createdAt" < ${filters.to}`);
  if (filters.collectionId) {
    parts.push(Prisma.sql`EXISTS (SELECT 1 FROM "_CollectionToMemories" cm WHERE cm."B" = m.id AND cm."A" = ${filters.collectionId})`);
  }
  return Prisma.join(parts, " AND ");
}

export async function hybridSearch({
  userId,
  question,
  hypotheticalAnswer,
  topK = 10,
  filters,
}: HybridSearchOptions): Promise<RetrievedChunk[]> {
  const embeddingStart = performance.now();
  // Nomic embeddings are asymmetric: the question is embedded as a query, the HyDE answer
  // (which reads like a saved document) as a document. A chunk's distance is the closer of the two.
  let questionEmbedding: number[] | null = null;
  let hydeEmbedding: number[] | null = null;
  try {
    [questionEmbedding, hydeEmbedding] = await Promise.all([
      GetEmbeddings(question, "search_query"),
      hypotheticalAnswer ? GetEmbeddings(hypotheticalAnswer, "search_document") : Promise.resolve(null),
    ]);
  } catch (error) {
    // Embedding provider down or misconfigured: degrade to keyword-only search instead of failing
    console.error("Embedding failed, falling back to keyword search:", error instanceof Error ? error.message : error);
  }
  console.log("Embedding:", performance.now() - embeddingStart);

  // "[0]" is only a placeholder that keeps the SQL valid; the vector branch is disabled then
  const q1 = JSON.stringify(questionEmbedding ?? [0]);
  const q2 = JSON.stringify(hydeEmbedding ?? questionEmbedding ?? [0]);
  const where = filterSql(userId, filters);
  const vectorEnabled = questionEmbedding ? Prisma.sql`TRUE` : Prisma.sql`FALSE`;
  // OR the question's terms together (plainto/websearch_to_tsquery AND them, so one extra word
  // kills the match); ts_rank still favours chunks that match more of the terms.
  const tsq = Prisma.sql`to_tsquery('english', replace(plainto_tsquery('english', ${question})::text, ' & ', ' | '))`;

  const retrievalStart = performance.now();
  // reciprocal rank fusion (RRF) — combines two ranked lists without needing
  // to normalize/compare raw scores directly, which is the standard approach
  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    WITH vector_search AS (
      SELECT c.id,
             CASE WHEN ${vectorEnabled} THEN LEAST(c.embedding <=> ${q1}::vector, c.embedding <=> ${q2}::vector) END AS distance
      FROM "Chunks" c
      JOIN "Memories" m ON m.id = c."MemoryId"
      WHERE ${vectorEnabled} AND ${where} AND c.embedding IS NOT NULL
      ORDER BY distance
      LIMIT 30
    ),
    vector_ranked AS (
      SELECT id, distance, ROW_NUMBER() OVER (ORDER BY distance) AS rank FROM vector_search
    ),
    keyword_search AS (
      SELECT c.id,
             ROW_NUMBER() OVER (ORDER BY ts_rank(c.content_tsv, ${tsq}) DESC) AS rank
      FROM "Chunks" c
      JOIN "Memories" m ON m.id = c."MemoryId"
      WHERE ${where}
        AND c.content_tsv @@ ${tsq}
      ORDER BY ts_rank(c.content_tsv, ${tsq}) DESC
      LIMIT 30
    ),
    fused AS (
      SELECT COALESCE(v.id, k.id) AS id,
             v.distance AS vector_distance,
             k.rank AS keyword_rank,
             (1.0 / (60 + COALESCE(v.rank, 1000))) + (1.0 / (60 + COALESCE(k.rank, 1000))) AS combined_score
      FROM vector_ranked v
      FULL OUTER JOIN keyword_search k ON v.id = k.id
    )
    SELECT c.id, c.content, c."MemoryId" AS "memoryId", c.chunk_index, c.metadata,
           m.title, m.type::text AS type, m.source_url, m.file_path, m.metadata AS memory_metadata,
           m.summary, m."createdAt",
           f.vector_distance, f.keyword_rank, f.combined_score
    FROM fused f
    JOIN "Chunks" c ON c.id = f.id
    JOIN "Memories" m ON m.id = c."MemoryId"
    ORDER BY f.combined_score DESC
    LIMIT ${topK}
  `;
  console.log("Retrieval:", performance.now() - retrievalStart);

  return results.map((r) => ({
    ...r,
    vector_distance: r.vector_distance === null ? null : Number(r.vector_distance),
    keyword_rank: r.keyword_rank === null ? null : Number(r.keyword_rank),
    combined_score: Number(r.combined_score),
  }));
}

/** Keeps one (best) chunk per memory. */
export function dedupeByMemory(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<number>();
  return chunks.filter((chunk) => {
    if (seen.has(chunk.memoryId)) return false;
    seen.add(chunk.memoryId);
    return true;
  });
}

/** Drops weak vector-only matches; anything that matched the user's words literally is kept. */
export function applyVectorCutoff(chunks: RetrievedChunk[]): RetrievedChunk[] {
  return chunks.filter((c) => c.keyword_rank !== null || (c.vector_distance ?? 1) <= MAX_VECTOR_DISTANCE);
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

/** Reranks with Cohere and drops results below MIN_RERANK_SCORE; falls back to the vector cutoff. */
export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  topN: number = 5
): Promise<RetrievedChunk[]> {
  if (chunks.length === 0) return [];

  const hasQuota = process.env.COHERE_API_KEY ? await canUseCohere() : false;
  if (!hasQuota) {
    console.log("Cohere rerank unavailable — skipping reranking");
    return applyVectorCutoff(chunks).slice(0, topN);
  }

  try {
    const rerankResponse = await cohere.rerank({
      model: "rerank-v3.5",
      query,
      documents: chunks.map((c) => `${c.title}\n${c.content}`.slice(0, 800)), // cap ~150-200 words per doc for scoring
      topN,
    });

    await incrementCohereUsage();

    return rerankResponse.results
      .filter((result) => result.relevanceScore >= MIN_RERANK_SCORE)
      .map((result) => ({
        ...chunks[result.index], // full original content preserved for the actual LLM context
        rerank_score: result.relevanceScore,
      }));
  } catch (error) {
    console.error("Cohere rerank error, falling back:", error);
    return applyVectorCutoff(chunks).slice(0, topN);
  }
}
