"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Filter, Search, Sparkles } from "lucide-react";
import { ChatThread, useChat } from "@/app/components/chat/ChatComponent";
import { SearchResults } from "@/app/components/chat/SearchResults";
import { SourceViewer } from "@/app/components/chat/Sources";
import { ALL_TYPES, TYPE_META } from "@/app/components/memory/typeMeta";
import type { MemoryType, SearchFilters, Source } from "@/app/types/memory";
import { clearSearchCache } from "@/app/services/api";
import { MEMORIES_CHANGED, NEW_CHAT, useShell } from "../AppShell";

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
        // Rounded to the minute, so the same search can come from the cache
        from: rangeDays ? new Date(Math.floor(Date.now() / 60_000) * 60_000 - rangeDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
    };
}

const newNonce = () => Date.now();

const chip = (on: boolean) =>
    `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors cursor-pointer disabled:cursor-not-allowed ${on
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
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed ${compact ? "px-2.5 py-1.5 text-[12.5px]" : "px-3.5 py-2 text-[13.5px]"} ${mode === m ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"}`}
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
        <div className="rounded-2xl grid gap-3 border border-outline-variant bg-surface-container-lowest p-4">
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
        setDecor(true);
        return () => setDecor(false);
    }, [setDecor]);

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

    // Search mode: results follow the text as you type (Enter still searches at once)
    useEffect(() => {
        if (mode !== "search") return;
        const text = query.trim();
        if (text.length < 2) return;
        const timer = setTimeout(() => {
            const filters = buildFilters(types, rangeDays);
            setSearch((current) =>
                current && current.text === text && JSON.stringify(current.filters) === JSON.stringify(filters)
                    ? current
                    : { text, nonce: newNonce(), filters }
            );
        }, 350);
        return () => clearTimeout(timer);
    }, [mode, query, types, rangeDays]);

    // Saved something new: don't show cached results that miss it
    useEffect(() => {
        window.addEventListener(MEMORIES_CHANGED, clearSearchCache);
        return () => window.removeEventListener(MEMORIES_CHANGED, clearSearchCache);
    }, []);

    const toggleType = (type: MemoryType) =>
        setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));

    const closeViewer = useCallback(() => setViewer(null), []);
    const filtersOn = showFilters || types.length > 0 || rangeDays > 0;
    const placeholder =
        mode === "ask"
            ? active ? 'Ask a follow-up, e.g. "show me more like that"' : 'Ask anything, e.g. "that reel about project ideas"'
            : "Search titles, transcripts, notes… (results appear as you type)";

    // Grow the question box with its text (up to a limit), like a chat app
    const inputRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [query]);

    // Keep the newest message in view as you ask and answers stream in
    const messageCount = chat.messages.length;
    useEffect(() => {
        if (messageCount > 0) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }, [messageCount]);

    const composer = (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
            className="grid gap-1 rounded-[20px] border border-outline-variant bg-surface-container-lowest p-2.5 shadow-[0_18px_40px_-28px_rgba(60,35,20,0.55)] transition-[border-color,box-shadow] focus-within:border-on-surface/40 focus-within:shadow-[0_22px_48px_-28px_rgba(60,35,20,0.65)]"
        >
            <textarea
                ref={inputRef}
                rows={1}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                    // Enter sends, Shift+Enter starts a new line
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        submit();
                    }
                }}
                placeholder={placeholder}
                className="max-h-[200px] w-full resize-none bg-transparent px-2 pt-1.5 pb-1 text-[15.5px] leading-[1.5] outline-none placeholder:text-on-surface-variant/70"
                aria-label={mode === "ask" ? "Ask your brain" : "Search your brain"}
            />
            <div className="flex items-center gap-2">
                <ModeSwitch mode={mode} setMode={setMode} compact />
                <button
                    type="button"
                    onClick={() => setShowFilters((s) => !s)}
                    title="Filter by type and date"
                    aria-pressed={showFilters}
                    className={`flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[12.5px] transition-colors ${filtersOn ? "bg-tertiary-container text-primary" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}`}
                >
                    <Filter className="size-3.5" />
                    <span className="max-sm:sr-only">Filters{types.length + (rangeDays ? 1 : 0) ? ` · ${types.length + (rangeDays ? 1 : 0)}` : ""}</span>
                </button>
                <button
                    type="submit"
                    disabled={!query.trim() || (mode === "ask" && chat.busy)}
                    className="ml-auto grid size-9 flex-none place-items-center rounded-xl bg-primary-container text-white transition-[background-color,transform,opacity] hover:bg-black active:scale-95 disabled:opacity-30"
                    title={mode === "ask" ? "Ask (Enter)" : "Search (Enter)"}
                >
                    <ArrowUp className="size-4" />
                </button>
            </div>
        </form>
    );

    const openSource = (key: string, sources: Source[], n: number) => setViewer({ key, sources, n });
    const heading = mode === "ask" ? chat.title ?? "New chat" : `Results for “${search?.text}”`;
    const firstName = me?.user.username ?? "friend";

    return (
        <>
            {/* A screen tall so the question box rests at the bottom; moves left when the viewer is open */}
            <div className={`mx-auto -mb-24 flex min-h-[calc(100svh/var(--ui-zoom,1)-3rem)] w-full max-w-[760px] flex-col ${viewer ? "xl:ml-0" : ""}`}>
                {active ? (
                    <>
                        <h1 className="mb-8 truncate text-[14px] font-medium text-on-surface-variant first-letter:uppercase" title={heading}>
                            {heading}
                        </h1>
                        {mode === "ask" ? (
                            <ChatThread messages={chat.messages} activeSource={viewer?.key ?? null} onOpenSource={openSource} />
                        ) : (
                            <SearchResults
                                query={search}
                                activeN={viewer?.key.startsWith("search:") ? viewer.n : null}
                                onOpen={(sources, n) => openSource(`search:${n}`, sources, n)}
                            />
                        )}
                    </>
                ) : (
                    // Before the first question: a quiet greeting in the middle of the page
                    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-10 text-center">
                        <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="grid size-12 place-items-center rounded-2xl bg-tertiary-container text-primary"
                        >
                            <Sparkles className="size-6" />
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.05 }}
                            className="max-w-[18ch] font-headline text-[clamp(2rem,3.6vw,2.9rem)] leading-[1.08] font-normal tracking-[-0.025em] text-balance"
                        >
                            What are you trying to remember, {firstName}?
                        </motion.h1>
                        <p className="max-w-[46ch] text-[15px] leading-[1.6] text-on-surface-variant">
                            {mode === "ask"
                                ? "Ask in plain words. Brainly answers only from what you saved and shows where each answer came from."
                                : "Search everything you saved, instantly. No AI answer, so it doesn't use your daily answers."}
                        </p>
                        <div className="mt-2 flex max-w-[600px] flex-wrap justify-center gap-2">
                            {SUGGESTIONS.map((s, i) => (
                                <motion.button
                                    key={s}
                                    type="button"
                                    onClick={() => submit(s)}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 + i * 0.06, duration: 0.45 }}
                                    className="rounded-full border border-outline-variant bg-surface-container-lowest/80 px-3.5 py-2 text-[13.5px] text-on-surface-variant transition-colors hover:border-on-surface/40 hover:text-on-surface"
                                >
                                    {s}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* The question box, always at the bottom */}
                <div className="sticky bottom-0 z-20 mt-auto flex flex-col gap-2 pt-8 pb-4">
                    {/* Messages fade out above the box; soft side edges so it doesn't read as a panel */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 bg-background [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,#000_32px),linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] lg:-inset-x-16"
                    />
                    <AnimatePresence initial={false}>
                        {showFilters && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <FiltersPanel types={types} toggleType={toggleType} rangeDays={rangeDays} setRangeDays={setRangeDays} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {composer}
                    <span className="text-center text-[11.5px] text-on-surface-variant">
                        {mode === "ask" ? "Brainly answers only from your memories. Each answer uses one of your daily AI answers." : "Search is instant and doesn't use AI answers."}
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
