import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { chunkMemory } from "../src/chunking";
import { cleanTags } from "../src/ingest/enrich";
import { parseImport } from "../src/ingest/imports";
import { backoffMs } from "../src/worker";
import { planFor } from "../src/lib/plans";

describe("chunkMemory", () => {
    it("keeps short content as one atomic chunk", () => {
        expect(chunkMemory("Project ideas reel", "atomic")).toEqual([{ text: "Project ideas reel", metadata: undefined }]);
    });

    it("splits long content into overlapping chunks under the size limit", () => {
        const text = Array.from({ length: 300 }, (_, i) => `Sentence number ${i} talks about things.`).join(" ");
        const chunks = chunkMemory(text, "long_form");
        expect(chunks.length).toBeGreaterThan(1);
        for (const c of chunks) expect(c.text.split(/\s+/).length).toBeLessThanOrEqual(560);
    });

    it("returns nothing for empty text", () => {
        expect(chunkMemory("   ", "long_form")).toEqual([]);
    });
});

describe("cleanTags", () => {
    it("normalises, dedupes and caps tags", () => {
        expect(cleanTags(["#Machine Learning", "machine-learning", "RAG!", "", 42], 5)).toEqual(["machine-learning", "rag"]);
        expect(cleanTags("not an array")).toEqual([]);
    });
});

describe("parseImport", () => {
    it("uses the first markdown heading as the title", async () => {
        const [doc] = await parseImport("notes.md", Buffer.from("# Project ideas\n\nBuild a RAG app"));
        expect(doc.title).toBe("Project ideas");
        expect(doc.text).toContain("Build a RAG app");
    });

    it("strips Notion's id suffix from file names", async () => {
        const [doc] = await parseImport("Reading list 0123456789abcdef0123456789abcdef.txt", Buffer.from("Some books"));
        expect(doc.title).toBe("Reading list");
    });

    it("extracts text from HTML", async () => {
        const [doc] = await parseImport("page.html", Buffer.from("<html><body><h1>Hi</h1><script>x()</script><p>Body text</p></body></html>"));
        expect(doc.text).toContain("Body text");
        expect(doc.text).not.toContain("x()");
    });

    it("reads every supported file in a Notion export zip", async () => {
        const zip = new JSZip();
        zip.file("Workspace/One.md", "# One\ntext");
        zip.file("Workspace/Two.txt", "two");
        zip.file("Workspace/image.png", "binary");
        const docs = await parseImport("export.zip", await zip.generateAsync({ type: "nodebuffer" }));
        expect(docs.map((d) => d.title).sort()).toEqual(["One", "Two"]);
    });
});

describe("worker backoff", () => {
    it("doubles the delay after each failed attempt", () => {
        expect([1, 2, 3].map(backoffMs)).toEqual([30_000, 60_000, 120_000]);
    });
});

describe("plans", () => {
    it("gives premium users higher limits", () => {
        expect(planFor(true).maxMemories).toBeGreaterThan(planFor(false).maxMemories);
        expect(planFor(true).chatsPerDay).toBeGreaterThan(planFor(false).chatsPerDay);
    });
});
