"use client";

import type { Memory } from "../../types/memory";
import { fileUrl } from "../../services/api";
import { CardSummary, CardText, CardTitle, SourceLine } from "./cardParts";

export function PdfCard({ memory }: { memory: Memory }) {
    const meta = memory.metadata ?? {};
    const href = memory.file_path ? fileUrl(memory.id) : memory.source_url;
    return (
        <CardText>
            <div className="flex items-center gap-3.5">
                {/* A page with ruled lines, standing in for the document */}
                <a href={href ?? undefined} target="_blank" rel="noopener noreferrer" title="Open document" className="relative h-[70px] w-[54px] flex-none rounded-md border border-outline-variant bg-white shadow-[3px_3px_0_var(--color-surface-container-high)]">
                    <span className="absolute inset-x-2 top-2.5 h-11 bg-[repeating-linear-gradient(var(--color-outline-variant)_0_2px,transparent_2px_7px)]" />
                </a>
                <div className="min-w-0">
                    <SourceLine memory={memory} label="PDF" detail={meta.file_size_mb ? `${meta.file_size_mb} MB` : null} />
                    <CardTitle href={href}>{memory.title}</CardTitle>
                </div>
            </div>
            <CardSummary text={memory.summary} />
        </CardText>
    );
}
