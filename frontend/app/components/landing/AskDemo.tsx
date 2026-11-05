"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { SectionHead, Wrap } from "./ui";
import { Reveal } from "./motion";

interface DemoSource {
    kind: string;
    title: string;
    sub: string;
    watch?: boolean;
}

interface Demo {
    question: string;
    hint: string;
    meta: React.ReactNode;
    answer: string;
    sources: DemoSource[];
}

// Example data, clearly labelled "Example" in the window bar
const DEMOS: Demo[] = [
    {
        question: "that reel about project ideas I saved?",
        hint: "Finds an Instagram reel from a vague memory",
        meta: <>Searched your saves for <b className="font-normal text-lp-ink">project ideas</b></>,
        answer: "You saved it on 20 September: “Project ideas” by @code.daily [1]. It lists five full-stack projects for a resume, starting with a notes app you can search with AI. Two days later you saved a YouTube walkthrough that builds that first one step by step [2].",
        sources: [
            { kind: "Instagram reel", title: "Project ideas", sub: "instagram.com/reel/C8abc_12 · @code.daily", watch: true },
            { kind: "YouTube", title: "Build a RAG app from scratch", sub: "youtube.com · 12:04", watch: true },
        ],
    },
    {
        question: "what did the transformer paper say about attention heads?",
        hint: "Answers from inside a PDF",
        meta: <>Searched your saves for <b className="font-normal text-lp-ink">attention heads</b></>,
        answer: "Your PDF explains that the model runs 8 attention heads in parallel, each looking at the sentence in a different way, and joins their results [1]. Your note from March adds that you found the diagram on page 4 the clearest part [2].",
        sources: [
            { kind: "PDF", title: "attention-is-all-you-need.pdf", sub: "Uploaded file · 15 pages" },
            { kind: "Note", title: "Reading notes: transformers", sub: "Your note · 14 March" },
        ],
    },
    {
        question: "pasta videos I saved last month",
        hint: "Understands \"videos\" and \"last month\" as filters",
        meta: <>Filtered to <b className="font-normal text-lp-ink">videos</b> saved <b className="font-normal text-lp-ink">last month</b></>,
        answer: "You saved two. A 60-second TikTok for tomato and basil pasta [1], and a reel showing how to make the sauce silky with a splash of pasta water [2].",
        sources: [
            { kind: "TikTok", title: "Pasta in 60 seconds", sub: "tiktok.com/@chef · 0:58", watch: true },
            { kind: "Instagram reel", title: "Silky tomato sauce", sub: "instagram.com/reel/Cx9… · @homecook", watch: true },
        ],
    },
];

/** Renders "[1]" markers as small numbered citation chips. */
function WithCitations({ text }: { text: string }) {
    return (
        <>
            {text.split(/(\[\d\])/g).map((part, i) => {
                const n = part.match(/^\[(\d)\]$/)?.[1];
                return n ? (
                    <span key={i} className="mx-0.5 inline-flex h-[1.35em] min-w-[1.35em] items-center justify-center bg-lp-signal px-[3px] align-[0.15em] text-[11px] text-white">
                        {n}
                    </span>
                ) : (
                    <Fragment key={i}>{part}</Fragment>
                );
            })}
        </>
    );
}

function SourceRow({ source, n }: { source: DemoSource; n: number }) {
    const [playing, setPlaying] = useState(false);
    return (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 bg-lp-paper px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--color-lp-rule)] min-[560px]:grid-cols-[auto_auto_1fr_auto]">
            <span className="grid size-5 place-items-center bg-lp-button text-[11px] text-white">{n}</span>
            <span aria-hidden="true" className="hidden size-[38px] bg-lp-chip bg-[radial-gradient(rgb(20_20_20/0.45)_1px,transparent_1.4px)] bg-[length:5px_5px] min-[560px]:block" />
            <span className="min-w-0">
                <strong className="block truncate text-[13.5px] leading-[1.3] font-semibold">{source.title}</strong>
                <span className="block truncate text-[11.5px] text-lp-muted">{source.kind} · {source.sub}</span>
            </span>
            {source.watch ? (
                <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="group/btn relative cursor-pointer overflow-hidden bg-lp-button px-[11px] py-2 text-[12.5px] leading-none font-medium text-white transition-transform duration-200 hover:bg-black active:scale-95"
                >
                    {playing ? "Hide" : "Watch"}
                </button>
            ) : (
                <span />
            )}
            {playing && (
                <div className="col-span-full grid aspect-[9/16] w-[180px] max-w-full place-items-center justify-self-center bg-lp-button p-3.5 text-center text-[11.5px] text-white">
                    In Brainly, the video plays right here.
                </div>
            )}
        </div>
    );
}

