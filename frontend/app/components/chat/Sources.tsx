"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, ExternalLink, FileText, FolderOpen, Mic, Play, Quote, X } from "lucide-react";
import type { Memory, Source } from "../../types/memory";
import { fileUrl, getMemoryStatuses } from "../../services/api";
import { plainText } from "../../lib/markdown";
import { NoteMarkdown } from "../memory/NoteMarkdown";
import { CardBody } from "../memory/MemoryCard";
import { TYPE_META } from "../memory/typeMeta";
import { embedUrl, sourceHref } from "./SourceCard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Accent colour per memory type, used for the small dots and number badges. */
const TYPE_COLOR: Record<string, string> = {
    pdf: "#b4472b",
    youtube: "#e62117",
    reel: "#c13584",
    tiktok: "#141414",
    tweet: "#1d9bf0",
    url: "#5f6a2e",
    image: "#d49b2a",
    note: "#8a7a6a",
    audio: "#7c5cbf",
};

const SHORT_LABEL: Record<string, string> = {
    pdf: "PDF",
    youtube: "YouTube",
    reel: "Reel",
    tiktok: "TikTok",
    tweet: "Tweet",
    url: "Link",
    image: "Image",
    note: "Note",
    audio: "Voice note",
};

const isVideo = (type: string) => type === "youtube" || type === "reel" || type === "tiktok";

export function typeColor(type: string): string {
    return TYPE_COLOR[type] ?? "#6d6966";
}

export function domainOf(url: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}

function youtubeThumb(url: string | null): string | null {
    const id = url?.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i)?.[1];
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

/** The best picture for a source: its saved thumbnail, the uploaded image, or YouTube's thumbnail. */
export function sourceThumb(source: Source): string | null {
    if (source.thumbnail) return source.thumbnail;
    if (source.type === "image" && source.has_file) return fileUrl(source.memoryId);
    if (source.type === "youtube") return youtubeThumb(source.source_url);
    return null;
}

/** A short name for a source, used on citation chips and viewer tabs. */
export function sourceLabel(source: Source): string {
    if (source.type === "url") return source.site_name || domainOf(source.source_url) || "Link";
    return SHORT_LABEL[source.type] ?? source.type;
}

