"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import {
    Search,
    Sparkles,
    Brain,
    Loader2,
    ArrowDown,
    X,
    Filter,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useMemories } from "../hooks/useMemories";
import { ContentGrid } from "../components/memory/ContentGrid";
import { RediscoverPanel } from "../components/memory/RediscoverPanel";
import { ChatComponent } from "../components/chat/ChatComponent";
import { SearchResults } from "../components/chat/SearchResults";
import AddContent from "../components/AddContent";
import UserProfileDropdown from "../components/Profile";
import { DashboardNav } from "../components/layout/DashboardNav";
import { DashboardFAB } from "../components/layout/DashboardFAB";
import { getCollections, getTags } from "../services/api";
import { ALL_TYPES, TYPE_META } from "../components/memory/typeMeta";
import type { Collection, MemoryType, MemoryView, SearchFilters } from "../types/memory";

const viewTabs: { id: MemoryView; label: string }[] = [
    { id: "recent", label: "Recent" },
    { id: "starred", label: "Starred" },
    { id: "archived", label: "Archives" },
];

const contentFilters: { label: string; types?: MemoryType[] }[] = [
    { label: "All" },
    { label: "Web Pages", types: ["url"] },
    { label: "Videos", types: ["youtube"] },
    { label: "Reels", types: ["reel"] },
    { label: "TikToks", types: ["tiktok"] },
    { label: "Tweets", types: ["tweet"] },
    { label: "Documents", types: ["pdf", "image"] },
    { label: "Notes", types: ["note"] },
    { label: "Voice", types: ["audio"] },
];

const dateRanges = [
    { label: "Any time", days: 0 },
    { label: "Past week", days: 7 },
    { label: "Past month", days: 30 },
    { label: "Past year", days: 365 },
];

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

function useDebounced<T>(value: T, ms = 300): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return debounced;
}

/** Pulls a shared page from the PWA share sheet (?share_url / ?share_text / ?share_title). */
function readSharedContent() {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const text = params.get("share_text") ?? undefined;
    // Android often puts the link inside the text instead of the url field
    const url = params.get("share_url") ?? text?.match(/https?:\/\/\S+/)?.[0];
    const title = params.get("share_title") ?? undefined;
    if (!url && !text) return undefined;
    return { url, title, text };
}

