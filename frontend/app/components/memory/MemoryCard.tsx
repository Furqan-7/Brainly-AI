"use client";

import { useState } from "react";
import { AlertTriangle, Archive, ArchiveRestore, FolderPlus, Loader2, Pencil, RotateCw, Star } from "lucide-react";
import type { Collection, Memory } from "../../types/memory";
import { addToCollection, createCollection, removeFromCollection, retryMemory, updateMemory } from "../../services/api";
import { YoutubeCard } from "./YoutubeCard";
import { ReelCard } from "./ReelCard";
import { UrlCard } from "./UrlCard";
import { TweetCard } from "./TweetCard";
import { PdfCard } from "./PdfCard";
import { NoteCard } from "./NoteCard";
import { ImageCard } from "./ImageCard";
import { AudioCard } from "./AudioCard";
import { GenericCard } from "./GenericCard";
import { EditMemoryModal } from "./EditMemoryModal";

interface MemoryCardProps {
    memory: Memory;
    collections?: Collection[];
    onDelete?: (id: number) => void;
    onUpdate?: (memory: Memory) => void;
    onTagClick?: (tag: string) => void;
    onCollectionsChanged?: () => void;
}

/**
 * Picks the card variant for memory.type. Adding a new memory type only requires creating
 * a new card file and one extra case here.
 */
function CardBody({ memory, onDelete }: { memory: Memory; onDelete?: (id: number) => void }) {
    switch (memory.type) {
        case "youtube":
            return <YoutubeCard memory={memory} onDelete={onDelete} />;
        case "reel":
        case "tiktok":
            return <ReelCard memory={memory} onDelete={onDelete} />;
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
        case "audio":
            return <AudioCard memory={memory} onDelete={onDelete} />;
        default:
            return <GenericCard memory={memory} onDelete={onDelete} />;
    }
}

function CollectionPicker({
    memory,
    collections,
    onChanged,
    onClose,
}: {
    memory: Memory;
    collections: Collection[];
    onChanged: (inCollections: { id: number; name: string }[]) => void;
    onClose: () => void;
}) {
    const [name, setName] = useState("");
    const current = new Set(memory.collections?.map((c) => c.id));

    const toggle = async (c: Collection) => {
        if (current.has(c.id)) {
            await removeFromCollection(c.id, memory.id);
            onChanged((memory.collections ?? []).filter((x) => x.id !== c.id));
        } else {
            await addToCollection(c.id, [memory.id]);
            onChanged([...(memory.collections ?? []), { id: c.id, name: c.name }]);
        }
    };

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        const c = await createCollection(name.trim());
        await addToCollection(c.id, [memory.id]);
        onChanged([...(memory.collections ?? []), { id: c.id, name: c.name }]);
        setName("");
    };

    return (
        <div
            className="absolute bottom-10 left-2 z-30 w-56 rounded-xl bg-surface-container-lowest border border-on-surface/10 shadow-2xl p-2 space-y-1"
            onMouseLeave={onClose}
        >
            <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-on-surface-variant">Collections</p>
            {collections.map((c) => (
                <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-on-surface/6 text-xs text-on-surface cursor-pointer disabled:cursor-not-allowed">
                    <input type="checkbox" checked={current.has(c.id)} onChange={() => toggle(c)} className="accent-primary" />
                    <span className="truncate">{c.name}</span>
                </label>
            ))}
            <form onSubmit={create} className="flex gap-1 pt-1">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New collection…"
                    className="flex-1 min-w-0 bg-on-surface/5 border border-on-surface/10 rounded-md px-2 py-1 text-xs text-on-surface outline-none"
                />
            </form>
        </div>
    );
}

export function MemoryCard({ memory, collections = [], onDelete, onUpdate, onTagClick, onCollectionsChanged }: MemoryCardProps) {
    const [editing, setEditing] = useState(false);
    const [picking, setPicking] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const inProgress = memory.status === "pending" || memory.status === "processing";

    const patch = async (fields: Parameters<typeof updateMemory>[1]) => {
        onUpdate?.({ ...memory, ...fields } as Memory); // optimistic
        onUpdate?.(await updateMemory(memory.id, fields));
    };

    const retry = async () => {
        setRetrying(true);
        await retryMemory(memory.id);
        onUpdate?.({ ...memory, status: "pending", error: null });
        setRetrying(false);
    };

    const actionClass = "p-1.5 rounded-lg text-on-surface-variant/60 hover:text-on-surface hover:bg-on-surface/8 transition-colors cursor-pointer disabled:cursor-not-allowed";

    return (
        <div className="relative group/memory flex flex-col gap-2">
            <div className={inProgress ? "opacity-70" : ""}>
                <CardBody memory={memory} onDelete={onDelete} />
            </div>

            {/* Status */}
            {inProgress && (
                <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/70 text-[10px] font-semibold text-on-surface">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {memory.attempts > 1 ? `Retrying (attempt ${memory.attempts})…` : "Processing…"}
                </div>
            )}
            {memory.status === "failed" && (
                <div className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-[11px] text-error">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="flex-1 line-clamp-2" title={memory.error ?? undefined}>
                        Couldn&apos;t process this{memory.error ? `: ${memory.error}` : "."}
                    </span>
                    <button onClick={retry} disabled={retrying} className="flex items-center gap-1 font-semibold hover:text-on-surface cursor-pointer disabled:cursor-not-allowed">
                        <RotateCw className={`w-3 h-3 ${retrying ? "animate-spin" : ""}`} /> Retry
                    </button>
                </div>
            )}

            {/* Tags */}
            {memory.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {memory.tags.slice(0, 6).map((tag) => (
                        <button
                            key={tag}
                            onClick={() => onTagClick?.(tag)}
                            className="px-1.5 py-0.5 rounded-md bg-on-surface/5 border border-on-surface/8 text-[10px] text-on-surface-variant/70 hover:text-on-surface hover:border-on-surface/20 cursor-pointer disabled:cursor-not-allowed"
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-0.5 relative">
                <button onClick={() => patch({ starred: !memory.starred })} className={actionClass} title={memory.starred ? "Unstar" : "Star"}>
                    <Star className={`w-3.5 h-3.5 ${memory.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                </button>
                <button onClick={() => patch({ archived: !memory.archived })} className={actionClass} title={memory.archived ? "Restore from archive" : "Archive"}>
                    {memory.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setEditing(true)} className={actionClass} title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setPicking((p) => !p)} className={actionClass} title="Add to collection">
                    <FolderPlus className="w-3.5 h-3.5" />
                </button>
                {memory.collections && memory.collections.length > 0 && (
                    <span className="ml-1 text-[10px] text-on-surface-variant/50 truncate">
                        in {memory.collections.map((c) => c.name).join(", ")}
                    </span>
                )}
                {picking && (
                    <CollectionPicker
                        memory={memory}
                        collections={collections}
                        onClose={() => setPicking(false)}
                        onChanged={(inCollections) => {
                            onUpdate?.({ ...memory, collections: inCollections });
                            onCollectionsChanged?.();
                        }}
                    />
                )}
            </div>

            {editing && (
                <EditMemoryModal
                    memory={memory}
                    onClose={() => setEditing(false)}
                    onSaved={(updated) => {
                        onUpdate?.(updated);
                        setEditing(false);
                    }}
                />
            )}
        </div>
    );
}