/** "Ask in plain words" section: pick a question and watch the answer type out with its sources. */
export function AskDemo() {
    const [active, setActive] = useState(0);
    const [typed, setTyped] = useState<number | null>(null); // null = show the whole answer
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);
    const demo = DEMOS[active];

    useEffect(() => () => {
        if (timer.current) clearInterval(timer.current);
    }, []);

    const pick = (i: number) => {
        if (timer.current) clearInterval(timer.current);
        setActive(i);
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
        }, 18);
    };

    const shown = typed === null ? demo.answer : demo.answer.slice(0, typed);

    return (
        <section id="ask" className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <SectionHead eyebrow="Ask in plain words" title="Ask for it the way you remember it.">
                    <p className="max-w-[58ch] text-[17px] leading-[1.6] text-lp-muted">
                        You won&apos;t remember the title or the creator. You&apos;ll remember &quot;that reel about project ideas&quot;. Brainly answers from your own saves, names its sources, and plays the video right in the answer.
                    </p>
                </SectionHead>

                <div className="grid items-start gap-10 min-[900px]:grid-cols-[0.9fr_1.1fr] min-[900px]:gap-14">
                    <Reveal>
                        <div className="grid gap-2.5" role="group" aria-label="Example questions">
                            {DEMOS.map((d, i) => (
                                <button
                                    key={d.question}
                                    type="button"
                                    aria-pressed={i === active}
                                    onClick={() => pick(i)}
                                    className={`cursor-pointer px-[17px] py-[15px] text-left text-[15.5px] leading-[1.45] transition-all duration-300 hover:translate-x-1 ${i === active
                                        ? "bg-lp-card text-lp-ink shadow-[inset_0_0_0_1px_var(--color-lp-ink)]"
                                        : "text-lp-muted shadow-[inset_0_0_0_1px_var(--color-lp-line)] hover:bg-lp-chip/50"
                                        }`}
                                >
                                    {d.question}
                                    <small className="mt-[5px] block text-xs text-lp-muted">{d.hint}</small>
                                </button>
                            ))}
                        </div>
                    </Reveal>

                    <Reveal delay={0.15} className="min-w-0">
                        <div className="min-w-0 border border-lp-line bg-lp-card shadow-[0_30px_60px_-42px_rgba(60,35,20,0.45)]" aria-live="polite">
                            <div className="flex justify-between border-b border-lp-rule px-[15px] py-[11px] text-[11.5px] tracking-[0.06em] text-lp-muted uppercase">
                                <span>Brainly · Ask AI</span>
                                <span>Example</span>
                            </div>
                            <div className="grid gap-[18px] p-[22px]">
                                <p className="max-w-[85%] justify-self-end bg-lp-button px-3.5 py-[11px] text-sm text-white">{demo.question}</p>
                                <p className="text-xs text-lp-muted">{demo.meta}</p>
                                <p className="min-h-[7.5em] text-base leading-[1.7]">
                                    <WithCitations text={shown} />
                                    {typed !== null && (
                                        <span className="inline-block h-[1em] w-[7px] animate-lp-blink bg-lp-ink align-[-0.12em]" />
                                    )}
                                </p>
                                <div className="grid gap-2">
                                    <span className="text-[11px] tracking-[0.06em] text-lp-muted uppercase">Sources from your brain</span>
                                    {demo.sources.map((s, i) => (
                                        <SourceRow key={`${active}-${s.title}`} source={s} n={i + 1} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </Wrap>
        </section>
    );
}
