/** Link target that marks a citation, e.g. "#cite-2" */
export const CITE = "#cite-";

/**
 * "[1]" and "[2][3]" become links to "#cite-n", which the renderer swaps for citation chips.
 * Code is left alone, and so are real Markdown links like "[1](https://…)".
 */
export function linkCitations(text: string): string {
    return text
        .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/g)
        .map((part, i) => (i % 2 ? part : part.replace(/\[(\d{1,2})\](?!\(|:)/g, `[$1](${CITE}$1)`)))
        .join("");
}

/** Plain text for card previews: Markdown symbols removed, links reduced to their text. */
export function plainText(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]\s+\[[ xX]\]|[-*+]|\d+[.)])\s+/gm, "")
        .replace(/(\*\*|__|\*|_|~~|`)(?=\S)([\s\S]*?\S)\1/g, "$2")
        .replace(/\s+/g, " ")
        .trim();
}
