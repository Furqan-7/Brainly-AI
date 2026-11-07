import { completeJson } from "../lib/llm";

export interface Enrichment {
    summary: string;
    tags: string[];
    /** Only when asked for (`wantTitle`): a short descriptive title */
    title?: string;
}

export function cleanTags(tags: unknown, max = 8): string[] {
    if (!Array.isArray(tags)) return [];
    const seen = new Set<string>();
    for (const tag of tags) {
        if (typeof tag !== "string") continue;
        const clean = tag.toLowerCase().trim().replace(/^#/, "").replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").slice(0, 30);
        if (clean) seen.add(clean);
        if (seen.size >= max) break;
    }
    return [...seen];
}

/**
 * One cheap LLM call per memory: a 1–2 sentence summary and a few topic tags, plus a title
 * when the item was saved without one.
 */
export async function enrichMemory(title: string, text: string, { wantTitle = false } = {}): Promise<Enrichment> {
    const titleField = wantTitle ? `"title": "<short descriptive title, 3-8 words, no quotes>", ` : "";
    const result = await completeJson<{ summary: string; tags: unknown; title?: unknown }>(
        `You organise a personal knowledge base. Given a saved item, reply with JSON:
{${titleField}"summary": "<1-2 sentence summary of what this is and why it is useful>", "tags": ["<3-5 short lowercase topic tags>"]}

Title: ${wantTitle ? "(none yet, write one)" : title}
Content (truncated):
${text.slice(0, 6000)}`,
        { summary: "", tags: [] }
    );
    return {
        summary: String(result.summary ?? "").trim().slice(0, 500),
        tags: cleanTags(result.tags, 5),
        ...(wantTitle && typeof result.title === "string" ? { title: result.title.trim().slice(0, 200) } : {}),
    };
}
