import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "./lib/ogImage";

export const alt = "Brainly AI — Remember everything you save";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
    return renderOgImage({
        title: "Remember everything you save.",
        subtitle: "Save reels, videos, links, PDFs and notes from anywhere. Ask in plain words and get the exact one back.",
    });
}
