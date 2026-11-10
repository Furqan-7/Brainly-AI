"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ExternalLink, RotateCcw, Sparkles, X } from "lucide-react";
import { getRediscover, reviewMemory } from "../../services/api";
import type { RediscoverItem } from "../../types/memory";
import { sourceHref } from "../chat/SourceCard";
import { TYPE_META } from "./typeMeta";

function savedAgo(iso: string): string {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days < 1) return "saved today";
    if (days < 14) return `saved ${days} day${days === 1 ? "" : "s"} ago`;
    if (days < 60) return `saved ${Math.round(days / 7)} weeks ago`;
    if (days < 365) return `saved ${Math.round(days / 30)} months ago`;
    const years = Math.round(days / 365);
    return `saved ${years} year${years === 1 ? "" : "s"} ago`;
}

function Thumb({ item, className }: { item: RediscoverItem; className: string }) {
    const meta = TYPE_META[item.type] ?? TYPE_META.note;
    const Icon = meta.icon ?? Sparkles;
    const [failed, setFailed] = useState(false);
    const src = item.metadata?.thumbnail_url;
    if (src && !failed) {
        // eslint-disable-next-line @next/next/no-img-element -- remote thumbnail
        return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={`${className} object-cover`} />;
    }
    return (
        <span className={`${className} grid place-items-center bg-surface-container-high`}>
            <Icon className={`size-6 ${meta.color}`} />
        </span>
    );
}

/** One due item at a time: look at it, then "Got it" (show less often) or "Again" (show soon). */
function ReviewDialog({ items, start, onReviewed, onClose }: { items: RediscoverItem[]; start: number; onReviewed: (id: number) => void; onClose: () => void }) {
    const [queue] = useState(() => [...items.slice(start), ...items.slice(0, start)]);
    const [index, setIndex] = useState(0);
    const [busy, setBusy] = useState(false);
    const item = queue[index];

    const review = useCallback(
        async (remembered: boolean) => {
            if (!item || busy) return;
            setBusy(true);
            await reviewMemory(item.id, remembered).catch(() => undefined);
            onReviewed(item.id);
            setIndex((i) => i + 1);
            setBusy(false);
        },
        [item, busy, onReviewed],
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight" || e.key === "Enter") void review(true);
            if (e.key === "ArrowLeft") void review(false);
        };
        window.addEventListener("keydown", onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
        };
    }, [review, onClose]);

    const href = item ? sourceHref({ source_url: item.source_url, has_file: item.has_file, memoryId: item.id }) : null;
    const meta = item ? TYPE_META[item.type] : null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-on-surface/30 px-4 backdrop-blur-sm" onClick={onClose}>
            <div role="dialog" aria-modal="true" aria-label="Review" className="w-full max-w-md overflow-hidden rounded-[22px] border border-on-surface/10 bg-surface-container-lowest shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-5 pt-4">
                    <span className="text-[11px] font-semibold tracking-[0.12em] text-on-surface-variant uppercase">Review</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-on-surface/8">
                        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(Math.min(index, queue.length) / queue.length) * 100}%` }} />
                    </div>
                    <span className="text-[12px] tabular-nums text-on-surface-variant">{Math.min(index + 1, queue.length)} / {queue.length}</span>
                    <button onClick={onClose} className="rounded-lg p-1 text-on-surface-variant hover:bg-on-surface/6 hover:text-on-surface cursor-pointer" title="Close">
                        <X className="size-4" />
                    </button>
                </div>

                {item ? (
                    <div className="p-5">
                        <Thumb item={item} className="aspect-video w-full rounded-2xl" />
                        <p className="mt-4 text-[12px] text-on-surface-variant">{meta?.label} · {savedAgo(item.createdAt)}</p>
                        <h2 className="mt-1 font-headline text-[22px] leading-tight text-on-surface">{item.title}</h2>
                        {(item.summary || item.metadata?.description) && (
                            <p className="mt-2 text-[14px] leading-[1.55] text-on-surface-variant line-clamp-4">{item.summary || item.metadata?.description}</p>
                        )}
                        {href && (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline underline-offset-2">
                                Open original <ExternalLink className="size-3.5" />
                            </a>
                        )}
                        <p className="mt-5 text-[13px] text-on-surface-variant">Do you remember what this was about?</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            <button disabled={busy} onClick={() => review(false)} className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant py-3 text-[14px] font-medium hover:bg-on-surface/4 cursor-pointer disabled:opacity-60" title="Show it again soon (←)">
                                <RotateCcw className="size-4" /> Again
                            </button>
                            <button disabled={busy} onClick={() => review(true)} className="flex items-center justify-center gap-2 rounded-xl bg-primary-container py-3 text-[14px] font-medium text-white hover:bg-black cursor-pointer disabled:opacity-60" title="Show it less often (→)">
                                <Check className="size-4" /> Got it
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid place-items-center gap-2 px-5 pt-10 pb-8 text-center">
                        <span className="grid size-12 place-items-center rounded-2xl bg-tertiary-container text-primary"><Check className="size-6" /></span>
                        <p className="font-headline text-2xl">All caught up</p>
                        <p className="text-[14px] text-on-surface-variant">Brainly will bring these back when it&apos;s time for another look.</p>
                        <button onClick={onClose} className="mt-3 rounded-xl bg-primary-container px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black cursor-pointer">Done</button>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
}

function MiniCard({ item, chip, onOpen }: { item: RediscoverItem; chip: "due" | "throwback"; onOpen: () => void }) {
    const meta = TYPE_META[item.type];
    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex min-w-[260px] flex-1 snap-start items-center gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-left shadow-[0_12px_28px_-26px_rgba(60,35,20,0.6)] transition-shadow hover:shadow-[0_18px_34px_-24px_rgba(60,35,20,0.6)] cursor-pointer"
        >
            <Thumb item={item} className="size-16 flex-none rounded-xl" />
            <span className="min-w-0">
                <span className="block text-[13.5px] leading-snug font-semibold text-on-surface line-clamp-2">{item.title}</span>
                <span className="mt-1 block truncate text-[11.5px] text-on-surface-variant">{meta?.label} · {savedAgo(item.createdAt)}</span>
                <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${chip === "due" ? "bg-tertiary-container text-primary" : "bg-secondary/12 text-secondary"}`}>
                    {chip === "due" ? "Due today" : "Throwback"}
                </span>
            </span>
        </button>
    );
}

