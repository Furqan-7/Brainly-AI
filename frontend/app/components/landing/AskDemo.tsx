"use client";

/**
 * "Ask in plain words": a working copy of Brainly's Ask screen. The three example questions
 * go after the same three things that were buried in the section above (the reel, the
 * final_v2 (3).pdf paper and the diagram screenshot). The answer types out with citation
 * pills like the real app, and the panel on the right opens whichever source is picked:
 * the reel plays with its transcript, the PDF opens on the highlighted page, the screenshot
 * shows the words Brainly read off it.
 */

import { Fragment, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SectionHead, Wrap } from "./ui";
import { Reveal } from "./motion";
import { BrandLogo } from "./logos";

/* ── Example data (labelled "Example" in the window) ─────── */

type Line = { t: string; text: string; hit?: boolean };

type Source =
    | { kind: "reel"; pill: string; title: string; meta: string; cover: string; caption: string; at: string; length: string; transcript: Line[] }
    | { kind: "video"; pill: string; title: string; meta: string; cover: string; length: string; at: string; transcript: Line[] }
    | { kind: "pdf"; pill: string; title: string; meta: string; doc: string; page: string; before: string; hit: string; after: string }
    | { kind: "note"; pill: string; title: string; meta: string; body: string[] }
    | { kind: "image"; pill: string; title: string; meta: string; read: string[] };

interface Demo {
    chip: string;
    question: string;
    meta: React.ReactNode;
    answer: string;
    sources: Source[];
}

const DEMOS: Demo[] = [
    {
        chip: "that reel about projects to get hired",
        question: "that reel with project ideas to get hired?",
        meta: <>Looked inside <b className="font-medium text-lp-ink">612 reels</b> · matched what was <b className="font-medium text-lp-ink">said</b>, not the caption</>,
        answer: "It's “5 projects that got me hired” by @code.daily, saved on 20 September [1]. At 0:32 he says the one that got him interviews was a notes app you can search with AI. Two days later you saved a walkthrough that builds that exact app [2].",
        sources: [
            {
                kind: "reel",
                pill: "@code.daily",
                title: "5 projects that got me hired",
                meta: "Instagram reel · 0:58",
                cover: "#23262e",
                caption: "5 projects that got me hired",
                at: "0:32",
                length: "0:58",
                transcript: [
                    { t: "0:18", text: "number two, a clone of any app you use every day" },
                    { t: "0:32", text: "but the one that got me interviews was a notes app you can search with AI", hit: true },
                    { t: "0:41", text: "recruiters actually opened it and played with it" },
                ],
            },
            {
                kind: "video",
                pill: "Full-stack build",
                title: "Build a full-stack app in one video",
                meta: "YouTube · 4:03:51",
                cover: "#2b2f3a",
                length: "4:03:51",
                at: "0:04:12",
                transcript: [
                    { t: "0:04:12", text: "today we're building a notes app with AI search from scratch", hit: true },
                    { t: "0:05:30", text: "first, the database for the notes" },
                ],
            },
        ],
    },
    {
        chip: "what that paper said about attention",
        question: "what did the paper I was reading say about attention heads?",
        meta: <>Read <b className="font-medium text-lp-ink">final_v2 (3).pdf</b> page by page · it&apos;s really “Attention Is All You Need”</>,
        answer: "The paper you saved as final_v2 (3).pdf is “Attention Is All You Need” [1]. On page 5 it says the model runs 8 attention heads side by side, each learning to look at the sentence in its own way, and then joins what they found. Your note from March says the diagram on page 3 is what finally made it click [2].",
        sources: [
            {
                kind: "pdf",
                pill: "final_v2 (3).pdf",
                title: "Attention Is All You Need",
                meta: "PDF · saved as final_v2 (3).pdf · 15 pages",
                doc: "3.2.2 Multi-Head Attention",
                page: "Page 5 of 15",
                before: "Instead of performing a single attention function with d-dimensional keys, values and queries, ",
                hit: "we found it beneficial to linearly project the queries, keys and values h times. In this work we employ h = 8 parallel attention layers, or heads.",
                after: " Due to the reduced dimension of each head, the total cost is similar to that of single-head attention.",
            },
            {
                kind: "note",
                pill: "Reading notes",
                title: "Reading notes: transformers",
                meta: "Your note · 14 March",
                body: ["Finally get it after the diagram on p.3.", "Each head = a different way of reading the same sentence.", "8 heads, then glued back together."],
            },
        ],
    },
    {
        chip: "the system design diagram I screenshotted",
        question: "the system design diagram I took a screenshot of",
        meta: <>Read the words <b className="font-medium text-lp-ink">inside 9,406 photos</b> · 1 diagram matched</>,
        answer: "It's a screenshot from 14 March, sitting between a receipt and a parking photo [1]. It shows an API server and a worker both writing to one Postgres database. Brainly read those labels off the image, which is how it found it. The interview video in your Watch later explains the same setup at 38:10 [2].",
        sources: [
            {
                kind: "image",
                pill: "IMG_5120",
                title: "IMG_5120.PNG",
                meta: "Screenshot · camera roll · 14 March",
                read: ["API", "Worker", "Postgres"],
            },
            {
                kind: "video",
                pill: "System design",
                title: "System design interview, full walkthrough",
                meta: "YouTube · 1:42:10",
                cover: "#3b4a5a",
                length: "1:42:10",
                at: "38:10",
                transcript: [
                    { t: "37:52", text: "so how do we stop the API from doing slow work?" },
                    { t: "38:10", text: "we hand it to a worker, and both of them talk to the same database", hit: true },
                ],
            },
        ],
    },
];

