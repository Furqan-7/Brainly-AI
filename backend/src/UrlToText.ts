import * as cheerio from "cheerio";
import axios from "axios";


export async function UrlToText(url: string) {

    try {
        const response = await axios.get(url);

        const html = response.data;
        const $ = cheerio.load(html);

        const title = $('title').text();
        const description = $('meta[name="description"]').attr('content');
        const keywords = $('meta[name="keywords"]').attr('content');
        const canonical = $('link[rel="canonical"]').attr('href');
        const text = $('body').text();

        const metadata = title + description + keywords + canonical + text;

        return metadata.toString();
    } catch (error) {
        console.log(error);
        return null;
    }

}