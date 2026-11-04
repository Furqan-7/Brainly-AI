import path from "node:path";
import JSZip from "jszip";
import mammoth from "mammoth";
import { JSDOM, VirtualConsole } from "jsdom";

export interface ImportedDoc {
    title: string;
    text: string;
}

export const IMPORT_EXTENSIONS = [".md", ".markdown", ".txt", ".html", ".htm", ".docx", ".zip"];
const MAX_DOCS_PER_IMPORT = 100;

function titleFrom(fileName: string, text: string): string {
    const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
    // Notion appends a 32-char id to exported file names: "Project ideas 1a2b...".md
    const base = path.basename(fileName, path.extname(fileName)).replace(/\s+[0-9a-f]{32}$/i, "");
    return (heading || base || "Imported note").slice(0, 200);
}

function htmlToText(html: string): string {
    const doc = new JSDOM(html, { virtualConsole: new VirtualConsole() }).window.document;
    doc.querySelectorAll("script, style").forEach((n) => n.remove());
    doc.querySelectorAll("p, div, li, h1, h2, h3, h4, br, tr").forEach((n) => n.append("\n"));
    return (doc.body?.textContent ?? "").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

async function parseOne(fileName: string, data: Buffer): Promise<ImportedDoc | null> {
    const ext = path.extname(fileName).toLowerCase();
    let text = "";
    if (ext === ".md" || ext === ".markdown" || ext === ".txt") text = data.toString("utf8");
    else if (ext === ".html" || ext === ".htm") text = htmlToText(data.toString("utf8"));
    else if (ext === ".docx") text = (await mammoth.extractRawText({ buffer: data })).value;
    else return null;

    text = text.trim();
    return text ? { title: titleFrom(fileName, text), text } : null;
}

/**
 * Turns an uploaded export into notes. Supports Notion exports (Markdown/HTML, or the .zip
 * Notion produces), Google Docs downloads (.docx/.html/.txt) and plain Markdown/text files.
 */
export async function parseImport(fileName: string, data: Buffer): Promise<ImportedDoc[]> {
    if (path.extname(fileName).toLowerCase() !== ".zip") {
        const doc = await parseOne(fileName, data);
        return doc ? [doc] : [];
    }

    const zip = await JSZip.loadAsync(data);
    const docs: ImportedDoc[] = [];
    for (const entry of Object.values(zip.files)) {
        if (entry.dir || entry.name.startsWith("__MACOSX/")) continue;
        if (docs.length >= MAX_DOCS_PER_IMPORT) break;
        const doc = await parseOne(entry.name, await entry.async("nodebuffer"));
        if (doc) docs.push(doc);
    }
    return docs;
}
