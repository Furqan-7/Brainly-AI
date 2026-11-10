"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// Links open in a new tab and don't trigger the card's own click (open the note)
const components: Components = {
    a: ({ href, title, children }) => (
        <a href={href} title={title} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {children}
        </a>
    ),
};

/**
 * Renders a note as Markdown: headings, bold, lists, checklists, tables, quotes and code.
 * Single line breaks are kept, so plain-text notes look the way they were typed.
 * Raw HTML in notes is not rendered (react-markdown escapes it), so notes can't inject markup.
 */
export function NoteMarkdown({ text, size = "card" }: { text: string; size?: "card" | "reader" }) {
    return (
        <div className={`note-md ${size === "reader" ? "note-md-reader" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
                {text}
            </ReactMarkdown>
        </div>
    );
}
