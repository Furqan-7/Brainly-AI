"use client";

import { useState } from "react";
import type { Memory } from "../../types/memory";
import { TYPE_META } from "./typeMeta";
import { CardSummary, CardText, CardTitle, PlayButton, SourceLine } from "./cardParts";

/** Short vertical videos: Instagram Reels and TikToks. */
export function ReelCard({ memory }: { memory: Memory }) {
    const meta = memory.metadata ?? {};
    const { icon: Icon } = TYPE_META[memory.type];
    // Instagram CDN thumbnails expire, so fall back to the icon if the image fails
    const [thumbFailed, setThumbFailed] = useState(false);

    return (
        <>
            <a href={memory.source_url ?? undefined} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/5] overflow-hidden bg-surface-container-high" title="Open original">
                {meta.thumbnail_url && !thumbFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote reel thumbnail
                    <img
                        src={meta.thumbnail_url}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setThumbFailed(true)}
                        className="size-full object-cover transition-transform duration-500 group-hover/memory:scale-[1.03]"
                    />
                ) : (
                    <span className="grid size-full place-items-center bg-[radial-gradient(rgb(20_20_20/0.18)_1px,transparent_1.4px)] bg-[length:6px_6px]">
                        <Icon className="size-10 text-on-surface/40" />
                    </span>
                )}
                <PlayButton />
            </a>
            <CardText>
                <SourceLine memory={memory} detail={meta.author ? `@${meta.author}` : null} />
                <CardTitle>{memory.title}</CardTitle>
                <CardSummary text={meta.context || memory.summary || meta.description} />
            </CardText>
        </>
    );
}
