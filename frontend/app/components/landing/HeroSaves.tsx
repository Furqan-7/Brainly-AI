"use client";

/**
 * The saves floating in the hero's empty lower-right corner, on their way up to the robot's
 * hand along a dotted trail: the same reel, video, PDF and TikTok the rest of the page follows.
 * They fade in after the headline, then bob gently. Wide screens only (1200px+); narrower ones have no room for them.
 */

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { BrandLogo } from "./logos";

const EASE = [0.22, 1, 0.36, 1] as const;

function Card({
    className,
    rotate,
    delay,
    bob,
    children,
}: {
    className: string;
    rotate: number;
    delay: number;
    bob: number;
    children: React.ReactNode;
}) {
    const reduce = useReducedMotion();
    const card = (
        <div
            className="rounded-[14px] bg-white p-2 shadow-[0_0_0_1px_rgb(20_20_20/0.06),0_24px_44px_-22px_rgb(40_25_15/0.55)]"
            style={{ transform: `rotate(${rotate}deg)` }}
        >
            {children}
        </div>
    );
    if (reduce) return <div className={`absolute ${className}`}>{card}</div>;
    return (
        <motion.div
            className={`absolute ${className}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay }}
        >
            <motion.div animate={{ y: [0, -bob, 0] }} transition={{ duration: 5 + bob / 3, repeat: Infinity, ease: "easeInOut", delay: delay + 1 }}>
                {card}
            </motion.div>
        </motion.div>
    );
}

function Play() {
    return <i aria-hidden="true" className="ml-0.5 block size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />;
}

export function HeroSaves() {
    const reduce = useReducedMotion();
    const { scrollY } = useScroll();
    // drift up toward the robot a little as the page scrolls
    const y = useTransform(scrollY, [0, 900], [0, -70]);

    return (
        <motion.div aria-hidden="true" style={reduce ? undefined : { y }} className="pointer-events-none absolute inset-0 z-[1] hidden min-[1200px]:block">
            {/* dotted trail from the saves up to the robot's fingertip */}
            <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <motion.path
                    d="M80 86 C 84 66, 72 52, 77 32"
                    fill="none"
                    stroke="rgb(109 105 102 / 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="1 6"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 1.3 }}
                />
            </svg>

            <Card className="top-[66%] left-[70%] w-[150px]" rotate={-6} delay={1.2} bob={8}>
                <span className="block h-[86px] rounded-[9px] bg-[#23262e] p-2 text-[10px] leading-[1.15] font-bold text-white">5 projects that got me hired</span>
                <span className="mt-1.5 flex items-center gap-1.5 px-0.5 text-[11px]"><BrandLogo name="Instagram" color="#E4405F" className="size-3" />Reel · 0:58</span>
            </Card>
            <Card className="top-[74%] left-[82%] w-[180px]" rotate={5} delay={1.35} bob={6}>
                <span className="relative grid h-[70px] place-items-center rounded-[9px] bg-[#3b4a5a]">
                    <span className="grid h-[20px] w-[30px] place-items-center rounded-[6px] bg-[#FF0000]"><Play /></span>
                </span>
                <span className="mt-1.5 flex items-center gap-1.5 px-0.5 text-[11px]"><BrandLogo name="YouTube" color="#FF0000" className="size-3" />System design · 1:42:10</span>
            </Card>
            <Card className="top-[52%] left-[85%] w-[150px]" rotate={-3} delay={1.5} bob={5}>
                <span className="flex items-center gap-2 px-1 py-0.5 text-[11.5px]"><i className="size-2.5 rounded-[3px] bg-[#d4513b]" />final_v2 (3).pdf</span>
            </Card>
            <Card className="top-[45%] left-[70%] w-[140px]" rotate={4} delay={1.65} bob={7}>
                <span className="flex items-center gap-2 px-1 py-0.5 text-[11.5px]"><BrandLogo name="TikTok" className="size-3" />pasta in 60 sec</span>
            </Card>
        </motion.div>
    );
}
