"use client";

/**
 * Pricing. Each plan shows the same "Plan and usage" meters the Settings page shows, with the
 * same 182 saves in both: nearly full on Free, plenty of room on Pro. That is the headline
 * ("upgrade when your brain fills up") made literal. Underneath, everything both plans share,
 * because the backend only limits saves, daily AI answers and upload size.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SectionHead, Wrap } from "./ui";
import { ArrowChip, Magnetic, Reveal, shine, Stagger, SpotlightCard } from "./motion";
import { BrandLogo, type LogoName } from "./logos";

// Limits mirror backend/src/lib/plans.ts
const SAVED = 182; // the example library, the same on both cards
const ANSWERS_TODAY = 12;

const PLANS = [
    {
        name: "Free",
        tag: "To get started",
        price: { month: "$0", year: "$0" },
        period: { month: "forever", year: "forever" },
        maxMemories: 200,
        chatsPerDay: 30,
        maxUploadMb: 10,
        note: "Your brain is almost full",
        cta: "Start free",
        pro: false,
    },
    {
        name: "Pro",
        tag: "For heavy savers",
        price: { month: "$20", year: "$16" },
        period: { month: "/ month", year: "/ month, billed yearly" },
        maxMemories: 5000,
        chatsPerDay: 500,
        maxUploadMb: 25,
        note: "Room for years of saving",
        cta: "Go Pro",
        pro: true,
    },
] as const;

const EASE = [0.22, 1, 0.36, 1] as const;

/** The Settings page's usage meter. Turns the warning colour when nearly full. */
function Meter({ label, used, limit, seen }: { label: string; used: number; limit: number; seen: boolean }) {
    const reduce = useReducedMotion();
    const pct = Math.min(100, (used / limit) * 100);
    const full = pct >= 85;
    return (
        <div className="grid gap-1.5">
            <span className="flex items-baseline justify-between gap-3 text-[13.5px]">
                <span>{label}</span>
                <span className="text-lp-muted tabular-nums">
                    <b className={`font-medium ${full ? "text-lp-signal" : "text-lp-ink"}`}>{used.toLocaleString("en")}</b> of {limit.toLocaleString("en")}
                </span>
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-lp-field shadow-[inset_0_0_0_1px_var(--color-lp-rule)]">
                <motion.span
                    className={`block h-full rounded-full ${full ? "bg-lp-signal" : "bg-lp-ink"}`}
                    initial={false}
                    animate={{ width: seen || reduce ? `${Math.max(pct, 1.5)}%` : "0%" }}
                    transition={{ duration: reduce ? 0 : 1.1, ease: EASE, delay: 0.2 }}
                />
            </span>
        </div>
    );
}

/** What both plans get. Only the three limits above differ. */
const SOURCES: LogoName[] = ["Instagram", "YouTube", "TikTok", "X", "LinkedIn", "Notion", "GoogleDocs"];
const BRAND: Partial<Record<LogoName, string>> = {
    Instagram: "#E4405F", YouTube: "#FF0000", TikTok: "#000000", X: "#000000", LinkedIn: "#0A66C2", Notion: "#000000", GoogleDocs: "#4285F4",
};
const SHARED = [
    "All nine kinds of saves",
    "Browser extension",
    "Share from your phone",
    "Answers with sources",
    "Unlimited plain searches",
    "Collections and public links",
    "Knowledge graph",
    "Rediscover",
    "Duplicate finder",
];

