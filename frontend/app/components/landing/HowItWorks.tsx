"use client";

/**
 * "How it works": one save followed through the three steps, using the same reel as the
 * sections above. 1) the browser extension saves it, 2) Brainly reads it (the checklist
 * mirrors what the backend really does: fetch, transcribe, split, summarise, tag),
 * 3) it comes back from a vague search as a finished card.
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SectionHead, Wrap } from "./ui";
import { Reveal } from "./motion";

const EASE = [0.22, 1, 0.36, 1] as const;
const REEL = "#23262e";

function Mark({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className={className}>
            <path d="M5.2 10.2c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
            <path d="M3.6 15c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
            <path d="M3.6 19.8c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
            <path d="M5.2 24.6c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
        </svg>
    );
}

function ReelThumb({ className = "", bare = false }: { className?: string; bare?: boolean }) {
    return (
        <span className={`block overflow-hidden rounded-[8px] p-1.5 text-[7.5px] leading-[1.15] font-bold text-white ${bare ? "grid place-items-center" : ""} ${className}`} style={{ background: REEL }}>
            {bare ? <svg viewBox="0 0 10 10" className="size-2.5 fill-current"><path d="M2.5 1.2l6.3 3.8-6.3 3.8z" /></svg> : "5 projects that got me hired"}
        </span>
    );
}

function Tick({ done }: { done: boolean }) {
    return (
        <span className={`grid size-[18px] flex-none place-items-center rounded-full transition-colors duration-300 ${done ? "bg-lp-ink text-white" : "border border-lp-line bg-white"}`}>
            {done ? (
                <svg viewBox="0 0 12 12" className="size-2.5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>
            ) : (
                <span className="size-2 animate-spin rounded-full border-[1.5px] border-lp-muted border-t-transparent motion-reduce:animate-none" />
            )}
        </span>
    );
}

/* ── 1. Save: the browser extension ──────────────────────── */

function SaveScene() {
    return (
        <>
            {/* browser toolbar with the extension icons */}
            <div className="absolute inset-x-0 top-0 flex items-center gap-2 border-b border-lp-rule bg-white px-3 py-2">
                <span className="flex h-[26px] min-w-0 flex-1 items-center truncate rounded-full bg-[#f1efed] px-3 text-[10.5px] text-[#555]">instagram.com/reel/C8abc_12</span>
                <span className="size-[18px] rounded-[5px] bg-[#e9e6e3]" />
                <span className="grid size-[26px] place-items-center rounded-[7px] bg-lp-ink text-white shadow-[0_0_0_3px_var(--color-lp-chip)]">
                    <Mark className="size-4" />
                </span>
            </div>

            {/* the reel playing on the page underneath */}
            <div className="absolute top-[56px] left-4 h-[260px] w-[146px] rounded-[10px] p-2.5 text-[11px] leading-[1.15] font-bold text-white" style={{ background: REEL }}>
                5 projects that got me hired
                <span className="absolute inset-x-2.5 bottom-2.5 h-[3px] rounded-full bg-white/25"><i className="block h-full w-2/5 rounded-full bg-white" /></span>
            </div>

            {/* the popup that drops down from it */}
            <div className="absolute top-[52px] right-3 left-3 grid gap-2.5 rounded-[14px] bg-white p-3 shadow-[0_0_0_1px_rgb(20_20_20/0.07),0_24px_44px_-24px_rgb(40_25_15/0.55)] min-[420px]:left-auto min-[420px]:w-[270px]">
                <span className="flex items-center justify-between text-[11.5px]">
                    <strong className="flex items-center gap-1.5 font-semibold"><Mark className="size-3.5" /> Brainly</strong>
                    <span className="text-lp-muted">Settings</span>
                </span>
                <span className="grid grid-cols-[46px_1fr] gap-2.5 rounded-[10px] bg-lp-paper p-2">
                    <ReelThumb className="h-[58px]" />
                    <span className="grid min-w-0 content-start gap-0.5">
                        <span className="flex items-center gap-1 text-[10.5px] font-medium text-[#2f7d4f]">
                            <svg viewBox="0 0 12 12" className="size-2.5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>
                            Saved to your brain
                        </span>
                        <span className="truncate text-[12px] font-semibold">5 projects that got me hired</span>
                        <span className="line-clamp-2 text-[10.5px] leading-[1.35] text-lp-muted">Five full-stack projects for a resume. The AI notes app is the one that got interviews.</span>
                    </span>
                </span>
                <span className="rounded-[9px] border border-lp-line px-2.5 py-2 text-[11px] text-lp-muted/80">Why are you saving this? (optional)</span>
                <span className="flex justify-end text-[10.5px] text-lp-muted underline underline-offset-2">Undo</span>
            </div>

        </>
    );
}

