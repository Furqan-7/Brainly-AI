import axios from "axios";

type TaskType = "search_document" | "search_query";

async function embed(texts: string[], taskType: TaskType, timeout = 30000): Promise<number[][]> {
    const response = await axios.post(
        "https://api-atlas.nomic.ai/v1/embedding/text",
        {
            model: "nomic-embed-text-v1.5",
            texts,
            task_type: taskType,
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout,
        }
    );
    return response.data.embeddings;
}

// Searches repeat a lot (typing, retries with fewer filters, the same question asked again),
// so query embeddings are kept for a while instead of calling the API every time.
const CACHE_MAX = 500;
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { vector: number[]; at: number }>();

function cached(key: string): number[] | null {
    const hit = cache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.at > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    // Map keeps insertion order: re-inserting marks it as recently used
    cache.delete(key);
    cache.set(key, hit);
    return hit.vector;
}

function remember(key: string, vector: number[]) {
    cache.set(key, { vector, at: Date.now() });
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
}

/** Clears the query cache (tests). */
export function clearEmbeddingCache() {
    cache.clear();
}

/**
 * Embeds a search query (or a HyDE answer) with a short timeout, so a slow embedding API
 * never holds a search up: callers fall back to keyword search when this throws.
 */
export async function GetQueryEmbedding(text: string, taskType: TaskType = "search_query", timeoutMs = 4000): Promise<number[]> {
    const key = `${taskType}:${text.trim().toLowerCase()}`;
    const hit = cached(key);
    if (hit) return hit;
    const [vector] = await embed([text], taskType, timeoutMs);
    remember(key, vector);
    return vector;
}

export async function GetEmbeddings(content: string, taskType: TaskType = "search_document"): Promise<number[]> {
    return (await embed([content], taskType))[0];
}

/** Embeds many texts with as few API calls as possible. */
export async function GetEmbeddingsBatch(texts: string[], taskType: TaskType = "search_document"): Promise<number[][]> {
    const BATCH = 32;
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH) {
        out.push(...(await embed(texts.slice(i, i + BATCH), taskType)));
    }
    return out;
}
