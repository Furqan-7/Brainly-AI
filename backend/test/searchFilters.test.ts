import { describe, expect, it } from "vitest";
import { mergeFilters, parseSearchFilters } from "../src/lib/searchFilters";

const NOW = new Date(2026, 9, 30, 15, 0, 0); // 30 Oct 2026, local time

describe("parseSearchFilters", () => {
    it("finds content types", () => {
        expect(parseSearchFilters("my reels about projects").types).toEqual(["reel"]);
        expect(parseSearchFilters("pdfs on transformers").types).toEqual(["pdf"]);
        expect(parseSearchFilters("videos about cooking").types?.sort()).toEqual(["reel", "tiktok", "youtube"]);
    });

    it("maps voice notes to audio, not text notes", () => {
        expect(parseSearchFilters("voice notes from the meeting").types).toEqual(["audio"]);
    });

    it("returns no filters for a plain question", () => {
        expect(parseSearchFilters("what is retrieval augmented generation?")).toEqual({});
    });

    it("parses relative dates", () => {
        const lastMonth = parseSearchFilters("reels from last month", NOW);
        expect(lastMonth.from).toEqual(new Date(2026, 8, 1));
        expect(lastMonth.to).toEqual(new Date(2026, 9, 1));

        const lastDays = parseSearchFilters("notes from the past 3 days", NOW);
        expect(lastDays.from!.getTime()).toBe(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);

        expect(parseSearchFilters("saved today", NOW).from).toEqual(new Date(2026, 9, 30));
    });

    it("lets explicit UI filters win over parsed ones", () => {
        const merged = mergeFilters({ types: ["pdf"] }, { types: ["reel"], from: new Date(0) });
        expect(merged.types).toEqual(["pdf"]);
        expect(merged.from).toEqual(new Date(0));
    });
});