/* ── 2. Read: what happens in the background ─────────────── */

const READ_STEPS = [
    "Got the video and caption",
    "Turned 0:58 of speech into text",
    "Split it into 6 searchable parts",
    "Wrote a two-line summary",
    "Added tags",
];

function ReadScene({ seen }: { seen: boolean }) {
    const reduce = useReducedMotion();
    const [done, setDone] = useState(0);

    useEffect(() => {
        if (!seen || reduce) return;
        let n = 0;
        const id = setInterval(() => {
            n += 1;
            setDone(n);
            if (n >= READ_STEPS.length) clearInterval(id);
        }, 650);
        return () => clearInterval(id);
    }, [seen, reduce]);

    const count = reduce ? READ_STEPS.length : done;
    const finished = count >= READ_STEPS.length;

    return (
        <div className="absolute inset-3 grid content-start gap-3 rounded-[14px] bg-white p-3.5 shadow-[0_0_0_1px_rgb(20_20_20/0.07),0_24px_44px_-28px_rgb(40_25_15/0.5)]">
            <span className="grid grid-cols-[30px_1fr] items-center gap-2.5">
                <ReelThumb bare className="h-[38px]" />
                <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold">5 projects that got me hired</span>
                    <span className="block text-[10.5px] text-lp-muted">{finished ? "Ready to search" : "Reading in the background…"}</span>
                </span>
            </span>
            <ul className="m-0 grid list-none gap-[7px] p-0">
                {READ_STEPS.map((s, i) => (
                    <li key={s} className={`flex items-center gap-2 text-[11.5px] transition-opacity duration-300 ${i <= count ? "opacity-100" : "opacity-35"}`}>
                        <Tick done={i < count} />
                        {s}
                    </li>
                ))}
            </ul>
            <motion.p
                className="rounded-[9px] bg-lp-paper px-2.5 py-2 text-[10.5px] leading-[1.45] text-lp-muted"
                initial={false}
                animate={{ opacity: count >= 2 ? 1 : 0 }}
                transition={{ duration: 0.4 }}
            >
                <span className="text-lp-ink">0:32</span> “…the one that got me interviews was a notes app you can search with AI…”
            </motion.p>
            <motion.span
                className="flex flex-wrap gap-1"
                initial={false}
                animate={{ opacity: finished ? 1 : 0, y: finished ? 0 : 4 }}
                transition={{ duration: 0.4, ease: EASE }}
            >
                {["projects", "career", "web dev", "portfolio"].map((t) => (
                    <span key={t} className="rounded-full bg-lp-chip px-2 py-0.5 text-[10px] text-lp-ink">#{t}</span>
                ))}
            </motion.span>
        </div>
    );
}

/* ── 3. Ask: it comes back ───────────────────────────────── */

