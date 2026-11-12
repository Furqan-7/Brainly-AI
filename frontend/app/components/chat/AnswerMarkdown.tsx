"use client";

import { memo, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { Source } from "../../types/memory";
import { CITE, linkCitations } from "../../lib/markdown";
import { CitationChip } from "./Sources";

/**
 * Brainly's answer, rendered as Markdown (lists, bold, headings, code), with each [n] citation
 * shown as a chip that opens its source. Raw HTML is never rendered.
 */
export const AnswerMarkdown = memo(function AnswerMarkdown({
    text,
    sources,
    activeN,
    onCite,
}: {
    text: string;
    sources: Source[];
    activeN: number | null;
    onCite: (n: number) => void;
}) {
    const components = useMemo<Components>(() => {
        const byN = new Map(sources.map((s) => [s.n, s]));
        return {
            a: ({ href, children }) => {
                if (href?.startsWith(CITE)) {
                    const n = Number(href.slice(CITE.length));
                    return <CitationChip n={n} source={byN.get(n)} active={activeN === n} onClick={() => onCite(n)} />;
                }
                return (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                        {children}
                    </a>
                );
            },
        };
    }, [sources, activeN, onCite]);

    return (
        <div className="note-md answer-md">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
                {linkCitations(text)}
            </ReactMarkdown>
        </div>
    );
});
