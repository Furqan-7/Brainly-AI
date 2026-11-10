"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Loader2, Plus, Search, X } from "lucide-react";
import { useMemories } from "@/app/hooks/useMemories";
import { ContentGrid } from "@/app/components/memory/ContentGrid";
import { RediscoverPanel } from "@/app/components/memory/RediscoverPanel";
import type { MemoryCounts, MemorySort, MemoryType, MemoryView } from "@/app/types/memory";
import { collectionColor, MEMORIES_CHANGED, PageHeader, useShell } from "../AppShell";

const TABS: { label: string; types?: MemoryType[] }[] = [
    { label: "All" },
    { label: "Videos", types: ["youtube", "reel", "tiktok"] },
    { label: "Posts", types: ["tweet"] },
    { label: "Pages", types: ["url"] },
    { label: "Notes", types: ["note", "audio"] },
    { label: "Files", types: ["pdf", "image"] },
];

const VIEWS: Record<MemoryView, { title: string; eyebrow: string }> = {
    recent: { title: "Everything you've saved.", eyebrow: "Library" },
    starred: { title: "Starred.", eyebrow: "Library · Starred" },
    archived: { title: "Archive.", eyebrow: "Library · Archive" },
};

function useDebounced<T>(value: T, ms = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return debounced;
}

function tabCount(counts: MemoryCounts | null, types?: MemoryType[]) {
    if (!counts) return undefined;
    if (!types) return counts.total;
    return types.reduce((sum, t) => sum + (counts.types[t] ?? 0), 0);
}

/** "⌘ K" on Apple devices, "Ctrl K" elsewhere; nothing during server rendering, so the HTML matches */
const noSubscribe = () => () => {};
function useShortcutLabel() {
    return useSyncExternalStore(
        noSubscribe,
        () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘ K" : "Ctrl K"),
        () => null,
    );
}

