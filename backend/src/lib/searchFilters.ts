export type MemoryType = "pdf" | "url" | "youtube" | "tweet" | "note" | "image" | "reel" | "tiktok" | "audio";

export const MEMORY_TYPES: MemoryType[] = ["pdf", "url", "youtube", "tweet", "note", "image", "reel", "tiktok", "audio"];

export interface SearchFilters {
    types?: MemoryType[];
    from?: Date;
    to?: Date;
    collectionId?: number;
}

// Phrases that clearly refer to a kind of saved item, e.g. "my reels about projects"
const TYPE_PATTERNS: [RegExp, MemoryType[]][] = [
    [/\b(insta(gram)?\s+)?reels?\b|\binstagram\b/i, ["reel"]],
    [/\btik\s?toks?\b/i, ["tiktok"]],
    [/\byoutube\b|\bshorts\b/i, ["youtube"]],
    [/\bvideos?\b/i, ["youtube", "reel", "tiktok"]],
    [/\btweets?\b|\bx\s+posts?\b|\bthreads?\b/i, ["tweet"]],
    [/\bpdfs?\b|\bdocuments?\b|\bpapers?\b/i, ["pdf"]],
    [/\brecordings?\b|\baudio\b/i, ["audio"]],
    [/\bnotes?\b/i, ["note"]],
    [/\bimages?\b|\bscreenshots?\b|\bphotos?\b|\bpictures?\b/i, ["image"]],
    [/\barticles?\b|\bwebsites?\b|\bweb\s?pages?\b|\blinks?\b|\bblogs?\b/i, ["url"]],
];

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function parseDates(q: string, now: Date): { from?: Date; to?: Date } {
    const today = startOfDay(now);
    const lower = q.toLowerCase();

    const relative = lower.match(/\b(?:last|past)\s+(\d{1,3})\s+(day|week|month|year)s?\b/);
    if (relative) {
        const n = Number(relative[1]);
        const unitDays = { day: 1, week: 7, month: 30, year: 365 }[relative[2] as "day" | "week" | "month" | "year"];
        return { from: new Date(now.getTime() - n * unitDays * DAY) };
    }
    if (/\btoday\b/.test(lower)) return { from: today };
    if (/\byesterday\b/.test(lower)) return { from: new Date(today.getTime() - DAY), to: today };
    if (/\bthis week\b/.test(lower)) return { from: new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY) };
    if (/\blast week\b/.test(lower)) return { from: new Date(today.getTime() - 7 * DAY) };
    if (/\bthis month\b/.test(lower)) return { from: new Date(today.getFullYear(), today.getMonth(), 1) };
    if (/\blast month\b/.test(lower)) {
        return { from: new Date(today.getFullYear(), today.getMonth() - 1, 1), to: new Date(today.getFullYear(), today.getMonth(), 1) };
    }
    if (/\bthis year\b/.test(lower)) return { from: new Date(today.getFullYear(), 0, 1) };
    if (/\blast year\b/.test(lower)) return { from: new Date(today.getFullYear() - 1, 0, 1), to: new Date(today.getFullYear(), 0, 1) };
    return {};
}

/**
 * Pulls type and date filters out of a natural-language question,
 * e.g. "reels about projects from last month" -> { types: ["reel"], from: <1st of last month>, to: <1st of this month> }.
 * Callers should fall back to an unfiltered search when the filtered one finds nothing,
 * since "how do I edit reels?" mentions reels without meaning "only my reels".
 */
export function parseSearchFilters(question: string, now = new Date()): SearchFilters {
    const types = new Set<MemoryType>();
    // "voice notes" means audio memories, not text notes
    const q = question.replace(/\bvoice\s+notes?\b/gi, "audio");
    for (const [pattern, mapped] of TYPE_PATTERNS) {
        if (pattern.test(q)) mapped.forEach((t) => types.add(t));
    }
    const filters: SearchFilters = { ...parseDates(question, now) };
    if (types.size) filters.types = [...types];
    return filters;
}

export function hasFilters(f: SearchFilters): boolean {
    return Boolean(f.types?.length || f.from || f.to || f.collectionId);
}

/** Explicit filters from the UI win over ones guessed from the question text. */
export function mergeFilters(explicit: SearchFilters, parsed: SearchFilters): SearchFilters {
    return {
        types: explicit.types?.length ? explicit.types : parsed.types,
        from: explicit.from ?? parsed.from,
        to: explicit.to ?? parsed.to,
        collectionId: explicit.collectionId,
    };
}
