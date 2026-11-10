"use client";

import type { Memory } from "../../types/memory";
import { SitePreview } from "./SitePreview";
import { CardSummary, CardText, CardTitle, hostOf, SourceLine } from "./cardParts";

export function UrlCard({ memory }: { memory: Memory }) {
    const meta = memory.metadata ?? {};
    const isWeb = Boolean(memory.source_url && /^https?:\/\//i.test(memory.source_url));
    return (
        <>
            {isWeb && (
                <div className="px-3 pt-3">
                    <SitePreview url={memory.source_url!} fallbackImage={meta.thumbnail_url} title={memory.title} />
                </div>
            )}
            <CardText>
                <SourceLine memory={memory} label={meta.site_name || hostOf(memory.source_url) || "Web page"} />
                <CardTitle href={memory.source_url}>{memory.title}</CardTitle>
                <CardSummary text={meta.description || memory.summary} />
            </CardText>
        </>
    );
}
