"use client";

import type { Memory } from "../../types/memory";
import { CardSummary, CardText, CardTitle, SourceLine } from "./cardParts";

/** Fallback card for any unrecognised memory type. */
export function GenericCard({ memory }: { memory: Memory }) {
    return (
        <CardText>
            <SourceLine memory={memory} label={memory.type} />
            <CardTitle href={memory.source_url}>{memory.title}</CardTitle>
            <CardSummary text={memory.summary} />
        </CardText>
    );
}
