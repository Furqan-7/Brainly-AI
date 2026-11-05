"use client";

/**
 * Motion pieces for the landing page: smooth scrolling (Lenis), scroll-triggered reveals,
 * hover cards with a cursor spotlight, magnetic buttons and the hero's parallax art.
 * Everything falls back to static content when the visitor prefers reduced motion.
 */

import Image from "next/image";
import Link from "next/link";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { Fragment, useEffect, useRef } from "react";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
    type Variants,
} from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Smooth scrolling + reading progress ─────────────────── */

export function SmoothScroll() {
    const reduce = useReducedMotion();
    useEffect(() => {
        if (reduce) return;
        // anchors: in-page links (#how, #pricing…) glide to their section
        const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: { offset: -24 } });
        return () => lenis.destroy();
    }, [reduce]);
    return null;
}

export function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });
    return (
        <motion.div
            aria-hidden="true"
            style={{ scaleX }}
            className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-lp-ink"
        />
    );
}

/* ── Reveals ─────────────────────────────────────────────── */

/** Fades and lifts its content in the first time it scrolls into view. */
export function Reveal({
    children,
    className = "",
    delay = 0,
    y = 28,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    y?: number;
}) {
    const reduce = useReducedMotion();
    if (reduce) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: EASE, delay }}
        >
            {children}
        </motion.div>
    );
}

const group: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item: Variants = {
    hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

/** A grid or list whose children animate in one after another. */
export function Stagger({ children, className = "", as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "dl" | "ul" }) {
    const reduce = useReducedMotion();
    const Tag = motion[as];
    if (reduce) return <Tag className={className}>{children}</Tag>;
    return (
        <Tag className={className} variants={group} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
            {children}
        </Tag>
    );
}

export function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.div className={className} variants={item}>
            {children}
        </motion.div>
    );
}

/* ── Cards ───────────────────────────────────────────────── */

/**
 * Card that rises slightly on hover and shows a soft spotlight under the cursor.
 * Use inside <Stagger> to also get the staggered entrance.
 */
export function SpotlightCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
        el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
    };

    return (
        <motion.div
            ref={ref}
            variants={item}
            onPointerMove={onMove}
            whileHover={reduce ? undefined : { y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={`group/card relative isolate overflow-hidden ${className}`}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
                style={{ background: "radial-gradient(260px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(180, 71, 43, 0.09), transparent 70%)" }}
            />
            {children}
        </motion.div>
    );
}

/* ── Buttons ─────────────────────────────────────────────── */

/** Pulls its child a few pixels toward the cursor, then springs back. */
export function Magnetic({ children, strength = 0.25, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
    const reduce = useReducedMotion();
    const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 });
    const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 });

    if (reduce) return <span className={`inline-flex ${className}`}>{children}</span>;
    return (
        <motion.span
            className={`inline-flex ${className}`}
            style={{ x, y }}
            onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                x.set((e.clientX - (r.left + r.width / 2)) * strength);
                y.set((e.clientY - (r.top + r.height / 2)) * strength);
            }}
            onPointerLeave={() => {
                x.set(0);
                y.set(0);
            }}
        >
            {children}
        </motion.span>
    );
}

/** Light sweep that crosses a dark button on hover. */
export const shine =
    "relative overflow-hidden before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-1/3 before:-translate-x-[150%] before:skew-x-[-20deg] before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-700 before:ease-out hover:before:translate-x-[400%]";

/** Arrow inside a small circle that slides on hover. */
export function ArrowChip() {
    return (
        <span
            aria-hidden="true"
            className="relative grid size-6 place-items-center overflow-hidden rounded-full bg-white/15 text-sm transition-colors duration-300 group-hover/btn:bg-white group-hover/btn:text-lp-button"
        >
            <span className="transition-transform duration-300 ease-out group-hover/btn:translate-x-[150%]">→</span>
            <span className="absolute -translate-x-[150%] transition-transform duration-300 ease-out group-hover/btn:translate-x-0">→</span>
        </span>
    );
}

const handle = "absolute size-[5px] bg-lp-handle transition-transform duration-300 ease-out";

/**
 * The paired call-to-action buttons inside a frame with four corner handles that open
 * outward on hover. `secondary` is an in-page anchor (e.g. "#how"); `primary` is a route.
 */
