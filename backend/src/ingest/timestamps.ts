/**
 * Video timestamps in transcripts, so an answer can open a YouTube video at the moment it cites.
 * A marker like "(12:34)" is written into the transcript every ~30 seconds; after chunking, each
 * chunk gets the time it starts at, and the source links to that time.
 */

export interface CaptionLine {
    text: string;
    /** Start of the line, in seconds or milliseconds depending on the caption format */
    offset: number;
}

const MARKER_EVERY_S = 30;

/** "(12:34)" or "(1:02:03)": a marker written into the transcript. */
export const TIMESTAMP_RE = /\((?:(\d{1,2}):)?(\d{1,2}):(\d{2})\)/g;

/** 75 → "1:15", 3723 → "1:02:03" */
export function formatTimestamp(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/**
 * YouTube's newer caption format gives offsets in milliseconds, the classic one in seconds
 * (often with decimals). Lines are a few seconds apart, so a typical gap of more than 50 means ms.
 */
function offsetsAreMs(lines: CaptionLine[]): boolean {
    if (lines.some((l) => !Number.isInteger(l.offset))) return false;
    const gaps = lines.slice(1).map((l, i) => l.offset - lines[i].offset).filter((g) => g > 0).sort((a, b) => a - b);
    if (gaps.length === 0) return (lines[0]?.offset ?? 0) > 50_000;
    return gaps[Math.floor(gaps.length / 2)] > 50;
}

/** Joins caption lines into one transcript with a "(m:ss)" marker at least every 30 seconds. */
export function transcriptWithTimestamps(lines: CaptionLine[]): string {
    const scale = offsetsAreMs(lines) ? 1 / 1000 : 1;
    const parts: string[] = [];
    let nextMarker = 0;
    for (const line of lines) {
        const text = line.text.replace(/\s+/g, " ").trim();
        if (!text) continue;
        const start = line.offset * scale;
        if (start >= nextMarker) {
            parts.push(`(${formatTimestamp(start)})`);
            nextMarker = Math.floor(start / MARKER_EVERY_S) * MARKER_EVERY_S + MARKER_EVERY_S;
        }
        parts.push(text);
    }
    return parts.join(" ");
}

function markerTimes(text: string): number[] {
    return [...text.matchAll(TIMESTAMP_RE)].map((m) => Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]));
}

/**
 * The second each chunk starts at: the last marker before the chunk's own first marker, so a jump
 * lands a little early rather than after the part that matched. Null when the text has no markers.
 */
export function chunkStartTimes(chunks: string[]): (number | null)[] | null {
    const times = chunks.map(markerTimes);
    if (!times.some((t) => t.length)) return null;
    let seen: number[] = [];
    return times.map((own) => {
        const first = own[0];
        const before = seen.filter((t) => first === undefined || t < first);
        seen = [...seen, ...own];
        if (before.length) return Math.max(...before);
        return first !== undefined ? first : null;
    });
}

/** The transcript without its markers, for showing to people. */
export function stripTimestamps(text: string): string {
    return text.replace(TIMESTAMP_RE, " ").replace(/[ \t]{2,}/g, " ").trim();
}
