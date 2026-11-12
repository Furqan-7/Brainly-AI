import { describe, expect, it } from "vitest";
import { passageOf } from "../src/rag";

describe("source passages", () => {
    it("drop the personal note that indexing appends", () => {
        expect(passageOf("Boil pasta for 10 minutes.\n\nPersonal note: dinner idea")).toBe("Boil pasta for 10 minutes.");
    });

    it("keep a chunk that is only the personal note", () => {
        expect(passageOf("Personal note: dinner idea")).toBe("Personal note: dinner idea");
    });

    it("cut long passages at a word, with an ellipsis", () => {
        const passage = passageOf("word ".repeat(400));
        expect(passage.length).toBeLessThanOrEqual(701);
        expect(passage.endsWith("word…")).toBe(true);
    });
});
