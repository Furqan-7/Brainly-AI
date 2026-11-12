"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Archive, ArchiveRestore, ExternalLink, FolderPlus, Loader2, MoreHorizontal, Pencil, RotateCw, Star, Trash2 } from "lucide-react";
import type { Collection, Memory } from "../../types/memory";
import { addToCollection, createCollection, deleteMemory, fileUrl, removeFromCollection, retryMemory, updateMemory } from "../../services/api";
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
import { shortDate } from "./cardParts";

interface MemoryCardProps {
    memory: Memory;
    collections?: Collection[];
    onDelete?: (id: number) => void;
    onUpdate?: (memory: Memory) => void;
    onTagClick?: (tag: string) => void;
    onCollectionsChanged?: () => void;
}

/**
 * Picks the content for memory.type. Every card shares the same frame, hover actions and footer
 * (MemoryCard below); a new memory type only needs a new content file and one case here.
 */
export function CardBody({ memory }: { memory: Memory }) {
    switch (memory.type) {
        case "youtube":
            return <YoutubeCard memory={memory} />;
        case "reel":
        case "tiktok":
            return <ReelCard memory={memory} />;
        case "url":
            return <UrlCard memory={memory} />;
        case "tweet":
            return <TweetCard memory={memory} />;
        case "pdf":
            return <PdfCard memory={memory} />;
        case "note":
            return <NoteCard memory={memory} />;
        case "image":
            return <ImageCard memory={memory} />;
        case "audio":
            return <AudioCard memory={memory} />;
        default:
            return <GenericCard memory={memory} />;
    }
}

/** Closes a pop-up on a click outside it or on Escape */
function useDismiss(onClose: () => void) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const onDown = (e: PointerEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [onClose]);
    return ref;
}

const popup = "absolute top-12 right-2.5 z-30 rounded-xl border border-on-surface/10 bg-surface-container-lowest p-1.5 shadow-2xl";
const menuItem = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-on-surface hover:bg-on-surface/6 cursor-pointer";

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
    const ref = useDismiss(onClose);
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
        <div ref={ref} className={`${popup} w-60`}>
            <p className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-semibold tracking-[0.12em] text-on-surface-variant uppercase">Add to collection</p>
            <div className="max-h-56 overflow-y-auto">
                {collections.map((c) => (
                    <label key={c.id} className={menuItem}>
                        <input type="checkbox" checked={current.has(c.id)} onChange={() => toggle(c)} className="accent-primary" />
                        <span className="truncate">{c.name}</span>
                    </label>
                ))}
            </div>
            <form onSubmit={create} className="p-1">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="New collection…"
                    className="w-full rounded-lg border border-on-surface/10 bg-on-surface/4 px-2.5 py-1.5 text-[13px] text-on-surface outline-none focus:border-on-surface/30"
                />
            </form>
        </div>
    );
}

function MoreMenu({ memory, onArchive, onDelete, onClose }: { memory: Memory; onArchive: () => void; onDelete: () => void; onClose: () => void }) {
    const ref = useDismiss(onClose);
    const original = memory.source_url ?? (memory.file_path ? fileUrl(memory.id) : null);
    return (
        <div ref={ref} className={`${popup} w-48`}>
            {original && (
                <a href={original} target="_blank" rel="noopener noreferrer" onClick={onClose} className={menuItem}>
                    <ExternalLink className="size-4 text-on-surface-variant" /> Open original
                </a>
            )}
            <button onClick={() => { onClose(); onArchive(); }} className={menuItem}>
                {memory.archived ? <ArchiveRestore className="size-4 text-on-surface-variant" /> : <Archive className="size-4 text-on-surface-variant" />}
                {memory.archived ? "Restore" : "Archive"}
            </button>
            <button onClick={() => { onClose(); onDelete(); }} className={`${menuItem} text-error hover:bg-error/10`}>
                <Trash2 className="size-4" /> Delete
            </button>
        </div>
    );
}