/* ── Small pieces ────────────────────────────────────────── */

const KIND_DOT: Record<Source["kind"], string> = {
    reel: "#b4472b",
    video: "#e62117",
    pdf: "#d4513b",
    note: "#c79a2e",
    image: "#4b8bd6",
};

const KIND_NAME: Record<Source["kind"], string> = {
    reel: "Reel",
    video: "Video",
    pdf: "PDF",
    note: "Note",
    image: "Screenshot",
};

/** Where a source came from: the platform's logo, or a coloured square for files and notes. */
function SourceMark({ s, className = "size-3.5" }: { s: Source; className?: string }) {
    if (s.kind === "reel") return <BrandLogo name="Instagram" color="#E4405F" className={`flex-none ${className}`} />;
    if (s.kind === "video") return <BrandLogo name="YouTube" color="#FF0000" className={`flex-none ${className}`} />;
    return <i aria-hidden="true" className="size-2 flex-none rounded-[2px]" style={{ background: KIND_DOT[s.kind] }} />;
}

function PlayGlyph({ className = "" }: { className?: string }) {
    return <svg viewBox="0 0 10 10" aria-hidden="true" className={`fill-current ${className}`}><path d="M2.5 1.2l6.3 3.8-6.3 3.8z" /></svg>;
}

/** The diagram from the camera roll, drawn bigger. `labels` marks the words Brainly read. */
function Diagram({ labels = false }: { labels?: boolean }) {
    const box = "fill-white stroke-[#3a3a3a] stroke-[1.4]";
    return (
        <svg viewBox="0 0 200 150" className="size-full" aria-hidden="true">
            <rect x="0" y="0" width="200" height="150" fill="#f5f3ef" />
            <path d="M52 52v26h48v20M148 52v26h-48" className="fill-none stroke-[#3a3a3a] stroke-[1.4]" />
            <rect x="22" y="22" width="60" height="30" rx="4" className={box} />
            <rect x="118" y="22" width="60" height="30" rx="4" className={box} />
            <rect x="66" y="98" width="68" height="32" rx="4" className={box} />
            {labels && (
                <g className="fill-[#222] text-[11px] font-medium" textAnchor="middle">
                    <text x="52" y="41">API</text>
                    <text x="148" y="41">Worker</text>
                    <text x="100" y="118">Postgres</text>
                </g>
            )}
        </svg>
    );
}

