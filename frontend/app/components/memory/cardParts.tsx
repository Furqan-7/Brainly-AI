"use client";

import { Play } from "lucide-react";
import type { Memory } from "../../types/memory";
import { TYPE_META } from "./typeMeta";

/** Small coloured icon + "YouTube · Edmund Yong" line at the top of a card's text */
export function SourceLine({ memory, label, detail }: { memory: Memory; label?: string; detail?: string | null }) {
    const meta = TYPE_META[memory.type] ?? TYPE_META.note;
    const Icon = meta.icon;
    return (
        <p className="mb-1.5 flex min-w-0 items-center gap-1.5 text-[12px] text-on-surface-variant">
            <span className={`grid size-4 flex-none place-items-center rounded-[5px] text-white ${meta.chip}`}>
                <Icon className="size-2.5" strokeWidth={2.5} />
            </span>
            <span className="truncate">
                {label ?? meta.label}
                {detail ? ` · ${detail}` : ""}
            </span>
        </p>
    );
}

export function CardTitle({ children, href }: { children: React.ReactNode; href?: string | null }) {
    const className = "text-[14.5px] font-semibold leading-snug text-on-surface";
    return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} block hover:underline underline-offset-2`}>
            {children}
        </a>
    ) : (
        <h3 className={className}>{children}</h3>
    );
}

export function CardSummary({ text }: { text?: string | null }) {
    if (!text) return null;
    return <p className="mt-1 text-[13px] leading-[1.5] text-on-surface-variant line-clamp-2">{text}</p>;
}

/** The padded text part of a card under its picture */
export function CardText({ children }: { children: React.ReactNode }) {
    return <div className="px-4 pt-3.5">{children}</div>;
}

/** Round play button centred on a video thumbnail */
export function PlayButton() {
    return (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="grid size-11 place-items-center rounded-full bg-on-surface/65 text-white backdrop-blur-sm transition-transform duration-300 group-hover/memory:scale-110">
                <Play className="size-4 translate-x-px fill-current" />
            </span>
        </span>
    );
}

export function Duration({ value }: { value?: string | null }) {
    if (!value) return null;
    return <span className="absolute right-2.5 bottom-2.5 rounded-md bg-on-surface/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">{value}</span>;
}

/** "Today", "3d", "2w", "Mar 4", "Mar 4, 2024" */
export function shortDate(iso: string, now = Date.now()): string {
    const date = new Date(iso);
    const days = Math.floor((now - date.getTime()) / 86_400_000);
    if (days < 1) return "Today";
    if (days < 7) return `${days}d`;
    if (days < 28) return `${Math.floor(days / 7)}w`;
    const sameYear = date.getFullYear() === new Date(now).getFullYear();
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

export function hostOf(url?: string | null): string | null {
    if (!url) return null;
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}