/** The detail shown next to the type on a card, e.g. "12:04" for a video or the site for a link. */
function sourceDetail(source: Source): string | null {
    switch (source.type) {
        case "url":
            return domainOf(source.source_url);
        case "youtube":
            return source.duration ? `${source.duration} · plays here` : "plays here";
        case "reel":
        case "tiktok":
            return source.author ? `@${source.author.replace(/^@/, "")}` : "plays here";
        case "tweet":
            return source.author ? `@${source.author.replace(/^@/, "")}` : null;
        default:
            return source.savedAt ? `saved ${new Date(source.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : null;
    }
}

/** An <img> that disappears (showing the fallback) if the picture fails to load. */
function Thumb({ src, className, fallback = null }: { src: string | null; className: string; fallback?: React.ReactNode }) {
    const [failed, setFailed] = useState(false);
    if (!src || failed) return <>{fallback}</>;
    // Thumbnails come from many sites, so next/image's allow-list doesn't fit here
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className={className} />;
}

function TypeDot({ type }: { type: string }) {
    return <span className="inline-block size-2 flex-none rounded-[2px]" style={{ backgroundColor: typeColor(type) }} />;
}

// ─── Citation chip ───────────────────────────────────────────────────────────

/** Inline [n] citation in an answer: a pill with the source's thumbnail and a short name. */
export function CitationChip({ n, source, active, onClick }: { n: number; source?: Source; active?: boolean; onClick: () => void }) {
    const color = source ? typeColor(source.type) : "#6d6966";
    const badge = (
        <span className="grid size-[18px] flex-none place-items-center rounded-full text-[9.5px] font-bold text-white" style={{ backgroundColor: color }}>
            {n}
        </span>
    );
    return (
        <button
            type="button"
            onClick={onClick}
            title={source ? `Source ${n}: ${source.title}` : `Source ${n}`}
            className={`mx-0.5 inline-flex -translate-y-px items-center gap-1.5 rounded-full border py-px pr-2 pl-0.5 align-middle text-[12px] leading-[18px] font-medium transition-colors ${active
                ? "border-primary bg-tertiary-container text-on-surface"
                : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-on-surface"
                }`}
        >
            {source ? <Thumb src={sourceThumb(source)} className="size-[18px] flex-none rounded-full object-cover" fallback={badge} /> : badge}
            <span className="max-w-[14ch] truncate">{source ? sourceLabel(source) : `Source ${n}`}</span>
        </button>
    );
}

// ─── Source card ─────────────────────────────────────────────────────────────

function PlayBadge({ big = false }: { big?: boolean }) {
    return (
        <span className={`relative z-10 grid place-items-center rounded-[10px] bg-[#e62117] text-white shadow-lg transition-transform group-hover:scale-110 ${big ? "h-11 w-16" : "h-8 w-11"}`}>
            <Play className={big ? "size-5" : "size-4"} fill="currentColor" />
        </span>
    );
}

/** The picture area of a card, drawn differently for each kind of memory. */
function SourceMedia({ source }: { source: Source }) {
    const thumb = sourceThumb(source);

    if (isVideo(source.type)) {
        return (
            <span className="relative grid h-full place-items-center overflow-hidden bg-[#1e1e1e]">
                <Thumb src={thumb} className="absolute inset-0 size-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <PlayBadge />
                {source.duration && (
                    <span className="absolute right-2 bottom-2 z-10 rounded bg-black/80 px-1.5 py-0.5 text-[10.5px] font-medium text-white tabular-nums">{source.duration}</span>
                )}
            </span>
        );
    }

    if (source.type === "pdf") {
        // A page with the passage Brainly used, highlighted
        const text = plainText(source.passage || source.snippet);
        return (
            <span className="flex h-full justify-center overflow-hidden bg-[#efe7e0] px-3 pt-3">
                <span className="grid w-[112px] content-start gap-1 overflow-hidden bg-white p-2.5 shadow-[0_10px_24px_-14px_rgba(60,35,20,0.6)]">
                    <span className="truncate font-headline text-[9px] font-medium">{source.title}</span>
                    <span className="line-clamp-6 text-[7px] leading-[1.45] text-on-surface-variant">
                        <mark className="bg-[#f7d774] text-on-surface">{text.slice(0, 90)}</mark>
                        {text.slice(90, 400)}
                    </span>
                </span>
            </span>
        );
    }

    if (source.type === "image") {
        return (
            <span className="block h-full overflow-hidden bg-surface-container">
                <Thumb src={thumb} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </span>
        );
    }

    if (source.type === "url") {
        const domain = domainOf(source.source_url) ?? "link";
        const imageClass = "size-full object-cover object-top transition-transform duration-500 group-hover:scale-105";
        // Like the library: a screenshot of the site first, then its own preview image, then its initial
        const screenshot = source.source_url && /^https?:\/\//i.test(source.source_url) ? `/api/preview?url=${encodeURIComponent(source.source_url)}` : null;
        const initial = (
            <span className="grid size-full place-items-center">
                <span className="grid justify-items-center gap-1">
                    <span className="grid size-10 place-items-center rounded-xl bg-surface-container-lowest font-headline text-xl text-secondary">
                        {domain.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-on-secondary-fixed/70">{domain}</span>
                </span>
            </span>
        );
        return (
            <span className="block h-full overflow-hidden bg-secondary-container">
                <Thumb src={screenshot} className={imageClass} fallback={<Thumb src={thumb} className={imageClass} fallback={initial} />} />
            </span>
        );
    }

    if (source.type === "audio") {
        const bars = [8, 16, 24, 14, 28, 18, 10, 22, 30, 16, 12, 24, 18, 8, 14];
        return (
            <span className="flex h-full items-center justify-center gap-[3px] bg-[#eee8f6]">
                <span className="mr-2 grid size-9 place-items-center rounded-full bg-[#7c5cbf] text-white">
                    <Mic className="size-4" />
                </span>
                {bars.map((h, i) => (
                    <span key={i} className="w-[3px] rounded-full bg-[#7c5cbf]/60" style={{ height: h }} />
                ))}
            </span>
        );
    }

    // Tweets and notes: show the words themselves (the part that matched), not the AI summary
    const tint = source.type === "tweet" ? "bg-[#e8f4fd]" : "bg-[#f6ecc9]";
    return (
        <span className={`flex h-full items-start overflow-hidden p-3 ${tint}`}>
            <span className="line-clamp-5 text-[12px] leading-[1.5] text-on-surface/80">
                {/* Room for the number badge in the corner, so it never covers the first words */}
                <span aria-hidden="true" className="float-left mr-1 h-4 w-5" />
                {plainText(source.passage || source.snippet)}
            </span>
        </span>
    );
}

/** A source shown as a visual card. Clicking it opens the viewer. */
export function SourceTile({ source, active = false, onOpen }: { source: Source; active?: boolean; onOpen: () => void }) {
    const detail = sourceDetail(source);
    const meta = TYPE_META[source.type as keyof typeof TYPE_META];
    return (
        <motion.button
            type="button"
            onClick={onOpen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            title={`Open ${source.title}`}
            className={`group relative flex flex-col overflow-hidden rounded-[14px] border bg-surface-container-lowest text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(60,35,20,0.55)] ${active ? "border-primary shadow-[0_0_0_3px_var(--color-tertiary-container)]" : "border-outline-variant hover:border-on-surface/40"
                }`}
        >
            <span className="absolute top-2 left-2 z-20 grid size-5 place-items-center rounded-full bg-primary-container text-[10.5px] font-semibold text-white">
                {source.n}
            </span>
            <span className="block h-[120px]">
                <SourceMedia source={source} />
            </span>
            <span className="grid gap-1 px-3 pt-2.5 pb-3">
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] tracking-[0.08em] text-on-surface-variant uppercase">
                    <TypeDot type={source.type} />
                    <span className="truncate">
                        {meta?.label ?? source.type}
                        {detail && <span className="normal-case tracking-normal"> · {detail}</span>}
                    </span>
                </span>
                <span className="line-clamp-2 text-[13px] leading-snug font-semibold [overflow-wrap:anywhere] text-on-surface">{source.title}</span>
            </span>
        </motion.button>
    );
}

/** Cards for an answer's sources: the cited ones first, the rest behind "Show more". */
export function SourceShelf({ sources, activeN, onOpen, initial = 4 }: { sources: Source[]; activeN: number | null; onOpen: (n: number) => void; initial?: number }) {
    const [all, setAll] = useState(false);
    const shown = all ? sources : sources.slice(0, initial);
    return (
        <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {shown.map((source) => (
                    <SourceTile key={source.memoryId} source={source} active={activeN === source.n} onOpen={() => onOpen(source.n)} />
                ))}
            </div>
            {sources.length > initial && (
                <button type="button" onClick={() => setAll((a) => !a)} className="justify-self-start text-[12.5px] text-on-surface-variant underline decoration-outline-variant underline-offset-4 hover:text-on-surface">
                    {all ? "Show fewer sources" : `Show ${sources.length - initial} more ${sources.length - initial === 1 ? "source" : "sources"}`}
                </button>
            )}
        </div>
    );
}

// ─── Viewer ──────────────────────────────────────────────────────────────────

// Full memories already loaded for the viewer, so flipping between tabs is instant
const memoryCache = new Map<number, Memory | null>();

/** The whole memory behind a source (note text, your context, tags…). `undefined` while loading. */
function useMemoryDetails(memoryId: number): Memory | null | undefined {
    const [memory, setMemory] = useState<Memory | null | undefined>(() => memoryCache.get(memoryId));
    useEffect(() => {
        if (memoryCache.has(memoryId)) return;
        let cancelled = false;
        getMemoryStatuses([memoryId])
            .then(([found]) => {
                memoryCache.set(memoryId, found ?? null);
                if (!cancelled) setMemory(found ?? null);
            })
            .catch(() => !cancelled && setMemory(null));
        return () => {
            cancelled = true;
        };
    }, [memoryId]);
    return memory;
}

function Section({ label, icon, children, aside }: { label: string; icon?: React.ReactNode; children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <section className="grid gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[10.5px] tracking-[0.08em] text-on-surface-variant uppercase">
                    {icon}
                    {label}
                </span>
                {aside}
            </div>
            {children}
        </section>
    );
}

/** Shown in the viewer exactly as in the library (website screenshot, rich X post…) */
const LIBRARY_CARD_TYPES = new Set(["url", "tweet"]);

/** The memory's library card, without the library's hover actions. */
function LibraryCard({ memory }: { memory: Memory }) {
    return (
        <div className="overflow-hidden rounded-[18px] border border-outline-variant/60 bg-surface-container-lowest pb-1 shadow-[0_1px_2px_rgba(60,35,20,0.04),0_14px_30px_-26px_rgba(60,35,20,0.55)]">
            <CardBody memory={memory} />
        </div>
    );
}

function LibraryCardSkeleton() {
    return (
        <div className="grid gap-3 rounded-[18px] border border-outline-variant/60 bg-surface-container-lowest p-3">
            <div className="aspect-[16/10] animate-pulse rounded-[11px] bg-on-surface/5" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-on-surface/5" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-on-surface/5" />
        </div>
    );
}

/** A long passage, clamped to a few lines with "Show more". */
function Excerpt({ text, color }: { text: string; color: string }) {
    const [open, setOpen] = useState(false);
    const long = text.length > 320;
    return (
        <div className="grid gap-1.5">
            <p
                className={`border-l-2 pl-3 text-[14px] leading-[1.65] whitespace-pre-line text-on-surface ${long && !open ? "line-clamp-5" : ""}`}
                style={{ borderColor: color }}
            >
                {text}
            </p>
            {long && (
                <button type="button" onClick={() => setOpen((o) => !o)} className="justify-self-start pl-3 text-[12.5px] text-on-surface-variant underline decoration-outline-variant underline-offset-4 hover:text-on-surface">
                    {open ? "Show less" : "Show more"}
                </button>
            )}
        </div>
    );
}

/** The passage without the memory's title repeated at its start (pages often begin with their own heading). */
function withoutTitle(passage: string, title: string): string {
    const t = title.trim();
    return t && passage.toLowerCase().startsWith(t.toLowerCase()) ? passage.slice(t.length).replace(/^[\s:.\-–—|]+/, "") || passage : passage;
}

function CopyText({ text, label = "Copy" }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={() => {
                void navigator.clipboard?.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                });
            }}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
        >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : label}
        </button>
    );
}