function Library() {
    const { refreshMe, collections, reloadCollections, openAddContent, counts, reloadCounts } = useShell();
    const router = useRouter();
    const params = useSearchParams();
    const viewParam = params.get("view");
    const view: MemoryView = viewParam === "starred" || viewParam === "archived" ? viewParam : "recent";
    const collectionId = Number(params.get("collection")) || undefined;
    const collection = collections.find((c) => c.id === collectionId);

    const [tab, setTab] = useState("All");
    const [sort, setSort] = useState<MemorySort>("newest");
    const [text, setText] = useState("");
    const [tag, setTag] = useState<string | null>(null);
    const searchBox = useRef<HTMLInputElement>(null);
    const shortcut = useShortcutLabel();

    const debouncedText = useDebounced(text);
    const query = useMemo(() => ({
        view,
        sort,
        types: TABS.find((t) => t.label === tab)?.types,
        q: debouncedText.trim() || undefined,
        tag: tag ?? undefined,
        collectionId,
    }), [view, sort, tab, debouncedText, tag, collectionId]);

    const { memories, loading, loadingMore, hasMore, error, processingCount, fetchMemories, loadMore, upsertMemory, removeMemory } =
        useMemories(query);

    useEffect(() => {
        const refresh = () => void fetchMemories();
        window.addEventListener(MEMORIES_CHANGED, refresh);
        return () => window.removeEventListener(MEMORIES_CHANGED, refresh);
    }, [fetchMemories]);

    // ⌘K / Ctrl+K jumps to search
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                searchBox.current?.focus();
                searchBox.current?.select();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const clearScope = useCallback(() => router.replace("/library"), [router]);

    // Type counts describe the whole library, so show them only there
    const showCounts = view === "recent" && !collectionId && !tag && !debouncedText;
    const filtered = view !== "recent" || tab !== "All" || text || tag || collectionId;
    const header = VIEWS[view];
    const subtitle = collection
        ? `${collection.memoryCount} ${collection.memoryCount === 1 ? "memory" : "memories"} in this collection`
        : view === "starred"
            ? "The saves you marked as important."
            : view === "archived"
                ? "Out of the way, but nothing is lost. Restore anything from a card's ⋯ menu."
                : counts
                    ? `${counts.total.toLocaleString()} ${counts.total === 1 ? "memory" : "memories"}${counts.thisWeek ? ` · ${counts.thisWeek} added this week` : ""}`
                    : "Reels, videos, links, PDFs, notes and voice memos, in one place.";

    return (
        <>
            <PageHeader eyebrow={collection ? "Collection" : header.eyebrow} title={collection ? `${collection.name}.` : header.title}>
                {subtitle}
            </PageHeader>

            {view === "recent" && !collectionId && <RediscoverPanel />}

            {/* One toolbar: search, type tabs and sort */}
            <div className="sticky top-[61px] z-20 mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest/95 p-2 shadow-[0_12px_30px_-24px_rgba(60,35,20,0.5)] backdrop-blur md:top-3">
                <label className="flex min-w-0 flex-[1_1_100%] items-center gap-2.5 md:flex-[1_1_280px] rounded-xl bg-background px-3 py-2.5 text-on-surface-variant focus-within:ring-1 focus-within:ring-on-surface/30">
                    <Search className="size-4 flex-none" />
                    <input
                        ref={searchBox}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Search titles, summaries, notes, tags or links…"
                        aria-label="Search your library"
                        className="min-w-0 flex-1 bg-transparent text-[14.5px] text-on-surface outline-none placeholder:text-on-surface-variant/70"
                    />
                    {text ? (
                        <button type="button" onClick={() => setText("")} className="rounded p-0.5 hover:text-on-surface cursor-pointer" title="Clear search">
                            <X className="size-3.5" />
                        </button>
                    ) : (
                        shortcut && <kbd className="hidden rounded-md border border-outline-variant px-1.5 py-0.5 font-sans text-[11px] sm:inline">{shortcut}</kbd>
                    )}
                </label>

                <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto rounded-xl bg-background p-1 [scrollbar-width:none] md:flex-none" role="tablist" aria-label="Type">
                    {TABS.map((t) => {
                        const n = showCounts ? tabCount(counts, t.types) : undefined;
                        const on = tab === t.label;
                        return (
                            <button
                                key={t.label}
                                type="button"
                                role="tab"
                                aria-selected={on}
                                onClick={() => setTab(t.label)}
                                className={`flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] transition-colors cursor-pointer ${on ? "bg-surface-container-lowest font-semibold text-on-surface shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-on-surface-variant hover:text-on-surface"}`}
                            >
                                {t.label}
                                {n !== undefined && t.types && <span className="text-[11.5px] font-normal tabular-nums text-on-surface-variant/70">{n}</span>}
                            </button>
                        );
                    })}
                </div>

                <label className="flex flex-none items-center gap-1.5 rounded-xl border border-outline-variant/70 px-2.5 py-2 text-[13.5px] text-on-surface-variant hover:text-on-surface">
                    <ArrowDownUp className="size-3.5" />
                    <select value={sort} onChange={(e) => setSort(e.target.value as MemorySort)} aria-label="Sort" className="cursor-pointer bg-transparent text-on-surface outline-none">
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                </label>
            </div>

            {/* What's narrowing the list, each removable */}
            {(tag || collection || view !== "recent") && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12.5px]">
                    <span className="text-on-surface-variant">Showing</span>
                    {view !== "recent" && (
                        <button type="button" onClick={clearScope} className="flex items-center gap-1 rounded-full bg-on-surface px-2.5 py-1 text-white cursor-pointer">
                            {view === "starred" ? "Starred" : "Archive"} <X className="size-3" />
                        </button>
                    )}
                    {collection && (
                        <button type="button" onClick={clearScope} className="flex items-center gap-1.5 rounded-full bg-on-surface px-2.5 py-1 text-white cursor-pointer">
                            <span className="size-2 rounded-[2px]" style={{ background: collectionColor(collection.id) }} /> {collection.name} <X className="size-3" />
                        </button>
                    )}
                    {tag && (
                        <button type="button" onClick={() => setTag(null)} className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-white cursor-pointer">
                            #{tag} <X className="size-3" />
                        </button>
                    )}
                </div>
            )}

            {processingCount > 0 && (
                <div className="mt-5 flex items-center gap-2 text-[13px] text-on-surface-variant">
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
                        reloadCounts();
                        void refreshMe();
                    }}
                    onUpdate={(memory) => {
                        // Starring/archiving moves a memory out of the current view
                        const leaves = (view === "starred" && !memory.starred) || (view === "archived" ? !memory.archived : memory.archived);
                        if (leaves) removeMemory(memory.id);
                        else upsertMemory(memory);
                        reloadCounts();
                    }}
                    onTagClick={setTag}
                    onCollectionsChanged={reloadCollections}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                />
            ) : filtered ? (
                <p className="py-16 text-center text-sm text-on-surface-variant">
                    {view === "starred" && !text && !tag && tab === "All" ? "Nothing starred yet. Hover a card and tap the star." : view === "archived" && !text && !tag && tab === "All" ? "The archive is empty." : "Nothing matches these filters."}
                </p>
            ) : (
                <div className="rounded-2xl mt-10 grid items-center gap-8 border border-outline-variant bg-surface-container-lowest p-6 md:grid-cols-[1fr_320px] md:p-10">
                    <div className="grid gap-4">
                        <h2 className="font-headline text-3xl leading-tight font-normal tracking-[-0.02em]">Plant your first memory.</h2>
                        <p className="max-w-[46ch] text-on-surface-variant">
                            Save a reel, a YouTube video, an article, a PDF or a quick note. Brainly reads it, so you can find it later just by asking.
                        </p>
                        <button
                            type="button"
                            onClick={() => openAddContent()}
                            className="rounded-xl flex w-fit items-center gap-2 bg-primary-container px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
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

export default function LibraryPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="size-5 animate-spin text-on-surface-variant" /></div>}>
            <Library />
        </Suspense>
    );
}
