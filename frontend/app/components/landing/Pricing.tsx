"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionHead, Wrap } from "./ui";

// Limits mirror backend/src/lib/plans.ts
const PLANS = [
    {
        name: "Free",
        price: { month: "$0", year: "$0" },
        period: { month: "forever", year: "forever" },
        limits: [["200", "saved memories"], ["30 a day", "AI answers"], ["10 MB", "per uploaded file"], ["Unlimited", "plain searches"]],
        cta: "Start free",
        pro: false,
    },
    {
        name: "Pro",
        price: { month: "$20", year: "$16" },
        period: { month: "/ month", year: "/ month, billed yearly" },
        limits: [["5,000", "saved memories"], ["500 a day", "AI answers"], ["25 MB", "per uploaded file"], ["Unlimited", "plain searches"]],
        cta: "Go Pro",
        pro: true,
    },
] as const;

export function Pricing() {
    const [billing, setBilling] = useState<"month" | "year">("year");

    return (
        <section id="pricing" className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <SectionHead center eyebrow="Pricing" title="Start free. Upgrade when your brain fills up.">
                    <div className="inline-flex shadow-[inset_0_0_0_1px_var(--color-lp-line)]" role="group" aria-label="Billing period">
                        {(["month", "year"] as const).map((b) => (
                            <button
                                key={b}
                                type="button"
                                aria-pressed={billing === b}
                                onClick={() => setBilling(b)}
                                className={`cursor-pointer px-3.5 py-2.5 text-[13px] leading-none ${billing === b ? "bg-lp-button text-white" : "text-lp-muted"}`}
                            >
                                {b === "month" ? "Monthly" : "Yearly · save 20%"}
                            </button>
                        ))}
                    </div>
                </SectionHead>

                <div className="mx-auto grid max-w-[860px] gap-[22px] min-[900px]:grid-cols-2">
                    {PLANS.map((plan) => (
                        <div key={plan.name} className={`grid content-start gap-[18px] border bg-lp-card p-[30px] ${plan.pro ? "border-lp-ink" : "border-lp-line"}`}>
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="font-lp-display text-[2.1rem] leading-[1.04] font-normal tracking-[-0.025em]">{plan.name}</h3>
                                {plan.pro && (
                                    <span className="bg-lp-chip px-2.5 py-2 text-[13px] leading-none tracking-[0.04em] uppercase">For heavy savers</span>
                                )}
                            </div>
                            <p className="font-lp-display text-5xl leading-none">
                                {plan.price[billing]} <small className="font-lp-body text-[13px] text-lp-muted">{plan.period[billing]}</small>
                            </p>
                            <ul className="m-0 grid list-none gap-[9px] p-0 text-[15px]">
                                {plan.limits.map(([value, label]) => (
                                    <li key={label} className="grid gap-0.5 border-b border-dashed border-lp-line pb-[9px] min-[560px]:grid-cols-[7.2rem_1fr] min-[560px]:gap-3">
                                        <b className="font-normal tabular-nums">{value}</b>
                                        <span className="text-lp-muted">{label}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href="/auth/signup"
                                className={`inline-flex items-center justify-center px-[22px] py-[15px] text-base leading-none font-medium ${plan.pro
                                    ? "bg-lp-button text-white hover:bg-black"
                                    : "text-lp-ink shadow-[inset_0_0_0_1px_var(--color-lp-line)] hover:bg-lp-chip"
                                    }`}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>
            </Wrap>
        </section>
    );
}
