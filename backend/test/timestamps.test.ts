import { describe, expect, it } from "vitest";
import { chunkStartTimes, formatTimestamp, stripTimestamps, transcriptWithTimestamps } from "../src/ingest/timestamps";
import { splitIntoChunks } from "../src/chunking";
import { toSources } from "../src/rag";

describe("formatTimestamp", () => {
    it("formats minutes and hours", () => {
        expect(formatTimestamp(0)).toBe("0:00");
        expect(formatTimestamp(75.9)).toBe("1:15");
        expect(formatTimestamp(3723)).toBe("1:02:03");
    });
});

describe("transcriptWithTimestamps", () => {
    it("adds a marker at most every 30 seconds (classic captions, offsets in seconds)", () => {
        const lines = [0, 4.2, 12.5, 31.1, 40, 61.8].map((offset, i) => ({ text: `line${i}`, offset }));
        expect(transcriptWithTimestamps(lines)).toBe("(0:00) line0 line1 line2 (0:31) line3 line4 (1:01) line5");
    });

    it("understands offsets in milliseconds (newer caption format)", () => {
        const lines = [0, 3000, 6500, 30500, 95000].map((offset, i) => ({ text: `w${i}`, offset }));
        expect(transcriptWithTimestamps(lines)).toBe("(0:00) w0 w1 w2 (0:30) w3 (1:35) w4");
    });

    it("decodes nothing it shouldn't and skips empty lines", () => {
        expect(transcriptWithTimestamps([{ text: "  ", offset: 0 }, { text: "hello\nworld", offset: 1.5 }])).toBe("(0:01) hello world");
    });
});

describe("chunkStartTimes", () => {
    it("gives each chunk the last marker before its own first one", () => {
        expect(chunkStartTimes(["(0:00) a b (0:30) c", "c d (1:00) e", "f g h", "(1:30) i"])).toEqual([0, 30, 60, 60]);
    });

    it("works across the overlap real chunking produces", () => {
        const words = Array.from({ length: 1200 }, (_, i) => (i % 60 === 0 ? `(${formatTimestamp(i / 2)})` : `w${i}`));
        const chunks = splitIntoChunks(words.join(" "), 500, 50).map((c) => c.text);
        const starts = chunkStartTimes(chunks)!;
        expect(starts[0]).toBe(0);
        // Each later chunk starts within 30s before its text does (2 words per second here)
        chunks.slice(1).forEach((chunk, i) => {
            const firstWord = Number(chunk.match(/w(\d+)/)![1]) / 2;
            expect(starts[i + 1]!).toBeLessThanOrEqual(firstWord);
            expect(firstWord - starts[i + 1]!).toBeLessThanOrEqual(31); // +1: a chunk may begin on the marker itself
        });
    });

    it("is null for text without markers", () => {
        expect(chunkStartTimes(["no markers", "here"])).toBeNull();
    });
});

describe("sources for YouTube", () => {
    const chunk = (type: string, content: string, metadata: Record<string, unknown> = {}) => ({
        id: 1, memoryId: 1, chunk_index: 0, metadata, content, title: "T", type, source_url: "https://youtube.com/watch?v=abc123",
        file_path: null, memory_metadata: {}, summary: null, createdAt: new Date(), vector_distance: 0.1, keyword_rank: 1, combined_score: 0.5,
    });

    it("carries the start time and hides the markers from people", () => {
        const [source] = toSources([chunk("youtube", "(2:00) attention is all you need (2:30) heads", { start_s: 120 })]);
        expect(source.timestamp).toBe(120);
        expect(source.passage).toBe("attention is all you need heads");
        expect(stripTimestamps("a (1:02:03) b")).toBe("a b");
    });

    it("leaves other types alone", () => {
        const [source] = toSources([chunk("note", "Meeting moved to (10:30) tomorrow", { start_s: 5 })]);
        expect(source.timestamp).toBeNull();
        expect(source.passage).toBe("Meeting moved to (10:30) tomorrow");
    });
});
