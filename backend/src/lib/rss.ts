/** RSS 2.0 for publicly shared collections, so people can follow one in a feed reader. */

export interface FeedItem {
    id: number;
    title: string;
    link: string;
    description: string | null;
    tags: string[];
    date: Date;
}

export interface Feed {
    title: string;
    link: string;
    feedUrl: string;
    description: string;
    items: FeedItem[];
}

export function escapeXml(text: string): string {
    return text
        // Characters XML 1.0 doesn't allow at all
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export function renderRss(feed: Feed): string {
    const items = feed.items.map((item) => [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(item.link)}</link>`,
        `      <guid isPermaLink="false">brainly-memory-${item.id}</guid>`,
        `      <pubDate>${item.date.toUTCString()}</pubDate>`,
        item.description ? `      <description>${escapeXml(item.description)}</description>` : null,
        ...item.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
    ].filter(Boolean).join("\n"));
    const latest = feed.items.reduce<Date | null>((max, i) => (!max || i.date > max ? i.date : max), null);

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        `    <title>${escapeXml(feed.title)}</title>`,
        `    <link>${escapeXml(feed.link)}</link>`,
        `    <atom:link href="${escapeXml(feed.feedUrl)}" rel="self" type="application/rss+xml"/>`,
        `    <description>${escapeXml(feed.description)}</description>`,
        latest ? `    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>` : null,
        "    <generator>Brainly AI</generator>",
        ...items,
        "  </channel>",
        "</rss>",
        "",
    ].filter((line) => line !== null).join("\n");
}
