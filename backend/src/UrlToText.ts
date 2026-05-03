import axios from "axios";
import * as cheerio from "cheerio";

export async function UrlToText(url: string): Promise<string> {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // remove script, style, nav, footer tags
    $("script, style, nav, footer, header, noscript, iframe").remove();

    // get only the meaningful text
    const text = $("body").text()
        .replace(/\s+/g, " ")  // collapse whitespace
        .trim();

    return text;
}