/** A slim strip above the library: memories due for spaced-repetition review, plus a forgotten throwback. */
export function RediscoverPanel() {
    const [due, setDue] = useState<RediscoverItem[]>([]);
    const [throwback, setThrowback] = useState<RediscoverItem | null>(null);
    const [reviewFrom, setReviewFrom] = useState<number | null>(null);

    useEffect(() => {
        getRediscover()
            .then((r) => {
                setDue(r.due);
                setThrowback(r.throwback);
            })
            .catch(() => undefined);
    }, []);

    const onReviewed = useCallback((id: number) => setDue((prev) => prev.filter((d) => d.id !== id)), []);

    if (due.length === 0 && !throwback && reviewFrom === null) return null;

    const shown = due.slice(0, throwback ? 2 : 3);
    const minutes = Math.max(1, Math.round(due.length * 0.4));
    const openThrowback = () => {
        if (!throwback) return;
        const href = sourceHref({ source_url: throwback.source_url, has_file: throwback.has_file, memoryId: throwback.id });
        if (href) window.open(href, "_blank", "noopener,noreferrer");
    };

    return (
        <section aria-label="Rediscover" className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0">
            <div className="flex w-[240px] flex-none snap-start flex-col justify-between gap-3 rounded-2xl bg-primary-container p-4 text-white md:w-[230px]">
                <div>
                    <p className="text-[10.5px] font-semibold tracking-[0.14em] text-white/60 uppercase">Rediscover</p>
                    <p className="mt-1.5 font-headline text-[21px] leading-[1.15]">
                        {due.length > 0 ? `${due.length} ${due.length === 1 ? "thing" : "things"} worth a second look` : "A throwback for you"}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-snug text-white/65">
                        {due.length > 0 ? "A quick review keeps them from being forgotten." : "Something you saved a while ago."}
                    </p>
                </div>
                {due.length > 0 ? (
                    <button onClick={() => setReviewFrom(0)} className="rounded-xl bg-primary px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#9c3c24] cursor-pointer">
                        Start review · {minutes} min
                    </button>
                ) : (
                    <button onClick={openThrowback} className="rounded-xl bg-white/12 px-3 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/20 cursor-pointer">
                        Open it
                    </button>
                )}
            </div>
            {shown.map((item, i) => (
                <MiniCard key={item.id} item={item} chip="due" onOpen={() => setReviewFrom(i)} />
            ))}
            {throwback && <MiniCard item={throwback} chip="throwback" onOpen={openThrowback} />}

            {reviewFrom !== null && (
                <ReviewDialog items={due} start={reviewFrom} onReviewed={onReviewed} onClose={() => setReviewFrom(null)} />
            )}
        </section>
    );
}