export function MemoryCard({ memory, collections = [], onDelete, onUpdate, onTagClick, onCollectionsChanged }: MemoryCardProps) {
    const [editing, setEditing] = useState(false);
    const [menu, setMenu] = useState<"collections" | "more" | null>(null);
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

    const remove = async () => {
        if (!window.confirm(`Delete "${memory.title}"? This can't be undone.`)) return;
        await deleteMemory(memory.id);
        onDelete?.(memory.id);
    };

    const action = "grid size-8 place-items-center rounded-lg text-on-surface-variant hover:bg-on-surface/7 hover:text-on-surface transition-colors cursor-pointer";
    const tags = memory.tags ?? [];

    return (
        <article className="group/memory relative overflow-hidden rounded-[18px] border border-outline-variant/60 bg-surface-container-lowest shadow-[0_1px_2px_rgba(60,35,20,0.04),0_14px_30px_-26px_rgba(60,35,20,0.55)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(60,35,20,0.05),0_22px_40px_-26px_rgba(60,35,20,0.6)] has-[[data-open]]:overflow-visible">
            <div className={inProgress ? "opacity-70" : ""}>
                <CardBody memory={memory} />
            </div>

            {inProgress && (
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-md bg-on-surface/75 px-2 py-1 text-[11px] font-semibold text-white">
                    <Loader2 className="size-3 animate-spin" />
                    {memory.attempts > 1 ? `Retrying (attempt ${memory.attempts})…` : "Reading…"}
                </div>
            )}
            {memory.status === "failed" && (
                <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-[12px] text-error">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span className="flex-1 line-clamp-2" title={memory.error ?? undefined}>
                        Couldn&apos;t process this{memory.error ? `: ${memory.error}` : "."}
                    </span>
                    <button onClick={retry} disabled={retrying} className="flex items-center gap-1 font-semibold hover:text-on-surface cursor-pointer disabled:cursor-not-allowed">
                        <RotateCw className={`size-3 ${retrying ? "animate-spin" : ""}`} /> Retry
                    </button>
                </div>
            )}

            {/* Footer: two tags at most, then where it lives and when it was saved */}
            <footer className="flex min-w-0 items-center gap-1.5 px-4 pt-3 pb-3.5">
                {tags.slice(0, 2).map((tag) => (
                    <button
                        key={tag}
                        onClick={() => onTagClick?.(tag)}
                        className="max-w-[45%] truncate rounded-full bg-surface-container px-2 py-0.5 text-[11.5px] text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface cursor-pointer"
                        title={`Show #${tag}`}
                    >
                        #{tag}
                    </button>
                ))}
                {tags.length > 2 && <span className="text-[11px] text-on-surface-variant/60" title={tags.slice(2).map((t) => `#${t}`).join(" ")}>+{tags.length - 2}</span>}
                <span className="ml-auto flex flex-none items-center gap-1.5 text-[11.5px] text-on-surface-variant/70">
                    {memory.starred && <Star className="size-3 fill-amber-500 text-amber-500" aria-label="Starred" />}
                    <time dateTime={memory.createdAt} title={`Saved ${new Date(memory.createdAt).toLocaleString()}`}>{shortDate(memory.createdAt)}</time>
                </span>
            </footer>
            {memory.collections && memory.collections.length > 0 && (
                <p className="-mt-2 truncate px-4 pb-3 text-[11px] text-on-surface-variant/60">In {memory.collections.map((c) => c.name).join(", ")}</p>
            )}

            {/* Actions: shown on hover or keyboard focus (always on touch screens) */}
            <div
                className={`absolute top-2.5 right-2.5 z-20 flex items-center gap-0.5 rounded-xl border border-outline-variant/70 bg-surface-container-lowest/95 p-0.5 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.35)] backdrop-blur transition-opacity duration-200 ${menu ? "opacity-100" : "opacity-0 group-hover/memory:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100"}`}
            >
                <button onClick={() => patch({ starred: !memory.starred })} className={action} title={memory.starred ? "Unstar" : "Star"} aria-pressed={memory.starred}>
                    <Star className={`size-4 ${memory.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                </button>
                <button onClick={() => setMenu((m) => (m === "collections" ? null : "collections"))} className={action} title="Add to collection" aria-expanded={menu === "collections"}>
                    <FolderPlus className="size-4" />
                </button>
                <button onClick={() => setEditing(true)} className={action} title="Edit">
                    <Pencil className="size-4" />
                </button>
                <button onClick={() => setMenu((m) => (m === "more" ? null : "more"))} className={action} title="More" aria-expanded={menu === "more"}>
                    <MoreHorizontal className="size-4" />
                </button>
            </div>

            {menu && (
                <div data-open>
                    {menu === "collections" ? (
                        <CollectionPicker
                            memory={memory}
                            collections={collections}
                            onClose={() => setMenu(null)}
                            onChanged={(inCollections) => {
                                onUpdate?.({ ...memory, collections: inCollections });
                                onCollectionsChanged?.();
                            }}
                        />
                    ) : (
                        <MoreMenu memory={memory} onArchive={() => patch({ archived: !memory.archived })} onDelete={remove} onClose={() => setMenu(null)} />
                    )}
                </div>
            )}

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
        </article>
    );
}
