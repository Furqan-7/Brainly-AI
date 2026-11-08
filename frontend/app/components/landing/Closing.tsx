"use client";

/**
 * The closing call to action bookends the hero: the human hand and the robot hand reach for
 * each other, and above the spot where they meet sits a search bar that types the questions
 * from the Ask demo. "Your memory, with a search bar", literally.
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Eyebrow } from "./ui";
import { CtaPair, Reveal } from "./motion";

const QUERIES = [
    "that reel with project ideas to get hired",
    "what the paper said about attention heads",
    "the system design diagram I screenshotted",
    "pasta videos I saved last month",
];

/** Types each query, holds it, deletes it, moves on. Static first query with reduced motion. */
function useTyping(reduce: boolean) {
    const [state, setState] = useState({ q: 0, n: 0, deleting: false });

    useEffect(() => {
        if (reduce) return;
        const full = QUERIES[state.q];
        const done = state.n === full.length;
        const delay = state.deleting ? 22 : done ? 1700 : 55;
        const id = setTimeout(() => {
            setState((s) => {
                if (!s.deleting && s.n < full.length) return { ...s, n: s.n + 1 };
                if (!s.deleting) return { ...s, deleting: true };
                if (s.n > 0) return { ...s, n: s.n - 1 };
                return { q: (s.q + 1) % QUERIES.length, n: 0, deleting: false };
            });
        }, delay);
        return () => clearTimeout(id);
    }, [state, reduce]);

    return reduce ? QUERIES[0] : QUERIES[state.q].slice(0, state.n);
}

export function Closing() {
    const reduce = !!useReducedMotion();
    const text = useTyping(reduce);

    return (
        <section id="start" className="scroll-mt-6 border-t border-lp-rule pt-[110px] pb-[120px]">
            <div className="mx-auto max-w-[1180px] pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]">
                <Reveal className="grid justify-items-center text-center">
                    <Eyebrow>Free to start</Eyebrow>
                    <h2 className="mt-[22px] max-w-[14ch] font-lp-display text-[clamp(2.4rem,4.2vw,4.2rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">
                        Your memory, with a search bar.
                    </h2>
                </Reveal>

                <Reveal delay={0.1} className="relative mx-auto mt-10 aspect-[3/2] max-w-[980px] overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1px_var(--color-lp-rule),0_40px_80px_-60px_rgba(60,35,20,0.6)] min-[700px]:aspect-[16/9]">
                    <Image
                        src="/art/hands.webp"
                        alt="A human hand and a robot hand reaching for each other on a cracked fresco wall"
                        fill
                        sizes="(min-width: 1020px) 980px, 100vw"
                        className="object-cover object-[50%_70%]"
                    />

                    {/* a dotted thread from the search bar down to where the fingertips meet */}
                    <span aria-hidden="true" className="absolute top-[30%] left-1/2 h-[21%] w-[1.5px] -translate-x-1/2 bg-[linear-gradient(to_bottom,rgb(20_20_20/0.55)_50%,transparent_50%)] bg-[length:1.5px_6px] min-[700px]:top-[22%] min-[700px]:h-[26%]" />

                    {/* the search bar */}
                    <div className="absolute top-[9%] left-1/2 flex w-[88%] max-w-[520px] -translate-x-1/2 items-center gap-2.5 rounded-[18px] bg-white/95 p-2 pl-4 shadow-[0_0_0_1px_rgb(20_20_20/0.08),0_24px_50px_-24px_rgb(40_25_15/0.6)] backdrop-blur min-[700px]:top-[11%] min-[700px]:p-2.5 min-[700px]:pl-5">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 flex-none fill-none stroke-lp-muted stroke-2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>
                        <span className="min-w-0 flex-1 truncate text-left text-[13.5px] text-lp-ink min-[700px]:text-[16px]" aria-label={`Example question: ${QUERIES[0]}`}>
                            {text}
                            <span aria-hidden="true" className="ml-px inline-block h-[1.05em] w-[1.5px] animate-lp-blink bg-lp-ink align-[-0.15em] motion-reduce:animate-none" />
                        </span>
                        <span aria-hidden="true" className="grid size-8 flex-none place-items-center rounded-[11px] bg-lp-button text-white min-[700px]:size-9">
                            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                        </span>
                    </div>
                </Reveal>

                <Reveal delay={0.15} className="mt-10 grid justify-items-center gap-4 text-center">
                    <CtaPair
                        secondary={{ label: "Try the demo", href: "#ask" }}
                        primary={{ label: "Create your brain", href: "/auth/signup" }}
                    />
                    <p className="text-[14px] text-lp-muted">Free forever for your first 200 saves · no card needed</p>
                </Reveal>
            </div>
        </section>
    );
}
