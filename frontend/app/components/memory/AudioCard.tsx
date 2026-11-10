"use client";

import type { Memory } from "../../types/memory";
import { fileUrl } from "../../services/api";
import { CardSummary, CardText, CardTitle, SourceLine } from "./cardParts";

export function AudioCard({ memory }: { memory: Memory }) {
    const meta = memory.metadata ?? {};
    return (
        <CardText>
            <SourceLine memory={memory} label="Voice memo" />
            <CardTitle>{memory.title}</CardTitle>
            {memory.file_path && <audio controls preload="none" src={fileUrl(memory.id)} className="mt-3 h-9 w-full" />}
            <CardSummary text={memory.summary || meta.description} />
        </CardText>
    );
}
