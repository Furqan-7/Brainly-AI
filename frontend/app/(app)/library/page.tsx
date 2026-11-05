"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useMemories } from "@/app/hooks/useMemories";
import { ContentGrid } from "@/app/components/memory/ContentGrid";
import { RediscoverPanel } from "@/app/components/memory/RediscoverPanel";
import { getTags } from "@/app/services/api";
import type { MemoryType, MemoryView } from "@/app/types/memory";
import { MEMORIES_CHANGED, PageHeader, useShell } from "../AppShell";

const viewTabs: { id: MemoryView; label: string }[] = [
    { id: "recent", label: "Recent" },
    { id: "starred", label: "Starred" },
    { id: "archived", label: "Archive" },
];

const contentFilters: { label: string; types?: MemoryType[] }[] = [
    { label: "All" },
    { label: "Web pages", types: ["url"] },
    { label: "YouTube", types: ["youtube"] },
    { label: "Reels", types: ["reel"] },
    { label: "TikToks", types: ["tiktok"] },
    { label: "Tweets", types: ["tweet"] },
    { label: "Documents", types: ["pdf", "image"] },
    { label: "Notes", types: ["note"] },
    { label: "Voice", types: ["audio"] },
];

function useDebounced<T>(value: T, ms = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return debounced;
}

export default function LibraryPage() {
    const { refreshMe, collections, reloadCollections, openAddContent } = useShell();
    const [view, setView] = useState<MemoryView>("recent");
    const [filter, setFilter] = useState("All");
    const [text, setText] = useState("");
    const [tag, setTag] = useState<string | null>(null);
    const [collectionId, setCollectionId] = useState<number | undefined>(() =>
        typeof window === "undefined" ? undefined : Number(new URLSearchParams(window.location.search).get("collection")) || undefined
    );
    const [topTags, setTopTags] = useState<{ tag: string; count: number }[]>([]);

    const debouncedText = useDebounced(text);
    const query = useMemo(() => ({
        view,
        types: contentFilters.find((f) => f.label === filter)?.types,
        q: debouncedText.trim() || undefined,
        tag: tag ?? undefined,
        collectionId,
    }), [view, filter, debouncedText, tag, collectionId]);

    const { memories, loading, loadingMore, hasMore, error, processingCount, fetchMemories, loadMore, upsertMemory, removeMemory } =
        useMemories(query);

    const loadTags = useCallback(() => {
        getTags().then((t) => setTopTags(t.slice(0, 14))).catch(() => undefined);
    }, []);

    useEffect(() => {
        loadTags();
        const refresh = () => {
            void fetchMemories();
            loadTags();
        };
        window.addEventListener(MEMORIES_CHANGED, refresh);
        return () => window.removeEventListener(MEMORIES_CHANGED, refresh);
    }, [fetchMemories, loadTags]);

    const filtered = view !== "recent" || filter !== "All" || text || tag || collectionId;

    return (
        <>
            <PageHeader eyebrow="Library" title="Everything you've saved.">
                Reels, videos, links, PDFs, notes and voice memos, in one place. Star what matters, archive what doesn&apos;t.
            </PageHeader>

            <RediscoverPanel />

            {/* Controls */}
            <div className="mt-8 grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex shadow-[inset_0_0_0_1px_var(--color-outline-variant)]" role="group" aria-label="View">
                        {viewTabs.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setView(t.id)}
                                aria-pressed={view === t.id}
                                className={`px-3.5 py-2 text-[13.5px] transition-colors cursor-pointer ${view === t.id ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {collections.length > 0 && (
                        <select
                            value={collectionId ?? ""}
                            onChange={(e) => setCollectionId(e.target.value ? Number(e.target.value) : undefined)}
                            className="cursor-pointer border border-outline-variant bg-surface-container-lowest px-3 py-2 text-[13.5px] outline-none"
                            aria-label="Collection"
                        >
                            <option value="">All collections</option>
                            {collections.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} ({c.memoryCount})</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {contentFilters.map((f) => (
                        <button
                            key={f.label}
                            type="button"
                            onClick={() => setFilter(f.label)}
                            className={`px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${filter === f.label
                                ? "bg-primary-container text-white"
                                : "text-on-surface-variant shadow-[inset_0_0_0_1px_var(--color-outline-variant)] hover:bg-surface-container-high hover:text-on-surface"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Filter by title, summary, tag or link…"
                        aria-label="Filter memories"
                        className="w-full border border-outline-variant bg-surface-container-lowest py-2.5 pr-3 pl-10 text-[14.5px] outline-none placeholder:text-on-surface-variant/70 focus:border-on-surface"
                    />
                </div>

                {(topTags.length > 0 || tag) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {tag && (
                            <button type="button" onClick={() => setTag(null)} className="flex items-center gap-1 bg-primary px-2 py-1 text-[12px] text-white cursor-pointer">
                                #{tag} <X className="size-3" />
                            </button>
                        )}
                        {topTags.filter((t) => t.tag !== tag).map((t) => (
                            <button
                                key={t.tag}
                                type="button"
                                onClick={() => setTag(t.tag)}
                                className="px-2 py-1 text-[12px] text-on-surface-variant shadow-[inset_0_0_0_1px_var(--color-outline-variant)] transition-colors hover:text-on-surface cursor-pointer"
                            >
                                #{t.tag} <span className="opacity-50">{t.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {processingCount > 0 && (
                <div className="mt-6 flex items-center gap-2 text-[13px] text-on-surface-variant">
                    <Loader2 className="size-3.5 animate-spin" />
                    Reading {processingCount} new {processingCount === 1 ? "memory" : "memories"}…
                </div>
            )}

            {error ? (
                <p className="py-16 text-center text-sm text-error">{error}</p>
            ) : loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="size-5 animate-spin text-on-surface-variant" />
                </div>
            ) : memories.length > 0 ? (
                <ContentGrid
                    memories={memories}
                    collections={collections}
                    onDelete={(id) => {
                        removeMemory(id);
                        void refreshMe();
                    }}
                    onUpdate={(memory) => {
                        // Starring/archiving moves a memory out of the current view
                        const leaves = (view === "starred" && !memory.starred) || (view === "archived" ? !memory.archived : memory.archived);
                        if (leaves) removeMemory(memory.id);
                        else upsertMemory(memory);
                    }}
                    onTagClick={setTag}
                    onCollectionsChanged={reloadCollections}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                />
            ) : filtered ? (
                <p className="py-16 text-center text-sm text-on-surface-variant">Nothing matches these filters.</p>
            ) : (
                <div className="mt-10 grid items-center gap-8 border border-outline-variant bg-surface-container-lowest p-6 md:grid-cols-[1fr_320px] md:p-10">
                    <div className="grid gap-4">
                        <h2 className="font-headline text-3xl leading-tight font-normal tracking-[-0.02em]">Plant your first memory.</h2>
                        <p className="max-w-[46ch] text-on-surface-variant">
                            Save a reel, a YouTube video, an article, a PDF or a quick note. Brainly reads it, so you can find it later just by asking.
                        </p>
                        <button
                            type="button"
                            onClick={() => openAddContent()}
                            className="flex w-fit items-center gap-2 bg-primary-container px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
                        >
                            <Plus className="size-4" /> Add your first memory
                        </button>
                    </div>
                    <Image src="/art/bust-tree.webp" alt="Collage of a marble bust with an olive tree growing from it" width={489} height={367} className="w-full rounded-[18px]" />
                </div>
            )}
        </>
    );
}
