"use client";

import { Video } from "lucide-react";
import type { Memory } from "../../types/memory";
import { CardSummary, CardText, CardTitle, Duration, PlayButton, SourceLine } from "./cardParts";

export function YoutubeCard({ memory }: { memory: Memory }) {
    const meta = memory.metadata ?? {};
    return (
        <>
            <a href={memory.source_url ?? undefined} target="_blank" rel="noopener noreferrer" className="relative block aspect-video overflow-hidden bg-surface-container-highest" title="Watch on YouTube">
                {meta.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail
                    <img src={meta.thumbnail_url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover/memory:scale-[1.03]" />
                ) : (
                    <span className="grid size-full place-items-center"><Video className="size-10 text-on-surface-variant/30" /></span>
                )}
                <PlayButton />
                <Duration value={meta.duration} />
            </a>
            <CardText>
                <SourceLine memory={memory} detail={meta.author} />
                <CardTitle>{memory.title}</CardTitle>
                <CardSummary text={memory.summary || meta.description} />
            </CardText>
        </>
    );
}
