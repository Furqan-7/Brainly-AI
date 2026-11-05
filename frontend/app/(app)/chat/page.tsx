"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Filter, Search, Sparkles } from "lucide-react";
import { ChatComponent } from "@/app/components/chat/ChatComponent";
import { SearchResults } from "@/app/components/chat/SearchResults";
import { ALL_TYPES, TYPE_META } from "@/app/components/memory/typeMeta";
import type { MemoryType, SearchFilters } from "@/app/types/memory";
import { PageHeader, useShell } from "../AppShell";

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

const chip = (on: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] transition-colors cursor-pointer ${on
        ? "bg-primary-container text-white"
        : "text-on-surface-variant shadow-[inset_0_0_0_1px_var(--color-outline-variant)] hover:text-on-surface hover:bg-surface-container-high"
    }`;

export default function AskPage() {
    const { me, refreshMe } = useShell();
    const [mode, setMode] = useState<"ask" | "search">("ask");
    const [query, setQuery] = useState("");
    // Filters are captured when the question is submitted
    const [submitted, setSubmitted] = useState<{ text: string; nonce: number; filters: SearchFilters } | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [types, setTypes] = useState<MemoryType[]>([]);
    const [rangeDays, setRangeDays] = useState(0);

    const submit = (text = query) => {
        if (!text.trim()) return;
        setQuery(text);
        setSubmitted({
            text: text.trim(),
            nonce: Date.now(),
            filters: {
                types: types.length ? types : undefined,
                from: rangeDays ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
            },
        });
    };

    const toggleType = (type: MemoryType) =>
        setTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));

    return (
        <>
            <PageHeader eyebrow={mode === "ask" ? "Ask your brain" : "Search your brain"} title={`What are you trying to remember, ${me?.user.username ?? "friend"}?`}>
                Ask in plain words. Brainly answers only from what you saved, shows its sources, and plays reels and videos right in the answer.
            </PageHeader>

            {/* Question box */}
            <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex shadow-[inset_0_0_0_1px_var(--color-outline-variant)]" role="group" aria-label="Mode">
                        {(["ask", "search"] as const).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                aria-pressed={mode === m}
                                className={`flex items-center gap-1.5 px-3.5 py-2 text-[13.5px] transition-colors cursor-pointer ${mode === m ? "bg-primary-container text-white" : "text-on-surface-variant hover:text-on-surface"}`}
                            >
                                {m === "ask" ? <Sparkles className="size-3.5" /> : <Search className="size-3.5" />}
                                {m === "ask" ? "Ask AI" : "Search"}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-on-surface-variant">
                        {mode === "ask" ? "Uses one of your daily AI answers" : "Instant, doesn't use AI answers"}
                    </span>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                    }}
                    className="group relative flex items-center gap-2 border border-outline-variant bg-surface-container-lowest p-2 pl-4 shadow-[0_24px_50px_-40px_rgba(60,35,20,0.5)] transition-[border-color,box-shadow] focus-within:border-on-surface focus-within:shadow-[0_30px_60px_-40px_rgba(60,35,20,0.6)]"
                >
                    <Search className="size-4 flex-none text-on-surface-variant" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={mode === "ask" ? 'Ask anything, e.g. "that reel about project ideas"' : "Search titles, transcripts, notes…"}
                        className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-on-surface-variant/70"
                        aria-label={mode === "ask" ? "Ask your brain" : "Search your brain"}
                    />
                    <button
                        type="button"
                        onClick={() => setShowFilters((s) => !s)}
                        title="Filters"
                        className={`grid size-10 place-items-center transition-colors ${showFilters || types.length || rangeDays ? "text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
                    >
                        <Filter className="size-4" />
                    </button>
                    <button
                        type="submit"
                        disabled={!query.trim()}
                        className="grid size-10 place-items-center bg-primary-container text-white transition-[background-color,transform] hover:bg-black active:scale-95 disabled:opacity-40"
                        title={mode === "ask" ? "Ask" : "Search"}
                    >
                        <ArrowUp className="size-4" />
                    </button>
                </form>

                <AnimatePresence initial={false}>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Before the first question: suggestions + art */}
            {!submitted && (
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
            )}

            {submitted && (
                <div className="mt-8">
                    {mode === "ask" ? <ChatComponent ask={submitted} onAnswered={refreshMe} /> : <SearchResults query={submitted} />}
                </div>
            )}
        </>
    );
}