/**
 * What the viewer says about a memory, beyond the media itself: your note in full, why you saved
 * it, the passage the answer came from, Brainly's summary, and its tags and collections.
 */
function SourceDetails({ source }: { source: Source }) {
    const memory = useMemoryDetails(source.memoryId);
    const passage = withoutTitle(plainText(source.passage || source.snippet), source.title);
    const context = typeof memory?.metadata?.context === "string" ? memory.metadata.context.trim() : "";
    const summary = (source.summary ?? memory?.summary ?? "").trim();
    const note = source.type === "note" ? memory?.note?.trim() : null;
    const savedAt = memory?.createdAt ?? source.savedAt;
    const tags = memory?.tags ?? [];
    const collections = memory?.collections ?? [];

    const libraryCard = LIBRARY_CARD_TYPES.has(source.type);
    // What the library card already shows under the title (the page's description, or the summary)
    const cardText = (memory?.metadata?.description || memory?.summary || "").trim();

    return (
        <>
            {libraryCard && (memory ? <LibraryCard memory={memory} /> : memory === undefined ? <LibraryCardSkeleton /> : <ViewerBody source={source} />)}

            {note ? (
                <Section label="Your note" aside={<CopyText text={note} />}>
                    <NoteMarkdown text={note} size="reader" />
                </Section>
            ) : (
                passage && (
                    <Section
                        label={source.type === "pdf" ? "Passage Brainly used" : source.type === "note" ? "Your note" : "The part Brainly used"}
                        aside={<CopyText text={passage} />}
                    >
                        {source.type === "note" && memory === undefined ? (
                            <p className="text-[14px] leading-[1.65] text-on-surface-variant">{passage}</p>
                        ) : (
                            <Excerpt text={passage} color={source.type === "pdf" ? "#e0b43c" : typeColor(source.type)} />
                        )}
                    </Section>
                )
            )}

            {context && (
                <Section label="Why you saved it" icon={<Quote className="size-3" />}>
                    <p className="border-l-2 border-primary/50 pl-3 text-[14.5px] leading-[1.6] text-on-surface italic">{context}</p>
                </Section>
            )}

            {summary && summary !== passage && !(libraryCard && cardText === summary) && (
                <Section label="Summary by Brainly">
                    <p className="text-[13.5px] leading-[1.65] text-on-surface-variant">{summary}</p>
                </Section>
            )}

            {(tags.length > 0 || collections.length > 0 || savedAt) && (
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-on-surface-variant">
                    {savedAt && (
                        <span className="mr-1">
                            Saved {new Date(savedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                    )}
                    {collections.map((c) => (
                        <span key={c.id} className="flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest px-2 py-0.5">
                            <FolderOpen className="size-3" /> {c.name}
                        </span>
                    ))}
                    {tags.map((t) => (
                        <span key={t} className="rounded-full bg-on-surface/[0.06] px-2 py-0.5">#{t}</span>
                    ))}
                </div>
            )}
        </>
    );
}

function ViewerBody({ source }: { source: Source }) {
    const player = embedUrl(source.type, source.source_url);
    const vertical = source.type === "reel" || source.type === "tiktok";
    const file = source.has_file ? fileUrl(source.memoryId) : null;
    const thumb = sourceThumb(source);

    if (isVideo(source.type) && player) {
        return (
            <div className="flex justify-center">
                <iframe
                    key={player}
                    src={player}
                    title={source.title}
                    className={`w-full rounded-xl border-0 bg-black ${vertical ? "max-w-[320px]" : ""}`}
                    style={{ aspectRatio: vertical ? "9/16" : "16/9" }}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            </div>
        );
    }
    if (source.type === "pdf" && file) {
        return <iframe key={file} src={`${file}#view=FitH`} title={source.title} className="min-h-[420px] w-full flex-1 rounded-lg border border-outline-variant bg-white" />;
    }
    if (source.type === "audio" && file) {
        return <audio key={file} src={file} controls className="w-full" />;
    }
    if (thumb) {
        return (
            <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                <Thumb src={thumb} className="max-h-[480px] w-full object-contain" />
            </div>
        );
    }
    return null;
}

/**
 * Side panel (full screen on phones) that opens a source: plays videos, shows the PDF or
 * image, and the passage Brainly used. Tabs switch between the answer's other sources.
 */
export function SourceViewer({ sources, activeN, onSelect, onClose }: { sources: Source[]; activeN: number | null; onSelect: (n: number) => void; onClose: () => void }) {
    const source = sources.find((s) => s.n === activeN) ?? null;

    useEffect(() => {
        if (!source) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [source, onClose]);

    const href = source ? sourceHref(source) : null;
    const detail = source ? sourceDetail(source) : null;

    return (
        <AnimatePresence>
            {source && (
                <motion.aside
                    key="viewer"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 320, damping: 36 }}
                    aria-label="Source viewer"
                    className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-outline-variant bg-surface-container-low shadow-[-30px_0_60px_-40px_rgba(60,35,20,0.5)] md:w-[480px]"
                >
                    <header className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-lowest px-5 py-4">
                        <div className="grid min-w-0 gap-1">
                            <span className="flex items-center gap-1.5 text-[10.5px] tracking-[0.08em] text-on-surface-variant uppercase">
                                <TypeDot type={source.type} />
                                Source {source.n} · {TYPE_META[source.type as keyof typeof TYPE_META]?.label ?? source.type}
                                {detail && <span className="normal-case tracking-normal">· {detail}</span>}
                            </span>
                            <h2 className="line-clamp-2 text-[15px] leading-snug font-semibold [overflow-wrap:anywhere]">{source.title}</h2>
                        </div>
                        <button type="button" onClick={onClose} title="Close" className="rounded-lg grid size-8 flex-none place-items-center border border-outline-variant bg-surface-container-lowest hover:border-on-surface">
                            <X className="size-4" />
                        </button>
                    </header>

                    {sources.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto border-b border-outline-variant px-5 py-3 [scrollbar-width:none]">
                            {sources.map((s) => (
                                <button
                                    key={s.memoryId}
                                    type="button"
                                    onClick={() => onSelect(s.n)}
                                    className={`flex flex-none items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors ${s.n === source.n
                                        ? "border-primary-container bg-primary-container text-white"
                                        : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-on-surface"
                                        }`}
                                >
                                    <span className={`grid size-4 place-items-center rounded-full text-[9.5px] font-semibold ${s.n === source.n ? "bg-white/25" : "bg-on-surface/10"}`}>{s.n}</span>
                                    <span className="max-w-[12ch] truncate">{sourceLabel(s)}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
                        {!LIBRARY_CARD_TYPES.has(source.type) && <ViewerBody source={source} />}
                        <SourceDetails key={source.memoryId} source={source} />
                        {!href && !source.snippet && !source.passage && source.type !== "note" && (
                            <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                                <FileText className="size-4" /> Nothing to preview for this memory.
                            </p>
                        )}
                    </div>

                    {href && (
                        <footer className="flex gap-2 border-t border-outline-variant bg-surface-container-lowest px-5 py-3.5">
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-xl flex items-center gap-2 bg-primary-container px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-black"
                            >
                                <ExternalLink className="size-3.5" />
                                {source.has_file && !source.source_url ? "Open file" : "Open original"}
                            </a>
                        </footer>
                    )}
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
