import { completeJson } from "./llm";

/** Longest title shown in the sidebar before it's shortened. */
export const MAX_TITLE_LENGTH = 40;

// Openers that carry no meaning in a title ("can you tell me", "have I", "please"…)
const FILLER = new RegExp(
    [
        "^(?:(?:hey|hi|hello|ok(?:ay)?|so|um+|please|pls)\\b[\\s,!.]*)*", // greetings
        "(?:(?:can|could|would|will) you\\s+(?:please\\s+)?(?:tell me|show me|find(?: me)?|help me(?: find)?|remind me)?\\s*", // can you tell me…
        "|(?:do|did) i (?:have|save|store|keep)(?: anything| something| any)?\\s*", // do I have anything…
        "|(?:do|did|have|has) i\\s+(?:ever\\s+)?", // have I…
        "|i (?:want|need) to (?:know|find)\\s*",
        "|(?:show|tell|find|give) me\\s*)?",
        "(?:(?:on|about|regarding|for)\\s+)*", // …about
        "(?:(?:the|that|this|those|these)\\s+)?", // the / that…
    ].join(""),
    "i"
);

const SMALL_WORDS = new Set(["a", "an", "the", "and", "or", "of", "in", "on", "at", "to", "for", "with", "from", "by", "my", "me", "i"]);

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Cuts text at a word boundary so it fits `max` characters, without an ellipsis. */
function cutAtWord(text: string, max: number): string {
    if (text.length <= max) return text;
    const cut = text.slice(0, max + 1);
    const lastSpace = cut.lastIndexOf(" ");
    const short = (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : text.slice(0, max)).trim();
    // Don't end on "of", "the", "my"… ("Notes from the" → "Notes")
    const words = short.split(" ");
    while (words.length > 1 && SMALL_WORDS.has(words[words.length - 1].toLowerCase())) words.pop();
    return words.join(" ");
}

/**
 * A short, readable title made from the question itself, used instantly and whenever the
 * AI title isn't available: drops filler openers, punctuation and trailing "here", keeps it
 * to a few words. "have i stored my resume? here" → "Stored my resume".
 */
export function fallbackTitle(question: string): string {
    let text = question
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    text = text.replace(FILLER, "");
    text = text
        .replace(/[?!.,;:]+(\s+(here|please|thanks|thank you|pls))?\s*$/i, "")
        .replace(/\s+(here|please|thanks|thank you|pls)$/i, "")
        .replace(/["“”'‘’`]+/g, "")
        .replace(/[?!.;:]+/g, "")
        .trim();
    if (!text) return "New chat";
    return capitalize(cutAtWord(text, MAX_TITLE_LENGTH));
}

/** Title for showing an existing chat: titles saved before short titles existed are shortened. */
export function displayTitle(title: string): string {
    return title.length > MAX_TITLE_LENGTH ? fallbackTitle(title) : title;
}

/**
 * Asks the fast model for a 2–5 word title, like a chat app's sidebar
 * ("Resume and LinkedIn profile"). Falls back to `fallbackTitle` if the model fails,
 * is slow, or returns something unusable.
 */
export async function generateTitle(question: string, answer = ""): Promise<string> {
    const fallback = fallbackTitle(question);
    const ai = completeJson(
        `Write a short title for this chat, like the titles in a chat app's sidebar.
Rules: 2 to 5 words, at most ${MAX_TITLE_LENGTH} characters, sentence case, no quotes, no ending punctuation, no emoji. Describe the topic, not the question ("Saved resume and profile", not "Have I stored my resume?"). Write it in the language of the question.
Reply as JSON: {"title": "..."}

Question: ${question.slice(0, 500)}
${answer ? `Answer: ${answer.slice(0, 500)}` : ""}`,
        { title: fallback }
    );
    const timeout = new Promise<{ title: string }>((resolve) => setTimeout(() => resolve({ title: fallback }), 5000));
    const { title } = await Promise.race([ai, timeout]);

    const clean = typeof title === "string" ? title.replace(/^["'“”\s]+|["'“”.!?\s]+$/g, "").replace(/\s+/g, " ").trim() : "";
    if (!clean || clean.length > MAX_TITLE_LENGTH + 10 || clean.split(" ").length > 8) return fallback;
    return capitalize(cutAtWord(clean, MAX_TITLE_LENGTH));
}