function AskScene() {
    return (
        <div className="absolute inset-3 grid content-start gap-3">
            <span className="flex items-center gap-2 rounded-[14px] bg-white px-3 py-2.5 text-[12px] shadow-[0_0_0_1px_rgb(20_20_20/0.07)]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 flex-none fill-none stroke-lp-muted stroke-2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>
                <span className="truncate">that reel about projects, from ages ago</span>
                <span className="ml-auto grid size-6 flex-none place-items-center rounded-[8px] bg-lp-button text-white">
                    <svg viewBox="0 0 24 24" className="size-3 fill-none stroke-current stroke-[2.4]" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                </span>
            </span>
            <span className="text-[10.5px] text-lp-muted">Best match · saved 3 months ago</span>
            <span className="grid gap-2.5 rounded-[14px] bg-white p-3 shadow-[0_0_0_1px_rgb(20_20_20/0.07),0_24px_44px_-28px_rgb(40_25_15/0.5)]">
                <span className="grid grid-cols-[54px_1fr] gap-2.5">
                    <ReelThumb className="h-[72px]" />
                    <span className="grid min-w-0 content-start gap-1">
                        <span className="truncate text-[12.5px] font-semibold">5 projects that got me hired</span>
                        <span className="text-[10.5px] text-lp-muted">Instagram reel · @code.daily</span>
                        <span className="line-clamp-2 text-[10.5px] leading-[1.4] text-lp-ink/80">Five full-stack projects for a resume. The AI notes app is the one that got interviews.</span>
                    </span>
                </span>
                <span className="flex flex-wrap items-center gap-1">
                    {["projects", "career"].map((t) => (
                        <span key={t} className="rounded-full bg-lp-chip px-2 py-0.5 text-[10px]">#{t}</span>
                    ))}
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-lp-ink px-2.5 py-1 text-[10.5px] text-white">
                        <svg viewBox="0 0 10 10" className="size-2 fill-current"><path d="M2.5 1.2l6.3 3.8-6.3 3.8z" /></svg>
                        Plays from 0:32
                    </span>
                </span>
            </span>
            {/* the walkthrough it was saved alongside, found too */}
            <span className="grid grid-cols-[54px_1fr] items-center gap-2.5 rounded-[12px] bg-white/70 p-2 pr-3 shadow-[0_0_0_1px_rgb(20_20_20/0.05)]">
                <span className="relative grid h-[34px] place-items-center rounded-[6px] bg-[#2b2f3a]">
                    <span className="grid h-[11px] w-[16px] place-items-center rounded-[3px] bg-[#e62117] text-white"><svg viewBox="0 0 10 10" className="size-[6px] fill-current"><path d="M2.5 1.2l6.3 3.8-6.3 3.8z" /></svg></span>
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-[11.5px] font-medium">Build a full-stack app in one video</span>
                    <span className="block truncate text-[10px] text-lp-muted">Related · saved 2 days later · YouTube</span>
                </span>
            </span>
        </div>
    );
}

/* ── The section ─────────────────────────────────────────── */

const STEPS = [
    {
        title: "Save it from wherever you are",
        text: "One click in the browser, the share button on your phone, or paste, drop and record in the app. No folder to pick, no tags to type.",
    },
    {
        title: "Brainly reads it for you",
        text: "It listens to the video, reads the PDF, looks at the screenshot and keeps what's inside, not just the link. All in the background.",
    },
    {
        title: "Ask, and it comes back",
        text: "Months later, describe it however you remember it. You get the exact reel, page or line, ready to play or open.",
    },
];

export function HowItWorks() {
    const ref = useRef<HTMLDivElement>(null);
    const seen = useInView(ref, { once: true, margin: "-20% 0px -20% 0px" });

    return (
        <section id="how" className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <SectionHead eyebrow="How it works" title="Save it once. Brainly does the reading.">
                    <p className="max-w-[58ch] text-[17px] leading-[1.6] text-lp-muted">
                        Here&apos;s the reel from above, from the moment you save it to the moment you need it again.
                    </p>
                </SectionHead>

                <div ref={ref} className="grid gap-5 min-[900px]:grid-cols-3 min-[900px]:gap-6">
                    {STEPS.map((step, i) => (
                        <Reveal key={step.title} delay={i * 0.12} className="min-w-0">
                            <div className="relative">
                                <div aria-hidden="true" className="relative h-[300px] overflow-hidden rounded-2xl bg-lp-field shadow-[inset_0_0_0_1px_var(--color-lp-rule)]">
                                    {i === 0 && <SaveScene />}
                                    {i === 1 && <ReadScene seen={seen} />}
                                    {i === 2 && <AskScene />}
                                </div>
                                {/* arrow to the next step */}
                                {i < 2 && (
                                    <span aria-hidden="true" className="absolute top-1/2 -right-[25px] z-10 hidden size-[26px] -translate-y-1/2 place-items-center rounded-full bg-lp-paper text-[13px] text-lp-muted shadow-[inset_0_0_0_1px_var(--color-lp-line)] min-[900px]:grid">
                                        →
                                    </span>
                                )}
                            </div>
                            <div className="grid gap-2 pt-5 pr-2">
                                <span className="flex items-center gap-2.5">
                                    <span className="grid size-6 place-items-center rounded-full bg-lp-button text-[11px] text-white">{i + 1}</span>
                                    <h3 className="font-lp-display text-[1.4rem] leading-[1.1] font-normal tracking-[-0.02em]">{step.title}</h3>
                                </span>
                                <p className="text-[15.5px] leading-[1.6] text-lp-muted">{step.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </Wrap>
        </section>
    );
}