export default function ChatPage() {
    const { me, loading: authLoading, refresh: refreshMe } = useAuth();

    // Search / ask
    const [mode, setMode] = useState<"ask" | "search">("ask");
    const [searchQuery, setSearchQuery] = useState("");
    // Filters are captured when the question is submitted
    const [submitted, setSubmitted] = useState<{ text: string; nonce: number; filters: SearchFilters } | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTypes, setSearchTypes] = useState<MemoryType[]>([]);
    const [rangeDays, setRangeDays] = useState(0);

    // Dashboard
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeView, setActiveView] = useState<MemoryView>("recent");
    const [textFilter, setTextFilter] = useState("");
    const [tag, setTag] = useState<string | null>(null);
    const [collectionId, setCollectionId] = useState<number | undefined>(() =>
        typeof window === "undefined" ? undefined : Number(new URLSearchParams(window.location.search).get("collection")) || undefined
    );
    const [collections, setCollections] = useState<Collection[]>([]);
    const [topTags, setTopTags] = useState<{ tag: string; count: number }[]>([]);

    const [shared, setShared] = useState(readSharedContent);
    const [isAddContentOpen, setIsAddContentOpen] = useState(() => Boolean(shared));
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const debouncedText = useDebounced(textFilter);
    const query = useMemo(() => ({
        view: activeView,
        types: contentFilters.find((f) => f.label === activeFilter)?.types,
        q: debouncedText.trim() || undefined,
        tag: tag ?? undefined,
        collectionId,
    }), [activeView, activeFilter, debouncedText, tag, collectionId]);

    const {
        memories, loading, loadingMore, hasMore, error, processingCount,
        fetchMemories, loadMore, upsertMemory, removeMemory,
    } = useMemories(query);

    const loadSidebarData = useCallback(() => {
        getCollections().then(setCollections).catch(() => undefined);
        getTags().then((t) => setTopTags(t.slice(0, 12))).catch(() => undefined);
    }, []);

    useEffect(() => {
        loadSidebarData();
        // Drop ?share_* / ?collection from the address bar once they've been read
        if (window.location.search) window.history.replaceState({}, "", "/chat");
    }, [loadSidebarData]);

    const submit = () => {
        if (!searchQuery.trim()) return;
        const filters: SearchFilters = {
            types: searchTypes.length ? searchTypes : undefined,
            from: rangeDays ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
        };
        setSubmitted({ text: searchQuery.trim(), nonce: Date.now(), filters });
    };

    const toggleSearchType = (type: MemoryType) =>
        setSearchTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));

    if (authLoading || (loading && memories.length === 0 && !error)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#121212]">
                <Loader2 className="w-6 h-6 text-primary-container animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen text-on-surface font-body"
            style={{
                backgroundColor: "#121212",
                backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }}
        >
            {/* Top Nav */}
            <DashboardNav
                onAddContent={() => setIsAddContentOpen(true)}
                onProfileToggle={() => setIsProfileOpen((p) => !p)}
            />

            {/* Profile dropdown */}
            {isProfileOpen && (
                <div className="fixed right-4 md:right-10 top-12 z-50">
                    <UserProfileDropdown me={me} onClose={() => setIsProfileOpen(false)} />
                </div>
            )}

            {/* Add Content modal */}
            {isAddContentOpen && (
                <AddContent
                    isAddContentOpen={isAddContentOpen}
                    setIsAddContentOpen={(open) => {
                        setIsAddContentOpen(open);
                        if (!open) setShared(undefined);
                    }}
                    onSaved={() => {
                        void fetchMemories();
                        void refreshMe();
                        loadSidebarData();
                    }}
                    collections={collections}
                    initial={shared}
                />
            )}

            {/* Main content */}
            <main className="w-full max-w-5xl mx-auto px-4 md:px-10 pt-20 pb-24 space-y-8">

                {/* Greeting */}
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-1.5 pt-4"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-on-surface">
                        {greeting()}, {me?.user.username || "User"}
                    </h1>
                    <p className="text-on-surface-variant text-xs sm:text-sm font-medium opacity-70">
                        Your digital mind is synchronized and ready.
                    </p>
                </motion.header>

                {/* Search + AI response */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-2xl mx-auto space-y-3"
                >
                    {/* Mode toggle */}
                    <div className="flex justify-center">
                        <div className="inline-flex p-0.5 rounded-lg bg-surface-container-high border border-outline-variant/20">
                            {(["ask", "search"] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${mode === m ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant/70 hover:text-on-surface"
                                        }`}
                                >
                                    {m === "ask" ? <Sparkles className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                                    {m === "ask" ? "Ask AI" : "Search"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex items-center group">
                        <div className="absolute -inset-1 bg-[#6366F1] rounded-xl blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity" />
                        <div className="relative flex w-full items-center bg-surface-container-high border border-outline-variant/30 rounded-xl overflow-hidden px-4 h-12 shadow-2xl gap-3">
                            <Search className="w-4 h-4 text-primary-fixed-dim shrink-0" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") submit();
                                }}
                                className="bg-transparent border-none focus:ring-0 w-full text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none min-w-0"
                                placeholder={mode === "ask" ? 'Ask your brain, e.g. "reels about project ideas"' : "Search memories..."}
                                type="text"
                            />
                            <button
                                onClick={() => setShowFilters((s) => !s)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showFilters || searchTypes.length || rangeDays ? "text-primary" : "text-on-surface-variant/50 hover:text-on-surface"}`}
                                title="Filters"
                            >
                                <Filter className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={submit}
                                className="flex items-center gap-1.5 bg-surface-container-highest px-2.5 py-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-bright transition-colors shrink-0 cursor-pointer"
                            >
                                <span className="text-[10px] font-bold tracking-widest uppercase">{mode === "ask" ? "Ask" : "Search"}</span>
                            </button>
                        </div>
                    </div>

                    {/* Search filters */}
                    {showFilters && (
                        <div className="rounded-xl bg-surface-container-high/60 border border-outline-variant/20 p-3 space-y-2">
                            <div className="flex flex-wrap gap-1.5">
                                {ALL_TYPES.map((type) => {
                                    const { plural, icon: Icon, color } = TYPE_META[type];
                                    const on = searchTypes.includes(type);
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => toggleSearchType(type)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border cursor-pointer ${on ? "bg-primary-container/30 border-primary/40 text-on-surface" : "border-outline-variant/20 text-on-surface-variant/70 hover:text-on-surface"
                                                }`}
                                        >
                                            <Icon className={`w-3 h-3 ${color}`} /> {plural}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {dateRanges.map((r) => (
                                    <button
                                        key={r.days}
                                        onClick={() => setRangeDays(r.days)}
                                        className={`px-2 py-1 rounded-md text-[11px] border cursor-pointer ${rangeDays === r.days ? "bg-primary-container/30 border-primary/40 text-on-surface" : "border-outline-variant/20 text-on-surface-variant/70 hover:text-on-surface"
                                            }`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-on-surface-variant/40">
                                Tip: you can also just write it — “videos from last month”, “my reels about projects”.
                            </p>
                        </div>
                    )}

                    {mode === "ask" ? (
                        <ChatComponent ask={submitted} onAnswered={refreshMe} />
                    ) : (
                        <SearchResults query={submitted} />
                    )}

                    {/* Scroll hint */}
                    <div className="mt-12 sm:mt-20 flex justify-center items-center flex-col gap-1">
                        <p className="text-xs sm:text-sm text-on-surface-variant/60 text-center">
                            Scroll Down to see your Memories
                        </p>
                        <ArrowDown className="w-5 h-5 text-on-surface-variant/70" />
                    </div>
                </motion.section>

                <RediscoverPanel />

                {/* View tabs */}
                <div className="flex justify-center gap-2">
                    {viewTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveView(tab.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${activeView === tab.id
                                ? "bg-secondary-container/30 border border-secondary-fixed-dim/20 text-secondary-fixed-dim"
                                : "bg-surface-container-high/50 border border-outline-variant/20 text-on-surface-variant/60 hover:text-on-surface-variant"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filter pills */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="space-y-3"
                >
                    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {contentFilters.map((f) => (
                            <button
                                key={f.label}
                                onClick={() => setActiveFilter(f.label)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeFilter === f.label
                                    ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_-2px_rgba(51,102,255,0.4)]"
                                    : "bg-surface-container-high border border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50 hover:text-on-surface"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/40" />
                            <input
                                value={textFilter}
                                onChange={(e) => setTextFilter(e.target.value)}
                                placeholder="Filter by title, summary, tag or URL…"
                                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg pl-9 pr-3 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:border-primary/40"
                            />
                        </div>
                        {collections.length > 0 && (
                            <select
                                value={collectionId ?? ""}
                                onChange={(e) => setCollectionId(e.target.value ? Number(e.target.value) : undefined)}
                                className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-xs text-on-surface outline-none cursor-pointer"
                            >
                                <option value="">All collections</option>
                                {collections.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.memoryCount})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {(topTags.length > 0 || tag) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {tag && (
                                <button
                                    onClick={() => setTag(null)}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-container text-on-primary-container text-[11px] font-semibold cursor-pointer"
                                >
                                    #{tag} <X className="w-3 h-3" />
                                </button>
                            )}
                            {topTags.filter((t) => t.tag !== tag).map((t) => (
                                <button
                                    key={t.tag}
                                    onClick={() => setTag(t.tag)}
                                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/8 text-[11px] text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                                >
                                    #{t.tag} <span className="opacity-50">{t.count}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Memory grid */}
                {processingCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant/50">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Processing {processingCount} new {processingCount === 1 ? "memory" : "memories"}…</span>
                    </div>
                )}

                {error ? (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-sm text-error">{error}</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-5 h-5 text-on-surface-variant/40 animate-spin" />
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
                            const leavesView =
                                (activeView === "starred" && !memory.starred) ||
                                (activeView === "archived" ? !memory.archived : memory.archived);
                            if (leavesView) removeMemory(memory.id);
                            else upsertMemory(memory);
                        }}
                        onTagClick={setTag}
                        onCollectionsChanged={loadSidebarData}
                        hasMore={hasMore}
                        loadingMore={loadingMore}
                        onLoadMore={loadMore}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Brain className="w-10 h-10 text-on-surface-variant/20" />
                        <p className="text-sm text-on-surface-variant/50">
                            {activeView === "recent" && activeFilter === "All" && !textFilter && !tag && !collectionId
                                ? "No memories yet. Add your first one!"
                                : "Nothing matches these filters."}
                        </p>
                    </div>
                )}
            </main>

            {/* FAB buttons */}
            <DashboardFAB onAddContent={() => setIsAddContentOpen(true)} />
        </div>
    );
}