/** Small preview used in the source tiles under the answer. */
function Thumb({ s }: { s: Source }) {
    if (s.kind === "reel")
        return (
            <span className="relative block size-full p-1.5 pr-5 text-left text-[7.5px] leading-[1.15] font-bold text-white" style={{ background: s.cover }}>
                {s.caption}
            </span>
        );
    if (s.kind === "video")
        return (
            <span className="relative grid size-full place-items-center" style={{ background: s.cover }}>
                <span className="grid h-[15px] w-[21px] place-items-center rounded-[4px] bg-[#e62117] text-white"><PlayGlyph className="size-2" /></span>
                <span className="absolute right-1 bottom-1 rounded-[2px] bg-black/75 px-[3px] text-[7px] text-white">{s.length}</span>
            </span>
        );
    if (s.kind === "pdf")
        return (
            <span className="flex size-full justify-center bg-[#efe7e0] px-2 pt-2">
                <span className="grid w-full content-start gap-[3px] bg-white p-1.5 shadow-[0_6px_14px_-8px_rgb(60_35_20/0.6)]">
                    {[90, 70, 85].map((w) => <i key={w} className="block h-[2px] bg-[#ddd]" style={{ width: `${w}%` }} />)}
                    <i className="block h-[7px] w-full bg-[#f7d774]" />
                    {[80, 60].map((w) => <i key={w} className="block h-[2px] bg-[#ddd]" style={{ width: `${w}%` }} />)}
                </span>
            </span>
        );
    if (s.kind === "note")
        return (
            <span className="grid size-full content-start gap-[3px] bg-[#f7efd9] p-2">
                {[85, 95, 60, 75].map((w) => <i key={w} className="block h-[2px] bg-[#c9b98f]" style={{ width: `${w}%` }} />)}
            </span>
        );
    return <Diagram />;
}

/** "[1]" in the answer becomes a pill with the source's colour and short name, like the app. */
function Answer({ text, sources, active, onOpen }: { text: string; sources: Source[]; active: number; onOpen: (i: number) => void }) {
    return (
        <>
            {text.split(/(\[\d\])/g).map((part, i) => {
                const n = part.match(/^\[(\d)\]$/)?.[1];
                if (!n) return <Fragment key={i}>{part}</Fragment>;
                const idx = Number(n) - 1;
                const s = sources[idx];
                if (!s) return null;
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onOpen(idx)}
                        className={`mx-0.5 inline-flex -translate-y-px cursor-pointer items-center gap-1.5 rounded-full border py-px pr-2 pl-0.5 align-middle text-[12px] leading-[18px] font-medium transition-colors ${idx === active ? "border-lp-ink bg-lp-ink text-white" : "border-lp-line bg-white text-lp-ink hover:border-lp-ink"}`}
                    >
                        <span className="grid size-[18px] place-items-center rounded-full text-[9.5px] font-bold text-white" style={{ background: KIND_DOT[s.kind] }}>{n}</span>
                        <span className="max-w-[16ch] truncate">{s.pill}</span>
                    </button>
                );
            })}
        </>
    );
}

/* ── The source panel ────────────────────────────────────── */

function Transcript({ lines }: { lines: Line[] }) {
    return (
        <div className="grid gap-1.5">
            <span className="text-[10.5px] tracking-[0.06em] text-lp-muted uppercase">Transcript</span>
            {lines.map((l) => (
                <p key={l.t} className={`grid grid-cols-[3.4rem_1fr] gap-2 rounded-lg px-2 py-1.5 text-[12.5px] leading-[1.45] ${l.hit ? "bg-[#f7d774]/55 text-lp-ink" : "text-lp-muted"}`}>
                    <span className="tabular-nums">{l.t}</span>
                    <span>{l.text}</span>
                </p>
            ))}
        </div>
    );
}

