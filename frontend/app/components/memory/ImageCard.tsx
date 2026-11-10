"use client";

import { Image as ImageIcon } from "lucide-react";
import type { Memory } from "../../types/memory";
import { fileUrl } from "../../services/api";
import { CardSummary, CardText, CardTitle, SourceLine } from "./cardParts";

export function ImageCard({ memory }: { memory: Memory }) {
    // Served by the API, which checks that the file belongs to the signed-in user
    const src = memory.file_path ? fileUrl(memory.id) : null;
    return (
        <>
            {src ? (
                <a href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden bg-surface-container-high" title="Open image">
                    {/* eslint-disable-next-line @next/next/no-img-element -- private file served by the API */}
                    <img src={src} alt={memory.title} loading="lazy" className="max-h-[420px] w-full object-cover transition-transform duration-500 group-hover/memory:scale-[1.03]" />
                </a>
            ) : (
                <span className="grid aspect-[4/3] place-items-center bg-surface-container-high"><ImageIcon className="size-10 text-on-surface-variant/30" /></span>
            )}
            <CardText>
                <SourceLine memory={memory} />
                <CardTitle>{memory.title}</CardTitle>
                <CardSummary text={memory.summary} />
            </CardText>
        </>
    );
}