export function CtaPair({
    secondary,
    primary,
    className = "",
}: {
    secondary: { label: string; href: string };
    primary: { label: string; href: string };
    className?: string;
}) {
    const button = "group/btn inline-flex h-[54px] items-center gap-2.5 px-4 font-lp-body text-[clamp(15px,1.05vw,18px)] leading-none font-medium whitespace-nowrap md:px-[26px]";
    return (
        <div className={`group/cta relative flex p-1 ${className}`}>
            <i className={`${handle} top-0 left-0 group-hover/cta:-translate-x-1 group-hover/cta:-translate-y-1`} />
            <i className={`${handle} top-0 right-0 group-hover/cta:translate-x-1 group-hover/cta:-translate-y-1`} />
            <i className={`${handle} bottom-0 left-0 group-hover/cta:-translate-x-1 group-hover/cta:translate-y-1`} />
            <i className={`${handle} right-0 bottom-0 group-hover/cta:translate-x-1 group-hover/cta:translate-y-1`} />

            {/* secondary: a fill sweeps in from the left */}
            <a
                href={secondary.href}
                className={`${button} relative isolate overflow-hidden border border-r-0 border-dashed border-lp-line bg-lp-field text-lp-ink before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-lp-chip before:transition-transform before:duration-500 before:ease-out hover:before:scale-x-100`}
            >
                {secondary.label}
            </a>

            {/* primary: magnetic, with a light sweep and a sliding arrow */}
            <Magnetic strength={0.18}>
                <Link href={primary.href} className={`${button} ${shine} bg-lp-button text-white transition-colors hover:bg-black`}>
                    {primary.label}
                    <ArrowChip />
                </Link>
            </Magnetic>
        </div>
    );
}

/* ── Hero ────────────────────────────────────────────────── */

/** Robot and Adam drift in on load, then move at different speeds as the page scrolls. */
export function HeroArt() {
    const reduce = useReducedMotion();
    const { scrollY } = useScroll();
    const robotY = useTransform(scrollY, [0, 900], [0, -140]);
    const robotX = useTransform(scrollY, [0, 900], [0, 60]);
    const adamY = useTransform(scrollY, [0, 900], [0, 90]);

    const robot = (
        <Image
            src="/landing/robot.webp"
            alt=""
            width={1024}
            height={683}
            priority
            sizes="(min-width: 768px) 41vw, 78vw"
            className="h-auto w-full select-none"
        />
    );
    const adam = (
        <Image
            src="/landing/adam.webp"
            alt=""
            width={1400}
            height={767}
            priority
            sizes="(min-width: 768px) 44vw, 100vw"
            className="h-auto w-full select-none"
        />
    );

    const robotPos = "pointer-events-none absolute top-[-12vw] left-[52vw] z-0 w-[78vw] md:top-[-9vw] md:left-[69.5vw] md:w-[40.7vw]";
    const adamPos = "pointer-events-none absolute bottom-0 left-[-2vw] z-0 w-[100vw] md:left-[1.2vw] md:w-[44vw]";

    if (reduce) {
        return (
            <>
                <div className={robotPos}>{robot}</div>
                <div className={adamPos}>{adam}</div>
            </>
        );
    }
    return (
        <>
            <motion.div className={robotPos} style={{ y: robotY, x: robotX }}>
                <motion.div
                    initial={{ opacity: 0, x: 90, y: -70 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 1.4, ease: EASE, delay: 0.15 }}
                >
                    {/* a slow hover, as if floating */}
                    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}>
                        {robot}
                    </motion.div>
                </motion.div>
            </motion.div>
            <motion.div className={adamPos} style={{ y: adamY }}>
                <motion.div
                    initial={{ opacity: 0, x: -90, y: 50 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
                >
                    {adam}
                </motion.div>
            </motion.div>
        </>
    );
}

/** Headline that rises in word by word. */
export function HeroHeadline({ text, className = "" }: { text: string; className?: string }) {
    const reduce = useReducedMotion();
    if (reduce) return <h1 className={className}>{text}</h1>;
    const words = text.split(" ");
    return (
        <h1 className={className} aria-label={text}>
            {words.map((word, i) => (
                <Fragment key={i}>
                    <span aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
                        <motion.span
                            className="inline-block"
                            initial={{ y: "110%", opacity: 0 }}
                            animate={{ y: "0%", opacity: 1 }}
                            transition={{ duration: 0.9, ease: EASE, delay: 0.35 + i * 0.07 }}
                        >
                            {word}
                        </motion.span>
                    </span>
                    {i < words.length - 1 && " "}
                </Fragment>
            ))}
        </h1>
    );
}

/** Fades the rest of the hero in after the headline. */
export function HeroFade({ children, delay, className = "" }: { children: React.ReactNode; delay: number; className?: string }) {
    const reduce = useReducedMotion();
    if (reduce) return <div className={className}>{children}</div>;
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay }}
        >
            {children}
        </motion.div>
    );
}
