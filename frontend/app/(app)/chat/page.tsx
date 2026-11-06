"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Filter, Search, Sparkles } from "lucide-react";
import { ChatThread, useChat } from "@/app/components/chat/ChatComponent";
import { SearchResults } from "@/app/components/chat/SearchResults";
import { SourceViewer } from "@/app/components/chat/Sources";
import { ALL_TYPES, TYPE_META } from "@/app/components/memory/typeMeta";
import type { MemoryType, SearchFilters, Source } from "@/app/types/memory";
import { NEW_CHAT, PageHeader, useShell } from "../AppShell";

const dateRanges = [
    { label: "Any time", days: 0 },
    { label: "Past week", days: 7 },
    { label: "Past month", days: 30 },
    { label: "Past year", days: 365 },
];

const SUGGESTIONS = [
    "that reel about project ideas I saved",
    "videos about cooking from last month",
    "what did my PDFs say about transformers?",
    "notes from the Q3 planning meeting",
];

type Mode = "ask" | "search";

/** Filters for a question, captured when it's sent. */
function buildFilters(types: MemoryType[], rangeDays: number): SearchFilters {
    return {
        types: types.length ? types : undefined,
        from: rangeDays ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };
}

const newNonce = () => Date.now();

const chip = (on: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] transition-colors cursor-pointer ${on
        ? "bg-primary-container text-white"
        : "text-on-surface-variant shadow-[inset_0_0_0_1px_var(--color-outline-variant)] hover:text-on-surface hover:bg-surface-container-high"
    }`;

function ModeSwitch({ mode, setMode, compact = false }: { mode: Mode; setMode: (m: Mode) => void; compact?: boolean }) {
    return (
        <div className={`inline-flex flex-none overflow-hidden shadow-[inset_0_0_0_1px_var(--color-outline-variant)] ${compact ? "rounded-[10px]" : ""}`} role="group" aria-label="Mode">
            {(["ask", "search"] as const).map((m) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    title={m === "ask" ? "A written answer from your memories (uses a daily AI answer)" : "Matching memories, instantly (free)"}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${compact ? "px-2.5 py-1.5 text-[12.5px]" : "px-3.5 py-2 text-[13.5px]"} ${mode === m ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                    {m === "ask" ? <Sparkles className="size-3.5" /> : <Search className="size-3.5" />}
                    {/* icons only in the docked box on phones, so the input keeps its room */}
                    <span className={compact ? "max-sm:sr-only" : ""}>{m === "ask" ? "Ask AI" : "Search"}</span>
                </button>
            ))}
        </div>
    );
}

function FiltersPanel({ types, toggleType, rangeDays, setRangeDays }: { types: MemoryType[]; toggleType: (t: MemoryType) => void; rangeDays: number; setRangeDays: (d: number) => void }) {
    return (
        <div className="grid gap-3 border border-outline-variant bg-surface-container-lowest p-4">
            <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((type) => {
                    const { plural, icon: Icon } = TYPE_META[type];
                    return (
                        <button key={type} type="button" onClick={() => toggleType(type)} className={chip(types.includes(type))}>
                            <Icon className="size-3.5" /> {plural}
                        </button>
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {dateRanges.map((r) => (
                    <button key={r.days} type="button" onClick={() => setRangeDays(r.days)} className={chip(rangeDays === r.days)}>
                        {r.label}
                    </button>
                ))}
            </div>
            <p className="text-xs text-on-surface-variant">Tip: you can also just write it, like “videos from last month”.</p>
        </div>
    );
}

export default function AskPage() {
    // useSearchParams (for ?c=<chat id>) needs a Suspense boundary
    return (
        <Suspense fallback={null}>
            <Ask />
        </Suspense>
    );
}

function Ask() {
    const { me, refreshMe, reloadChats, setDecor } = useShell();
    const router = useRouter();
    const params = useSearchParams();
    const chatParam = Number(params.get("c")) || null;

    const [mode, setMode] = useState<Mode>("ask");
    const [query, setQuery] = useState("");
    const [search, setSearch] = useState<{ text: string; nonce: number; filters: SearchFilters } | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [types, setTypes] = useState<MemoryType[]>([]);
    const [rangeDays, setRangeDays] = useState(0);
    // The source open in the viewer: which list it came from ("message:n" or "search:n") and its number
    const [viewer, setViewer] = useState<{ key: string; sources: Source[]; n: number } | null>(null);

    const chat = useChat({
        onAnswered: () => {
            void refreshMe();
            reloadChats();
        },
        // Put a new chat in the address bar (so it can be reopened) and in the sidebar
        onConversation: (id) => {
            router.replace(`/chat?c=${id}`, { scroll: false });
            reloadChats();
        },
    });
    const { load, reset, conversationRef } = chat;

    // Open the chat in ?c=, or start fresh when it's removed
    useEffect(() => {
        if (chatParam && chatParam !== conversationRef.current) {
            setMode("ask");
            setViewer(null);
            load(chatParam).catch(() => router.replace("/chat"));
        } else if (!chatParam && conversationRef.current) {
            reset();
            setViewer(null);
        }
    }, [chatParam, conversationRef, load, reset, router]);

    // Sidebar "New chat"
    useEffect(() => {
        const onNewChat = () => {
            reset();
            setSearch(null);
            setQuery("");
            setMode("ask");
            setViewer(null);
        };
        window.addEventListener(NEW_CHAT, onNewChat);
        return () => window.removeEventListener(NEW_CHAT, onNewChat);
    }, [reset]);

    const active = mode === "ask" ? chat.messages.length > 0 : search !== null;

    useEffect(() => {
        setDecor(active);
        return () => setDecor(false);
    }, [active, setDecor]);

    const submit = (text = query) => {
        if (!text.trim() || (mode === "ask" && chat.busy)) return;
        setShowFilters(false);
        if (mode === "ask") {
            void chat.send(text, buildFilters(types, rangeDays));
            setQuery("");
        } else {
            setQuery(text);
            setSearch({ text: text.trim(), nonce: newNonce(), filters: buildFilters(types, rangeDays) });
        }
    };

    const toggleType = (type: MemoryType) =>
        setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));

    const closeViewer = useCallback(() => setViewer(null), []);
    const filtersOn = showFilters || types.length > 0 || rangeDays > 0;
    const placeholder =
        mode === "ask"
            ? active ? 'Ask a follow-up, e.g. "show me more like that"' : 'Ask anything, e.g. "that reel about project ideas"'
            : "Search titles, transcripts, notes…";

    const composer = (docked: boolean) => (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            className={`group relative flex items-center gap-2 border border-outline-variant bg-surface-container-lowest transition-[border-color,box-shadow] focus-within:border-on-surface ${docked
                ? "rounded-2xl p-2 shadow-[0_22px_44px_-26px_rgba(60,35,20,0.55)]"
                : "p-2 pl-4 shadow-[0_24px_50px_-40px_rgba(60,35,20,0.5)] focus-within:shadow-[0_30px_60px_-40px_rgba(60,35,20,0.6)]"
                }`}
        >
            {docked ? <ModeSwitch mode={mode} setMode={setMode} compact /> : <Search className="size-4 flex-none text-on-surface-variant" />}
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className={`min-w-0 flex-1 bg-transparent py-2.5 outline-none placeholder:text-on-surface-variant/70 ${docked ? "px-1.5 text-[15px]" : "text-base"}`}
                aria-label={mode === "ask" ? "Ask your brain" : "Search your brain"}
            />
            <button
                type="button"
                onClick={() => setShowFilters((s) => !s)}
                title="Filters"
                className={`grid size-10 flex-none place-items-center transition-colors ${filtersOn ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
                <Filter className="size-4" />
            </button>
            <button
                type="submit"
                disabled={!query.trim() || (mode === "ask" && chat.busy)}
                className={`grid size-10 flex-none place-items-center bg-primary-container text-white transition-[background-color,transform] hover:bg-black active:scale-95 disabled:opacity-40 ${docked ? "rounded-xl" : ""}`}
                title={mode === "ask" ? "Ask" : "Search"}
            >
                <ArrowUp className="size-4" />
            </button>
        </form>
    );

    const filtersPanel = (
        <AnimatePresence initial={false}>
            {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <FiltersPanel types={types} toggleType={toggleType} rangeDays={rangeDays} setRangeDays={setRangeDays} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    const openSource = (key: string, sources: Source[], n: number) => setViewer({ key, sources, n });

    // ── Before the first question: big heading, question box, suggestions ──
    if (!active) {
        return (
            <>
                <PageHeader eyebrow={mode === "ask" ? "Ask your brain" : "Search your brain"} title={`What are you trying to remember, ${me?.user.username ?? "friend"}?`}>
                    Ask in plain words. Brainly answers only from what you saved, shows its sources, and plays reels and videos right in the answer.
                </PageHeader>

                <div className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <ModeSwitch mode={mode} setMode={setMode} />
                        <span className="text-xs text-on-surface-variant">
                            {mode === "ask" ? "Uses one of your daily AI answers" : "Instant, doesn't use AI answers"}
                        </span>
                    </div>
                    {composer(false)}
                    {filtersPanel}
                </div>

                <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1fr_340px]">
                    <div className="grid gap-3">
                        <span className="text-xs tracking-[0.05em] text-on-surface-variant uppercase">Try asking</span>
                        {SUGGESTIONS.map((s, i) => (
                            <motion.button
                                key={s}
                                type="button"
                                onClick={() => submit(s)}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.07, duration: 0.5 }}
                                className="group flex items-center justify-between gap-4 border border-outline-variant bg-surface-container-lowest/70 px-4 py-3.5 text-left text-[15px] transition-[transform,background-color,border-color] hover:translate-x-1 hover:border-on-surface hover:bg-surface-container-lowest"
                            >
                                {s}
                                <ArrowUp className="size-4 rotate-45 text-on-surface-variant transition-transform group-hover:rotate-90 group-hover:text-on-surface" />
                            </motion.button>
                        ))}
                    </div>
                    <motion.figure
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className="hidden overflow-hidden rounded-[22px] border border-outline-variant lg:block"
                    >
                        <Image src="/art/statue-eye.webp" alt="Collage of a marble head with the sky showing through its eye" width={489} height={792} className="h-[440px] w-full object-cover object-top" priority />
                    </motion.figure>
                </div>
            </>
        );
    }

    // ── During a chat or search: title, thread, question box docked at the bottom ──
    const heading = mode === "ask" ? chat.title ?? "New chat" : `Results for “${search?.text}”`;
    return (
        <>
            {/* With the viewer open on wide screens, the thread moves left to stay clear of it */}
            {/* At least a screen tall, so the question box rests at the bottom even in a short chat */}
            <div className={`mx-auto flex min-h-[calc(100svh/var(--ui-zoom,1)-4rem)] w-full max-w-[820px] flex-col gap-6 ${viewer ? "xl:ml-0" : ""}`}>
                <header className="grid gap-2.5">
                    <span className="w-fit bg-surface-container-high px-2.5 py-1.5 text-[12px] leading-none tracking-[0.05em] uppercase">
                        {mode === "ask" ? "Ask your brain" : "Search your brain"}
                    </span>
                    <h1 className="line-clamp-2 font-headline text-[clamp(1.6rem,2.4vw,2.1rem)] leading-[1.1] font-normal tracking-[-0.02em] first-letter:uppercase">{heading}</h1>
                </header>

                {mode === "ask" ? (
                    <ChatThread messages={chat.messages} activeSource={viewer?.key ?? null} onOpenSource={openSource} />
                ) : (
                    <SearchResults
                        query={search}
                        activeN={viewer?.key.startsWith("search:") ? viewer.n : null}
                        onOpen={(sources, n) => openSource(`search:${n}`, sources, n)}
                    />
                )}

                <div className="sticky bottom-4 z-20 mt-auto flex flex-col gap-2 pt-2">
                    {/* fade the page out behind the docked box */}
                    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-8 -bottom-4 -z-10 bg-gradient-to-b from-transparent via-background/90 to-background" />
                    {filtersPanel}
                    {composer(true)}
                    <span className="px-1 text-[11.5px] text-on-surface-variant">
                        {mode === "ask" ? "Ask AI uses one of your daily AI answers." : "Search is instant and doesn't use AI answers."}
                    </span>
                </div>
            </div>

            <SourceViewer
                sources={viewer?.sources ?? []}
                activeN={viewer?.n ?? null}
                onSelect={(n) => setViewer((v) => (v ? { ...v, n, key: `${v.key.split(":")[0]}:${n}` } : v))}
                onClose={closeViewer}
            />
        </>
    );
}