export function Pricing() {
    const [billing, setBilling] = useState<"month" | "year">("year");
    const ref = useRef<HTMLDivElement>(null);
    const seen = useInView(ref, { once: true, margin: "-20% 0px -20% 0px" });

    return (
        <section id="pricing" className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <SectionHead center eyebrow="Pricing" title="Start free. Upgrade when your brain fills up.">
                    <p className="max-w-[52ch] text-[17px] leading-[1.6] text-lp-muted">
                        Every feature is on both plans. Pro just gives you more room, more AI answers a day and bigger files.
                    </p>
                    <div className="mt-1 inline-flex overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_var(--color-lp-line)]" role="group" aria-label="Billing period">
                        {(["month", "year"] as const).map((b) => (
                            <button
                                key={b}
                                type="button"
                                aria-pressed={billing === b}
                                onClick={() => setBilling(b)}
                                className={`cursor-pointer px-3.5 py-2.5 text-[13px] leading-none transition-colors duration-300 ${billing === b ? "bg-lp-button text-white" : "text-lp-muted hover:text-lp-ink"}`}
                            >
                                {b === "month" ? "Monthly" : "Yearly · save 20%"}
                            </button>
                        ))}
                    </div>
                </SectionHead>

                <div ref={ref}>
                    <Stagger className="mx-auto grid max-w-[900px] gap-5 min-[860px]:grid-cols-2">
                        {PLANS.map((plan) => (
                            <SpotlightCard
                                key={plan.name}
                                className={`grid content-start gap-6 rounded-2xl bg-lp-card p-6 transition-shadow duration-300 hover:shadow-[0_30px_60px_-40px_rgba(60,35,20,0.5)] min-[560px]:p-8 ${plan.pro ? "shadow-[inset_0_0_0_1.5px_var(--color-lp-ink)]" : "shadow-[inset_0_0_0_1px_var(--color-lp-line)]"}`}
                            >
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="font-lp-display text-[2rem] leading-none font-normal tracking-[-0.025em]">{plan.name}</h3>
                                        <span className={`rounded-md px-2.5 py-1.5 text-[11.5px] leading-none tracking-[0.05em] uppercase ${plan.pro ? "bg-lp-ink text-white" : "bg-lp-chip text-lp-ink"}`}>{plan.tag}</span>
                                    </div>
                                    <p className="font-lp-display text-[3.2rem] leading-none tracking-[-0.02em]">
                                        <span key={billing} className="inline-block animate-[lp-price_0.45s_ease-out]">{plan.price[billing]}</span>{" "}
                                        <small className="font-lp-body text-[13px] tracking-normal text-lp-muted">{plan.period[billing]}</small>
                                    </p>
                                </div>

                                {/* the Settings page's "Plan and usage" panel, with the same library on both plans */}
                                <div className="grid gap-4 rounded-[14px] bg-white p-4 shadow-[0_0_0_1px_rgb(20_20_20/0.06)] min-[560px]:p-5">
                                    <span className="flex items-center justify-between text-[11px] tracking-[0.05em] text-lp-muted uppercase">
                                        Plan and usage
                                        <span className={`normal-case tracking-normal ${plan.pro ? "text-[#2f7d4f]" : "text-lp-signal"}`}>{plan.note}</span>
                                    </span>
                                    <Meter label="Saved memories" used={SAVED} limit={plan.maxMemories} seen={seen} />
                                    <Meter label="AI answers today" used={ANSWERS_TODAY} limit={plan.chatsPerDay} seen={seen} />
                                    <span className="grid grid-cols-2 gap-2 text-[12.5px]">
                                        <span className="rounded-[10px] bg-lp-paper px-3 py-2">
                                            <b className="block text-[15px] font-medium tabular-nums">{plan.maxUploadMb} MB</b>
                                            <span className="text-lp-muted">per uploaded file</span>
                                        </span>
                                        <span className="rounded-[10px] bg-lp-paper px-3 py-2">
                                            <b className="block text-[15px] font-medium">Unlimited</b>
                                            <span className="text-lp-muted">plain searches</span>
                                        </span>
                                    </span>
                                </div>

                                {plan.pro ? (
                                    <Magnetic strength={0.12} className="w-full">
                                        <Link
                                            href="/auth/signup"
                                            className={`group/btn ${shine} inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-lp-button px-[22px] py-[15px] text-base leading-none font-medium text-white transition-colors hover:bg-black`}
                                        >
                                            {plan.cta}
                                            <ArrowChip />
                                        </Link>
                                    </Magnetic>
                                ) : (
                                    <Link
                                        href="/auth/signup"
                                        className="relative isolate inline-flex items-center justify-center overflow-hidden rounded-xl px-[22px] py-[15px] text-base leading-none font-medium text-lp-ink shadow-[inset_0_0_0_1px_var(--color-lp-line)] before:absolute before:inset-0 before:-z-10 before:origin-bottom before:scale-y-0 before:bg-lp-chip before:transition-transform before:duration-400 before:ease-out hover:before:scale-y-100"
                                    >
                                        {plan.cta}
                                    </Link>
                                )}
                            </SpotlightCard>
                        ))}
                    </Stagger>
                </div>

                {/* everything else is the same on both */}
                <Reveal className="mx-auto mt-5 grid max-w-[900px] gap-4 rounded-2xl bg-lp-field/70 p-6 shadow-[inset_0_0_0_1px_var(--color-lp-rule)] min-[560px]:p-7">
                    <span className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[13px] tracking-[0.04em] text-lp-ink uppercase">Both plans include</span>
                        <span className="flex items-center gap-3" aria-label="Saves from Instagram, YouTube, TikTok, X, LinkedIn, Notion and Google Docs">
                            {SOURCES.map((n) => <BrandLogo key={n} name={n} color={BRAND[n]} className="size-[17px]" />)}
                        </span>
                    </span>
                    <ul className="m-0 grid list-none gap-x-6 gap-y-2.5 p-0 text-[14.5px] min-[560px]:grid-cols-2 min-[860px]:grid-cols-3">
                        {SHARED.map((s) => (
                            <li key={s} className="flex items-center gap-2">
                                <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3 flex-none fill-none stroke-[#2f7d4f] stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>
                                {s}
                            </li>
                        ))}
                    </ul>
                </Reveal>
            </Wrap>
        </section>
    );
}