function Viewer({ s }: { s: Source }) {
    const reduce = useReducedMotion();

    if (s.kind === "reel") {
        return (
            <div className="grid gap-4">
                <div className="relative mx-auto aspect-[9/16] w-full max-w-[200px] overflow-hidden rounded-2xl text-white shadow-[0_24px_40px_-26px_rgb(40_25_15/0.8)]" style={{ background: s.cover }}>
                    <span className="absolute inset-x-3 top-4 text-[17px] leading-[1.1] font-bold tracking-[-0.01em]">{s.caption}</span>
                    <ol className="absolute inset-x-3 top-[92px] m-0 grid list-none gap-1.5 p-0 text-[11.5px]">
                        {["Portfolio site", "Clone an app you use", "Notes app with AI search", "Real-time chat", "Budget dashboard"].map((t, i) => (
                            <li key={t} className={`flex items-center gap-2 rounded-md px-1.5 py-1 ${i === 2 ? "bg-white font-semibold text-[#23262e]" : "text-white/55"}`}>
                                <span className="tabular-nums">{i + 1}</span>{t}
                            </li>
                        ))}
                    </ol>
                    <span className="absolute inset-x-3 bottom-[52px] rounded-md bg-black/45 px-2 py-1.5 text-[11px] leading-[1.35]">
                        “…a notes app you can search with AI”
                    </span>
                    <span className="absolute inset-x-3 bottom-3 grid gap-1.5">
                        <span className="h-[3px] overflow-hidden rounded-full bg-white/25">
                            <motion.span
                                className="block h-full rounded-full bg-white"
                                initial={{ width: reduce ? "55%" : "48%" }}
                                animate={{ width: "62%" }}
                                transition={reduce ? { duration: 0 } : { duration: 6, ease: "linear", repeat: Infinity }}
                            />
                        </span>
                        <span className="flex items-center justify-between text-[10px] tabular-nums">
                            <span className="flex items-center gap-1"><PlayGlyph className="size-2" /> {s.at}</span>
                            <span>{s.length}</span>
                        </span>
                    </span>
                </div>
                <Transcript lines={s.transcript} />
            </div>
        );
    }

    if (s.kind === "video") {
        return (
            <div className="grid gap-4">
                <div className="relative grid aspect-video place-items-center overflow-hidden rounded-xl" style={{ background: s.cover }}>
                    <span className="grid h-10 w-14 place-items-center rounded-[10px] bg-[#e62117] text-white shadow-lg"><PlayGlyph className="size-4" /></span>
                    <span className="absolute right-2 bottom-2 rounded bg-black/80 px-1.5 py-0.5 text-[10.5px] text-white tabular-nums">{s.length}</span>
                    <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-[3px] text-[10.5px] font-medium text-lp-ink">Starts at {s.at}</span>
                </div>
                <Transcript lines={s.transcript} />
            </div>
        );
    }

    if (s.kind === "pdf") {
        return (
            <div className="grid gap-3">
                <div className="rounded-xl bg-[#efe7e0] px-4 pt-4">
                    <div className="grid gap-2 bg-white px-4 pt-4 pb-6 shadow-[0_14px_30px_-18px_rgb(60_35_20/0.6)]">
                        <span className="font-lp-display text-[13px] font-medium">{s.doc}</span>
                        <p className="text-[11px] leading-[1.6] text-lp-muted">
                            {s.before}
                            <mark className="bg-[#f7d774] text-lp-ink">{s.hit}</mark>
                            {s.after}
                        </p>
                        {[92, 88, 95, 70].map((w) => <i key={w} className="block h-[3px] rounded-full bg-[#ece8e4]" style={{ width: `${w}%` }} />)}
                    </div>
                </div>
                <span className="text-center text-[11.5px] text-lp-muted">{s.page} · opened at the highlighted lines</span>
            </div>
        );
    }

    if (s.kind === "note") {
        return (
            <div className="grid gap-2.5 rounded-xl bg-[#f7efd9] p-5 shadow-[inset_0_0_0_1px_rgb(150_120_60/0.15)]">
                {s.body.map((line) => <p key={line} className="text-[14px] leading-[1.55] text-[#3a2f1a]">{line}</p>)}
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            <div className="relative overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_var(--color-lp-rule)]">
                <Diagram labels />
                {/* boxes around the words Brainly read off the image */}
                {[
                    "left-[16%] top-[18%] w-[20%] h-[12%]",
                    "left-[63%] top-[18%] w-[22%] h-[12%]",
                    "left-[36%] top-[69%] w-[28%] h-[12%]",
                ].map((pos) => <span key={pos} className={`absolute rounded-[3px] border-2 border-dashed border-[#4b8bd6] ${pos}`} />)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-lp-muted">
                Words read from the image:
                {s.read.map((w) => <span key={w} className="rounded-full bg-[#e3eefb] px-2 py-0.5 font-medium text-[#24518a]">{w}</span>)}
            </div>
        </div>
    );
}

/* ── The section ─────────────────────────────────────────── */

export function AskDemo() {
    const [active, setActive] = useState(0);
    const [open, setOpen] = useState(0); // which source the panel shows
    const [typed, setTyped] = useState<number | null>(null); // null = show the whole answer
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    const demo = DEMOS[active];

    useEffect(() => () => {
        if (timer.current) clearInterval(timer.current);
    }, []);

    const pick = (i: number) => {
        if (timer.current) clearInterval(timer.current);
        setActive(i);
        setOpen(0);
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setTyped(null);
            return;
        }
        const length = DEMOS[i].answer.length;
        setTyped(0);
        timer.current = setInterval(() => {
            setTyped((n) => {
                const next = (n ?? 0) + 3;
                if (next >= length && timer.current) clearInterval(timer.current);
                return next >= length ? null : next;
            });
        }, 16);
    };

    // never cut a "[1]" marker in half while typing
    let shown = typed === null ? demo.answer : demo.answer.slice(0, typed);
    shown = shown.replace(/\[\d?$/, "");
    const source = demo.sources[open];

    return (
        <section id="ask" className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <SectionHead eyebrow="Ask in plain words" title="Ask for it the way you remember it.">
                    <p className="max-w-[58ch] text-[17px] leading-[1.6] text-lp-muted">
                        You won&apos;t remember the title, the creator or the file name. You&apos;ll remember &ldquo;that reel about
                        projects&rdquo;, and that&apos;s enough. Here are the same three things from above, found.
                    </p>
                </SectionHead>

                <Reveal>
                    <div className="overflow-hidden rounded-[20px] border border-lp-line bg-lp-card shadow-[0_40px_80px_-56px_rgba(60,35,20,0.6)]">
                        {/* app bar */}
                        <div className="flex items-center justify-between border-b border-lp-rule px-4 py-3 min-[560px]:px-5">
                            <span className="flex items-center gap-3">
                                <span className="hidden gap-[6px] min-[560px]:flex">
                                    {["#e2d9d3", "#e2d9d3", "#e2d9d3"].map((c, i) => <i key={i} className="size-[10px] rounded-full" style={{ background: c }} />)}
                                </span>
                                <span className="text-[13px] font-medium text-lp-ink first-letter:uppercase">{demo.question}</span>
                            </span>
                            <span className="hidden rounded-md bg-lp-chip px-2 py-1 text-[10.5px] tracking-[0.06em] text-lp-muted uppercase min-[560px]:inline">Example</span>
                        </div>

                        <div className="grid min-[900px]:grid-cols-[1fr_360px]">
                            {/* conversation */}
                            <div className="grid min-w-0 content-between gap-8 p-5 min-[560px]:p-7">
                                <div className="grid gap-5" aria-live="polite">
                                    <p className="max-w-[85%] justify-self-end rounded-[18px] rounded-br-md bg-lp-button px-4 py-2.5 text-[14.5px] text-white">{demo.question}</p>
                                    <div className="grid gap-3">
                                        <p className="flex items-center gap-2 text-[12.5px] text-lp-muted">
                                            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 flex-none fill-none stroke-current stroke-2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>
                                            <span>{demo.meta}</span>
                                        </p>
                                        <p className="min-h-[8.5em] text-[16.5px] leading-[1.75] text-lp-ink">
                                            <Answer text={shown} sources={demo.sources} active={open} onOpen={setOpen} />
                                            {typed !== null && <span className="ml-0.5 inline-block h-[1em] w-[7px] animate-lp-blink bg-lp-ink align-[-0.12em]" />}
                                        </p>
                                    </div>
                                    <div className="grid gap-2.5 min-[560px]:grid-cols-2">
                                        {demo.sources.map((s, i) => (
                                            <button
                                                key={`${active}-${s.title}`}
                                                type="button"
                                                onClick={() => setOpen(i)}
                                                aria-pressed={i === open}
                                                className={`group grid cursor-pointer grid-cols-[56px_1fr] items-center gap-3 overflow-hidden rounded-[14px] border bg-white p-1.5 pr-3 text-left transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 ${i === open ? "border-lp-ink shadow-[0_0_0_3px_var(--color-lp-chip)]" : "border-lp-line hover:border-lp-ink/50"}`}
                                            >
                                                <span className="relative block h-[56px] overflow-hidden rounded-[10px]">
                                                    <Thumb s={s} />
                                                    <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-lp-button text-[9px] font-semibold text-white shadow-[0_0_0_1.5px_white]">{i + 1}</span>
                                                </span>
                                                <span className="min-w-0">
                                                    <strong className="block truncate text-[13px] leading-[1.3] font-semibold">{s.title}</strong>
                                                    <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-lp-muted"><SourceMark s={s} className="size-3" /><span className="truncate">{s.meta}</span></span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* the ask box, with the example questions as suggestions */}
                                <div className="grid gap-3">
                                    <div className="flex flex-wrap gap-2" role="group" aria-label="Example questions">
                                        {DEMOS.map((d, i) => (
                                            <button
                                                key={d.chip}
                                                type="button"
                                                aria-pressed={i === active}
                                                onClick={() => pick(i)}
                                                className={`cursor-pointer rounded-full border px-3.5 py-2 text-[13px] transition-colors ${i === active ? "border-lp-ink bg-lp-ink text-white" : "border-lp-line bg-white/70 text-lp-muted hover:border-lp-ink/50 hover:text-lp-ink"}`}
                                            >
                                                {d.chip}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid gap-1 rounded-[20px] border border-lp-line bg-white p-2.5 shadow-[0_18px_40px_-28px_rgba(60,35,20,0.55)]">
                                        <span className="px-2 pt-1.5 pb-1 text-[15px] text-lp-muted/80">Ask a follow-up, e.g. &ldquo;show me more like that&rdquo;</span>
                                        <span className="flex items-center gap-2">
                                            <span className="flex rounded-[10px] bg-lp-field p-[3px] text-[12px]">
                                                <span className="rounded-lg bg-white px-2.5 py-1 font-medium text-lp-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]">Ask</span>
                                                <span className="px-2.5 py-1 text-lp-muted">Search</span>
                                            </span>
                                            <span className="ml-auto grid size-9 place-items-center rounded-xl bg-lp-button text-white" aria-hidden="true">
                                                <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* source panel */}
                            <aside className="grid content-start gap-4 border-t border-lp-rule bg-lp-field/60 p-5 min-[560px]:p-6 min-[900px]:border-t-0 min-[900px]:border-l">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="min-w-0">
                                        <span className="flex items-center gap-1.5 text-[10.5px] tracking-[0.06em] text-lp-muted uppercase">
                                            <SourceMark s={source} />
                                            Source {open + 1} · {KIND_NAME[source.kind]}
                                        </span>
                                        <strong className="mt-1 block truncate text-[14.5px] font-semibold">{source.title}</strong>
                                    </span>
                                    <span className="flex-none rounded-full border border-lp-line bg-white px-2.5 py-1 text-[11.5px] text-lp-muted">Open original ↗</span>
                                </div>
                                <motion.div
                                    key={`${active}-${open}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <Viewer s={source} />
                                </motion.div>
                            </aside>
                        </div>
                    </div>
                </Reveal>
            </Wrap>
        </section>
    );
}
