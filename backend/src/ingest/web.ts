import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";
import { safeGet } from "../lib/safeFetch";

export interface WebPage {
    text: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
}

/**
 * Extracts the main article text (Readability, the engine behind Firefox Reader View) plus
 * Open Graph metadata. Social posts like LinkedIn often only expose their text via og:description,
 * so that is kept as part of the indexed text too.
 */
export async function fetchWebPage(url: string): Promise<WebPage> {
    const { data, headers } = await safeGet<string>(url, { responseType: "text" });
    if (!String(headers["content-type"] ?? "").includes("html")) {
        return { text: String(data).slice(0, 200_000), title: null, description: null, image: null, siteName: null };
    }

    const dom = new JSDOM(data, { url, virtualConsole: new VirtualConsole() });
    const doc = dom.window.document;
    const meta = (name: string) =>
        doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute("content")?.trim() || null;

    const title = meta("og:title") ?? (doc.title?.trim() || null);
    const description = meta("og:description") ?? meta("description");
    const image = meta("og:image");
    const siteName = meta("og:site_name");

    const article = new Readability(doc).parse();
    let body = article?.textContent?.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim() ?? "";
    if (!body) {
        // Readability gives up on non-article pages — fall back to all visible text
        const fallback = new JSDOM(data, { virtualConsole: new VirtualConsole() }).window.document;
        fallback.querySelectorAll("script, style, nav, footer, header, noscript, iframe").forEach((n) => n.remove());
        body = fallback.body?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    }
    dom.window.close();

    const text = [title, description && !body.includes(description) ? description : null, body]
        .filter(Boolean)
        .join("\n\n");

    return { text, title, description, image, siteName };
}
