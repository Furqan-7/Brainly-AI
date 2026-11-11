"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, History, Plus } from "lucide-react";
import axios from "axios";
import { searchMemories } from "../../services/api";
import type { ConversationSummary, Memory, SearchFilters, Source } from "../../types/memory";
import { TYPE_META } from "../memory/typeMeta";

const ease = [0.22, 1, 0.36, 1] as const;

function Thumb({ src, type, className }: { src?: string | null; type: string; className: string }) {
    const [failed, setFailed] = useState(false);
    const meta = TYPE_META[type as keyof typeof TYPE_META] ?? TYPE_META.note;
    const Icon = meta.icon;
    if (src && !failed) {
        // eslint-disable-next-line @next/next/no-img-element -- remote thumbnail
        return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${className} object-cover`} />;
    }
    return (
        <span className={`${className} grid place-items-center bg-surface-container-high`}>
            <Icon className={`size-[45%] ${meta.color}`} />
        </span>
    );
}

/**
 * "3 memories match so far" while a question is typed, from the free instant search, so you
 * can see Brainly has the right saves before spending an AI answer.
 */
export function LiveMatches({ text, filters }: { text: string; filters: SearchFilters }) {
    const q = text.trim();
    const key = `${q}|${JSON.stringify(filters)}`;
    const [state, setState] = useState<{ key: string; results: Source[] } | null>(null);

    useEffect(() => {
        if (q.length < 3) return;
        const controller = new AbortController();
        const timer = setTimeout(() => {
            searchMemories(q, filters, controller.signal)
                .then((results) => setState({ key, results }))
                .catch((e) => {
                    if (!axios.isCancel(e) && !controller.signal.aborted) setState({ key, results: [] });
                });
        }, 450);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
        // `filters` is captured through `key`
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const show = q.length >= 3 && state !== null;
    const results = state?.results ?? [];
    const stale = state?.key !== key;
    const names = results.slice(0, 2).map((r) => `“${r.title}”`);

    return (
        <AnimatePresence initial={false}>
            {show && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                    <div className={`mx-3 mb-1.5 flex items-center gap-3 rounded-2xl border border-dashed border-outline-variant bg-background px-3 py-2.5 transition-opacity duration-200 ${stale ? "opacity-60" : ""}`} aria-live="polite">
                        {results.length > 0 && (
                            <span className="flex flex-none">
                                {results.slice(0, 3).map((r, i) => (
                                    <motion.span key={r.memoryId} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={i ? "-ml-2" : ""}>
                                        <Thumb src={r.thumbnail} type={r.type} className="size-8 rounded-lg border-2 border-surface-container-lowest" />
                                    </motion.span>
                                ))}
                            </span>
                        )}
                        <p className="min-w-0 truncate text-[12.5px] text-on-surface-variant">
                            {results.length === 0 ? (
                                "No saves match yet. Try other words, or remove a filter."
                            ) : (
                                <>
                                    <b className="font-semibold text-on-surface">{results.length} {results.length === 1 ? "memory" : "memories"}</b> match so far: {names.join(", ")}
                                    {results.length > 2 ? `, and ${results.length - 2} more` : ""}
                                </>
                            )}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** A question worth asking about a save, in plain words */
function questionFor(m: Memory): string {
    const t = m.title.length > 70 ? `${m.title.slice(0, 67)}…` : m.title;
    switch (m.type) {
        case "youtube":
        case "reel":
        case "tiktok":
            return `What are the key points of “${t}”?`;
        case "tweet":
            return `What was the post “${t}” about?`;
        case "note":
        case "audio":
            return `Summarise my note “${t}”`;
        case "pdf":
            return `Summarise “${t}”`;
        default:
            return `What's the main idea of “${t}”?`;
    }
}

function ago(iso: string) {
    const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (d < 1) return "today";
    if (d < 2) return "yesterday";
    if (d < 14) return `${d} days ago`;
    if (d < 60) return `${Math.round(d / 7)} weeks ago`;
    return `${Math.round(d / 30)} months ago`;
}

const panel = "rounded-[20px] border border-outline-variant/70 bg-surface-container-lowest/75 p-3 backdrop-blur-sm";
const label = "px-2 pt-1 pb-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-on-surface-variant uppercase";

export function StartPanels({
    recent,
    chats,
    onAsk,
    onAdd,
}: {
    recent: Memory[] | null;
    chats: ConversationSummary[];
    onAsk: (question: string) => void;
    onAdd: () => void;
}) {
    const item = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.12 + i * 0.05, duration: 0.45, ease } });

    return (
        <div className={`grid gap-4 ${chats.length ? "md:grid-cols-[1.3fr_1fr]" : ""}`}>
            <section className={panel} aria-label="Ask about something you saved">
                <p className={label}>Ask about something you saved</p>
                {recent === null ? (
                    <div className="grid gap-2 p-2">
                        {[0, 1, 2].map((i) => <span key={i} className="h-12 animate-pulse rounded-xl bg-on-surface/5" />)}
                    </div>
                ) : recent.length === 0 ? (
                    <button type="button" onClick={onAdd} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-on-surface/4 cursor-pointer">
                        <span className="grid size-10 place-items-center rounded-xl bg-tertiary-container text-primary"><Plus className="size-4" /></span>
                        <span>
                            <span className="block text-[13.5px] font-semibold">Save your first memory</span>
                            <span className="text-[12px] text-on-surface-variant">A reel, a video, a link or a note. Then ask about it here.</span>
                        </span>
                    </button>
                ) : (
                    <div className="grid">
                        {recent.map((m, i) => (
                            <motion.button
                                key={m.id}
                                type="button"
                                onClick={() => onAsk(questionFor(m))}
                                {...item(i)}
                                className="group flex items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-on-surface/4 cursor-pointer"
                            >
                                <Thumb src={m.metadata?.thumbnail_url} type={m.type} className="size-11 flex-none rounded-xl" />
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[13.5px] leading-snug font-semibold text-on-surface line-clamp-2">{questionFor(m)}</span>
                                    <span className="text-[11.5px] text-on-surface-variant">{TYPE_META[m.type]?.label ?? m.type} · saved {ago(m.createdAt)}</span>
                                </span>
                                <ArrowRight className="size-4 flex-none text-on-surface-variant/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-on-surface" />
                            </motion.button>
                        ))}
                    </div>
                )}
            </section>

            {chats.length > 0 && (
                <section className={panel} aria-label="Pick up a chat">
                    <p className={label}>Pick up a chat</p>
                    <div className="grid">
                        {chats.slice(0, 4).map((c, i) => (
                            <motion.div key={c.id} {...item(i + 1)}>
                                <Link href={`/chat?c=${c.id}`} className="flex items-center gap-2.5 rounded-xl px-2 py-2.5 text-[13px] text-on-surface transition-colors hover:bg-on-surface/4">
                                    <History className="size-3.5 flex-none text-on-surface-variant/60" />
                                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                                    <span className="text-[11px] text-on-surface-variant/70">{ago(c.updatedAt)}</span>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
