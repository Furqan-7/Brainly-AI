import path from "node:path";
import JSZip from "jszip";
import mammoth from "mammoth";
import { JSDOM, VirtualConsole } from "jsdom";
import { ImportedLink, isBookmarksHtml, MAX_LINKS_PER_IMPORT, parseBookmarksCsv, parseBookmarksHtml } from "./bookmarks";

export interface ImportedDoc {
    title: string;
    text: string;
}

export const IMPORT_EXTENSIONS = [".md", ".markdown", ".txt", ".html", ".htm", ".docx", ".csv", ".zip"];
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

export interface ImportResult {
    /** Documents, saved as notes */
    notes: ImportedDoc[];
    /** Bookmarks and read-later lists, saved as links */
    links: ImportedLink[];
}

// CSVs inside a .zip are only read as bookmarks when the file looks like a bookmarks export
// (Pocket's zip holds part_000000.csv); a Notion export's database tables are not bookmarks.
const BOOKMARK_CSV_IN_ZIP = /(^|\/)(part_\d+|pocket[^/]*|raindrop[^/]*|instapaper[^/]*|bookmarks?[^/]*)\.csv$/i;

async function parseOne(fileName: string, data: Buffer, result: ImportResult, inZip = false): Promise<void> {
    const ext = path.extname(fileName).toLowerCase();
    let text = "";
    if (ext === ".md" || ext === ".markdown" || ext === ".txt") text = data.toString("utf8");
    else if (ext === ".html" || ext === ".htm") {
        const html = data.toString("utf8");
        if (isBookmarksHtml(html)) {
            result.links.push(...parseBookmarksHtml(html));
            return;
        }
        text = htmlToText(html);
    } else if (ext === ".docx") text = (await mammoth.extractRawText({ buffer: data })).value;
    else if (ext === ".csv") {
        if (inZip && !BOOKMARK_CSV_IN_ZIP.test(fileName)) return;
        result.links.push(...(parseBookmarksCsv(data.toString("utf8")) ?? []));
        return;
    } else return;

    text = text.trim();
    if (text && result.notes.length < MAX_DOCS_PER_IMPORT) result.notes.push({ title: titleFrom(fileName, text), text });
}

/**
 * Turns an uploaded export into notes and links. Supports Notion exports (Markdown/HTML, or the
 * .zip Notion produces), Google Docs downloads (.docx/.html/.txt), plain Markdown/text files, and
 * bookmarks: any browser's bookmarks .html, and Pocket, Raindrop or Instapaper exports (.html/.csv/.zip).
 */
export async function parseImport(fileName: string, data: Buffer): Promise<ImportResult> {
    const result: ImportResult = { notes: [], links: [] };
    if (path.extname(fileName).toLowerCase() !== ".zip") {
        await parseOne(fileName, data, result);
    } else {
        const zip = await JSZip.loadAsync(data);
        for (const entry of Object.values(zip.files)) {
            if (entry.dir || entry.name.startsWith("__MACOSX/")) continue;
            if (result.notes.length >= MAX_DOCS_PER_IMPORT && result.links.length >= MAX_LINKS_PER_IMPORT) break;
            await parseOne(entry.name, await entry.async("nodebuffer"), result, true);
        }
    }
    result.links = result.links.slice(0, MAX_LINKS_PER_IMPORT);
    return result;
}
