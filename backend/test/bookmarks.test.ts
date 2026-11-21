import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { isBookmarksHtml, parseBookmarksCsv, parseBookmarksHtml, parseCsv, parseDate } from "../src/ingest/bookmarks";
import { parseImport } from "../src/ingest/imports";

// What Chrome, Edge, Brave and Firefox write from "Export bookmarks"
const CHROME = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>
    <DL><p>
        <DT><A HREF="https://news.ycombinator.com/" ADD_DATE="1700000001">Hacker News</A>
        <DT><H3>Machine Learning</H3>
        <DL><p>
            <DT><A HREF="https://www.youtube.com/watch?v=abc123XYZ&utm_source=x" ADD_DATE="1600000000">Attention explained</A>
            <DT><A HREF="https://arxiv.org/abs/1706.03762" ADD_DATE="1600000001" TAGS="papers,transformers">Attention Is All You Need</A>
        </DL><p>
        <DT><A HREF="javascript:alert(1)">Bookmarklet</A>
        <DT><A HREF="https://youtube.com/watch?v=abc123XYZ">Same video again</A>
    </DL><p>
    <DT><A HREF="place:sort=8&maxResults=10">Recently visited</A>
</DL><p>`;

describe("bookmarks HTML (browsers)", () => {
    it("is told apart from an ordinary HTML document", () => {
        expect(isBookmarksHtml(CHROME)).toBe(true);
        expect(isBookmarksHtml("<html><head><title>My doc</title></head><body><a href='https://x.com'>x</a></body></html>")).toBe(false);
    });

    it("reads links with their folders as tags, skipping non-web links and repeats", () => {
        const links = parseBookmarksHtml(CHROME);
        expect(links.map((l) => l.title)).toEqual(["Hacker News", "Attention explained", "Attention Is All You Need"]);
        // "Bookmarks bar" is a root folder every browser has, so it isn't a tag
        expect(links[0].tags).toEqual([]);
        expect(links[1].tags).toEqual(["Machine Learning"]);
        expect(links[2].tags).toEqual(["Machine Learning", "papers", "transformers"]);
        expect(links[1].addedAt?.toISOString()).toBe(new Date(1600000000 * 1000).toISOString());
    });
});

describe("Pocket and Raindrop HTML", () => {
    it("reads Pocket's export with its tags and list names", () => {
        const html = `<!DOCTYPE html><html><head><title>Pocket Export</title></head><body>
            <h1>Unread</h1><ul><li><a href="https://example.com/a" time_added="1650000000" tags="rag,ai">Article A</a></li></ul>
            <h1>Read Archive</h1><ul><li><a href="https://example.com/b" time_added="1650000001" tags="">Article B</a></li></ul>
        </body></html>`;
        expect(isBookmarksHtml(html)).toBe(true);
        const links = parseBookmarksHtml(html);
        expect(links.map((l) => [l.url, l.tags])).toEqual([
            ["https://example.com/a", ["rag", "ai"]],
            ["https://example.com/b", []],
        ]);
    });

    it("keeps a Raindrop note written under the bookmark", () => {
        const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1><DL><p>
            <DT><H3>Design</H3><DL><p>
                <DT><A HREF="https://example.com/c">Color tools</A>
                <DD>Good palettes for charts
            </DL><p></DL>`;
        const [link] = parseBookmarksHtml(html);
        expect(link.note).toBe("Good palettes for charts");
        expect(link.tags).toEqual(["Design"]);
    });
});

describe("bookmarks CSV", () => {
    it("parses quoted fields with commas, quotes and newlines", () => {
        expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\r\n')).toEqual([["a", "b"], ["x, y", 'say "hi"\nthere']]);
    });

    it("reads Pocket's CSV export (tags split by |)", () => {
        const csv = "title,url,time_added,tags,status\nGood read,https://example.com/a,1650000000,ai|rag,unread\n";
        const [link] = parseBookmarksCsv(csv)!;
        expect(link).toMatchObject({ url: "https://example.com/a", title: "Good read", tags: ["ai", "rag"] });
        expect(link.addedAt?.getTime()).toBe(1650000000 * 1000);
    });

    it("reads Raindrop's CSV export with folder, tags and note", () => {
        const csv = 'id,title,note,excerpt,url,folder,tags,created\n1,Tool,"Use for, charts",,https://example.com/t,Design,"color, charts",2023-05-01T10:00:00.000Z\n';
        const [link] = parseBookmarksCsv(csv)!;
        expect(link).toMatchObject({ title: "Tool", note: "Use for, charts", tags: ["Design", "color", "charts"] });
        expect(link.addedAt?.toISOString()).toBe("2023-05-01T10:00:00.000Z");
    });

    it("reads Instapaper's CSV export (JSON tags)", () => {
        const csv = 'URL,Title,Selection,Folder,Timestamp,Tags\nhttps://example.com/i,Essay,,Unread,1650000000,"[""essays""]"\n';
        const [link] = parseBookmarksCsv(csv)!;
        expect(link).toMatchObject({ url: "https://example.com/i", tags: ["essays"] });
    });

    it("returns null for a CSV without a URL column", () => {
        expect(parseBookmarksCsv("name,score\nA,1")).toBeNull();
    });
});

describe("parseDate", () => {
    it("accepts seconds, milliseconds and ISO dates, and rejects nonsense and the future", () => {
        expect(parseDate("1650000000")?.getTime()).toBe(1650000000000);
        expect(parseDate("1650000000000")?.getTime()).toBe(1650000000000);
        expect(parseDate("2023-05-01")?.toISOString()).toBe("2023-05-01T00:00:00.000Z");
        expect(parseDate("0")).toBeNull();
        expect(parseDate("not a date")).toBeNull();
        expect(parseDate(String(Math.floor(Date.now() / 1000) + 86400))).toBeNull();
    });
});

describe("parseImport with bookmarks", () => {
    it("saves a bookmarks .html as links, not as a note", async () => {
        const { notes, links } = await parseImport("bookmarks_11_21_26.html", Buffer.from(CHROME));
        expect(notes).toEqual([]);
        expect(links).toHaveLength(3);
    });

    it("reads Pocket's zip export (part_000000.csv)", async () => {
        const zip = new JSZip();
        zip.file("part_000000.csv", "title,url,time_added,tags,status\nA,https://example.com/a,1650000000,,unread\n");
        const { links } = await parseImport("pocket.zip", await zip.generateAsync({ type: "nodebuffer" }));
        expect(links.map((l) => l.url)).toEqual(["https://example.com/a"]);
    });
});
