import Link from "next/link";
import { Reveal } from "./motion";

/** Small grey uppercase label, like "HOW IT WORKS". */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={`inline-block rounded-md bg-lp-chip px-2.5 py-2 text-[13px] uppercase leading-none tracking-[0.04em] text-lp-ink ${className}`}>
            {children}
        </span>
    );
}

export function SectionHead({
    eyebrow,
    title,
    children,
    center = false,
}: {
    eyebrow: string;
    title: React.ReactNode;
    children?: React.ReactNode;
    center?: boolean;
}) {
    return (
        <Reveal className={`mb-14 grid max-w-[760px] gap-[18px] ${center ? "mx-auto justify-items-center text-center" : "justify-items-start"}`}>
            <Eyebrow>{eyebrow}</Eyebrow>
            <h2 className="font-lp-display text-[clamp(2.1rem,3.9vw,3.7rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">
                {title}
            </h2>
            {children}
        </Reveal>
    );
}

/** Max-width column with the page's side gutter. */
export function Wrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`mx-auto max-w-[1180px] pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))] ${className}`}>
            {children}
        </div>
    );
}

export function Logo() {
    return (
        <Link href="/" aria-label="Brainly home" className="inline-flex items-center gap-[9px] font-lp-logo text-[21px] leading-none font-bold tracking-[-0.04em] text-lp-ink">
            <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-[34px]">
                <path d="M9 5.6c2.4-1.3 4.6 1.3 7 0s4.6-1.3 7 0" />
                <path d="M5.2 10.2c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
                <path d="M3.6 15c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
                <path d="M3.6 19.8c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
                <path d="M5.2 24.6c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
                <path d="M9 29c2.4-1.3 4.6 1.3 7 0s4.6-1.3 7 0" />
            </svg>
            Brainly
        </Link>
    );
}
