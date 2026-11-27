import { JSDOM, VirtualConsole } from "jsdom";
import { normalizeUrl } from "../lib/urls";

/** A link found in a bookmarks or read-later export. */
export interface ImportedLink {
    url: string;
    title: string | null;
    /** Folder names and the export's own tags */
    tags: string[];
    /** A note the user wrote on the bookmark (Raindrop) */
    note: string | null;
    /** When it was originally bookmarked, if the export says */
    addedAt: Date | null;
}

export const MAX_LINKS_PER_IMPORT = 1000;

// Root folders every browser has; they say nothing about the link, so they don't become tags
const GENERIC_FOLDERS = /^(bookmarks?( bar| menu| toolbar)?|favou?rites( bar)?|other bookmarks|mobile bookmarks|toolbar|menu|imported|unsorted|unread|read archive|archive|home|my list|untitled folder)$/i;

function folderTag(name: string | null | undefined): string | null {
    const clean = name?.trim();
    return clean && !GENERIC_FOLDERS.test(clean) ? clean : null;
}

function splitTags(raw: string | null | undefined): string[] {
    if (!raw) return [];
    const text = raw.trim();
    // Instapaper writes tags as a JSON array
    if (text.startsWith("[")) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
            /* not JSON, split it instead */
        }
    }
    return text.split(/[|,]/).map((t) => t.trim()).filter(Boolean);
}

/** Unix seconds, milliseconds or an ISO date → Date; null if missing, invalid or in the future. */
export function parseDate(raw: string | null | undefined): Date | null {
    const text = raw?.trim();
    if (!text) return null;
    let date: Date;
    if (/^\d+$/.test(text)) {
        const n = Number(text);
        // Chrome/Firefox/Pocket use seconds; some tools use milliseconds or microseconds
        date = new Date(n > 1e14 ? n / 1000 : n > 1e11 ? n : n * 1000);
    } else {
        date = new Date(text);
    }
    const time = date.getTime();
    if (!Number.isFinite(time) || time <= Date.UTC(1995, 0, 1) || time > Date.now()) return null;
    return date;
}

function isWebLink(url: string): boolean {
    try {
        const u = new URL(url.trim());
        return (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.hostname);
    } catch {
        return false;
    }
}

/** Drops non-web links (javascript:, place:, chrome://…), repeats within the file, and caps the count. */
function finish(links: ImportedLink[]): ImportedLink[] {
    const seen = new Set<string>();
    const out: ImportedLink[] = [];
    for (const link of links) {
        if (!isWebLink(link.url)) continue;
        const key = normalizeUrl(link.url);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...link, url: link.url.trim(), title: link.title?.trim() || null, tags: [...new Set(link.tags)] });
        if (out.length >= MAX_LINKS_PER_IMPORT) break;
    }
    return out;
}

// ─── HTML ────────────────────────────────────────────────────────────────────

/**
 * Whether an .html file is a bookmarks export rather than a document. Chrome, Edge, Firefox,
 * Safari, Brave and Raindrop write the Netscape bookmark format; Pocket and Instapaper write
 * a plain list of links with their own title.
 */
export function isBookmarksHtml(html: string): boolean {
    const head = html.slice(0, 3000);
    return /NETSCAPE-Bookmark-file/i.test(head) || /<title>\s*(Pocket Export|Instapaper: Export|Bookmarks|Raindrop\.io Bookmarks)\s*<\/title>/i.test(head);
}

/** The names of the folders a link sits in: each enclosing <DL>'s heading (<H3>), or Pocket/Instapaper's <h1>. */
function foldersOf(a: Element): string[] {
    const names: string[] = [];
    let node: Element | null = a.parentElement;
    while (node) {
        if (node.tagName === "DL") {
            // <DT><H3>Folder</H3><DL>…links…</DL> — the heading is the DL's previous sibling (or its DT's child)
            let prev = node.previousElementSibling;
            while (prev && prev.tagName === "P") prev = prev.previousElementSibling;
            const heading = prev?.tagName === "H3" ? prev : prev?.querySelector(":scope > h3");
            if (heading?.textContent) names.unshift(heading.textContent);
        }
        if (node.tagName === "UL" || node.tagName === "OL") {
            // Pocket: <h1>Unread</h1><ul>…</ul>; Instapaper: <h1>Folder</h1><ol>…</ol>
            const prev = node.previousElementSibling;
            if (prev?.tagName === "H1" && prev.textContent) names.unshift(prev.textContent);
        }
        node = node.parentElement;
    }
    return names;
}

export function parseBookmarksHtml(html: string): ImportedLink[] {
    const doc = new JSDOM(html, { virtualConsole: new VirtualConsole() }).window.document;
    const links: ImportedLink[] = [];
    for (const a of doc.querySelectorAll("a[href]")) {
        const tags = [
            ...foldersOf(a).map(folderTag).filter((t): t is string => Boolean(t)),
            ...splitTags(a.getAttribute("tags")),
        ];
        // Raindrop puts the bookmark's note in a <DD> right after it
        const dd = a.parentElement?.tagName === "DT" && a.parentElement.nextElementSibling?.tagName === "DD"
            ? a.parentElement.nextElementSibling.textContent?.trim() || null
            : null;
        links.push({
            url: a.getAttribute("href") ?? "",
            title: a.textContent,
            tags,
            note: dd,
            addedAt: parseDate(a.getAttribute("add_date") ?? a.getAttribute("time_added")),
        });
    }
    return finish(links);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

/** RFC 4180 CSV: quoted fields, "" escapes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    const src = text.replace(/^﻿/, "");
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (quoted) {
            if (ch === '"' && src[i + 1] === '"') {
                field += '"';
                i++;
            } else if (ch === '"') {
                quoted = false;
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            quoted = true;
        } else if (ch === ",") {
            row.push(field);
            field = "";
        } else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && src[i + 1] === "\n") i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else {
            field += ch;
        }
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => r.some((cell) => cell.trim()));
}

/**
 * Pocket (title,url,time_added,tags,status), Raindrop (id,title,note,excerpt,url,folder,tags,created…),
 * Instapaper (URL,Title,Selection,Folder,Timestamp,Tags) or any CSV with a "url" column.
 * Returns null when the file has no URL column, so it isn't treated as bookmarks.
 */
export function parseBookmarksCsv(text: string): ImportedLink[] | null {
    const [header, ...rows] = parseCsv(text);
    if (!header) return null;
    const cols = header.map((h) => h.trim().toLowerCase());
    const find = (...names: string[]) => cols.findIndex((c) => names.includes(c));
    const urlCol = find("url", "link", "href", "address");
    if (urlCol < 0) return null;
    const titleCol = find("title", "name");
    const tagsCol = find("tags", "tag", "labels");
    const folderCol = find("folder", "collection", "list");
    const noteCol = find("note", "notes");
    const dateCol = find("time_added", "created", "timestamp", "date_added", "added", "created_at", "date");

    const cell = (row: string[], i: number) => (i >= 0 ? row[i]?.trim() || null : null);
    return finish(rows.map((row) => ({
        url: cell(row, urlCol) ?? "",
        title: cell(row, titleCol),
        tags: [
            ...(folderCol >= 0 ? [folderTag(cell(row, folderCol))].filter((t): t is string => Boolean(t)) : []),
            ...splitTags(cell(row, tagsCol)),
        ],
        note: cell(row, noteCol),
        addedAt: parseDate(cell(row, dateCol)),
    })));
}
