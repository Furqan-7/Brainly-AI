"use client";

import type { Memory } from "../../types/memory";
import { YoutubeCard } from "./YoutubeCard";
import { UrlCard } from "./UrlCard";
import { TweetCard } from "./TweetCard";
import { PdfCard } from "./PdfCard";
import { NoteCard } from "./NoteCard";
import { ImageCard } from "./ImageCard";
import { GenericCard } from "./GenericCard";

interface MemoryCardProps {
    memory: Memory;
    onDelete?: (id: number) => void;
}

/**
 * MemoryCard — dispatches to the correct card variant based on memory.type.
 * Adding a new memory type only requires creating a new card file and one
 * extra case here.
 */
export function MemoryCard({ memory, onDelete }: MemoryCardProps) {
    switch (memory.type) {
        case "youtube":
            return <YoutubeCard memory={memory} onDelete={onDelete} />;
        case "url":
            return <UrlCard memory={memory} onDelete={onDelete} />;
        case "tweet":
            return <TweetCard memory={memory} onDelete={onDelete} />;
        case "pdf":
            return <PdfCard memory={memory} onDelete={onDelete} />;
        case "note":
            return <NoteCard memory={memory} onDelete={onDelete} />;
        case "image":
            return <ImageCard memory={memory} onDelete={onDelete} />;
        default:
            return <GenericCard memory={memory} onDelete={onDelete} />;
    }
}
