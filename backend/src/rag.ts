import { GetHypotheticalAnswer } from "./GetHypotheticalAnswer";
import { dedupeByMemory, expandWithNeighbors, hybridSearch, rerankChunks, RetrievedChunk } from "./Retrieval";
import { completeJson, ChatMessage } from "./lib/llm";
import { hasFilters, mergeFilters, parseSearchFilters, SearchFilters } from "./lib/searchFilters";

export interface ChatTurn {
    role: "user" | "assistant";
    content: string;
}

export interface Source {
    n: number;
    memoryId: number;
    title: string;
    type: string;
    source_url: string | null;
    has_file: boolean;
    thumbnail: string | null;
    snippet: string;
    score: number;
    /** Website name for links (from the page's metadata) */
    site_name: string | null;
    /** Channel or account for videos and reels */
    author: string | null;
    /** Video length, e.g. "12:04" */
    duration: string | null;
    /** When the memory was saved (ISO date) */
    savedAt: string | null;
}

/**
 * Turns a follow-up like "show me more like that" into a standalone search query using the
 * conversation so far. Returns the question unchanged when there's no history.
 */
export async function standaloneQuestion(question: string, history: ChatTurn[]): Promise<string> {
    if (history.length === 0) return question;
    const transcript = history.slice(-6).map((t) => `${t.role}: ${t.content.slice(0, 600)}`).join("\n");
    const { query } = await completeJson(
        `Rewrite the user's latest message as a standalone search query for their personal knowledge base,
resolving references like "that", "it" or "more like this" from the conversation. Keep it short.
Reply as JSON: {"query": "..."}

Conversation:
${transcript}

Latest message: ${question}`,
        { query: question }
    );
    return typeof query === "string" && query.trim() ? query.trim() : question;
}

export function toSources(chunks: RetrievedChunk[]): Source[] {
    return chunks.map((chunk, i) => {
        const meta = chunk.memory_metadata ?? {};
        const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
        return {
            n: i + 1,
            memoryId: chunk.memoryId,
            title: chunk.title,
            type: chunk.type,
            source_url: chunk.source_url,
            has_file: Boolean(chunk.file_path),
            thumbnail: text(meta.thumbnail_url),
            snippet: (chunk.summary || chunk.content).slice(0, 220),
            score: Number((chunk.rerank_score ?? chunk.combined_score).toFixed(4)),
            site_name: text(meta.site_name),
            author: text(meta.author),
            duration: text(meta.duration),
            savedAt: chunk.createdAt ? new Date(chunk.createdAt).toISOString() : null,
        };
    });
}

/**
 * Hybrid search with filters. Filters guessed from the question are dropped if they match
 * nothing, since "how do I edit reels?" mentions reels without meaning "only my reels".
 */
export async function searchWithFallback(
    userId: number,
    question: string,
    explicit: SearchFilters,
    hypotheticalAnswer?: string,
    topK = 10
): Promise<{ results: RetrievedChunk[]; filters: SearchFilters }> {
    const filters = mergeFilters(explicit, parseSearchFilters(question));
    let results = await hybridSearch({ userId, question, hypotheticalAnswer, topK, filters });
    if (results.length === 0 && hasFilters(filters) && !hasFilters(explicit)) {
        results = await hybridSearch({ userId, question, hypotheticalAnswer, topK, filters: explicit });
        return { results, filters: explicit };
    }
    return { results, filters };
}

/** Full retrieval for an AI answer: HyDE → hybrid search → dedupe → rerank (with cutoff) → expand. */
export async function retrieveContext(userId: number, question: string, explicit: SearchFilters) {
    const hyde = await GetHypotheticalAnswer(question);
    const { results, filters } = await searchWithFallback(userId, question, explicit, hyde);
    const reranked = await rerankChunks(question, dedupeByMemory(results), 5);
    const chunks = await expandWithNeighbors(reranked);
    return { chunks, sources: toSources(chunks), filters };
}

export function buildAnswerMessages(question: string, chunks: RetrievedChunk[], history: ChatTurn[]): ChatMessage[] {
    const context = chunks
        .map((chunk, i) => `[${i + 1}] ${chunk.type.toUpperCase()}: "${chunk.title}"\n${chunk.content}`)
        .join("\n\n---\n\n");

    const system = `You are Brainly AI, a personal knowledge assistant.
Answer using ONLY the user's saved content in the numbered sources below.
Cite the sources you use inline with their number in square brackets, like [1] or [2][3].
When a source is a video, reel or TikTok, point the user to it (e.g. "your saved reel [2] covers this") so they can watch it.
If the answer is not in the sources, say: "I couldn't find that in your saved content."
Never make up information. Be concise and accurate.

SOURCES FROM THE USER'S KNOWLEDGE BASE:
${context || "(no matching sources)"}`;

    return [
        { role: "system", content: system },
        ...history.slice(-6).map((t) => ({ role: t.role, content: t.content.slice(0, 1500) })),
        { role: "user", content: question },
    ];
}
