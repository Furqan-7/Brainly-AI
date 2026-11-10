"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, StickyNote, X } from "lucide-react";
import type { Memory } from "../../types/memory";
import { NoteMarkdown } from "./NoteMarkdown";
import { CardText, CardTitle, SourceLine } from "./cardParts";

function readingTime(text: string) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return `${words.toLocaleString()} ${words === 1 ? "word" : "words"} · ${Math.max(1, Math.round(words / 220))} min read`;
}

/** The whole note, formatted, in a window over the page. Esc or the backdrop closes it. */
function NoteReader({ memory, onClose }: { memory: Memory; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const note = memory.note ?? "";

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflow;
        };
    }, [onClose]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(note);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard blocked */
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-on-surface/25 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`note-${memory.id}-title`}
                className="flex max-h-full w-full max-w-2xl flex-col rounded-2xl border border-on-surface/10 bg-surface-container-lowest shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-start gap-3 border-b border-on-surface/8 px-6 py-4">
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            <StickyNote className="size-3 text-secondary" /> Note
                        </p>
                        <h2 id={`note-${memory.id}-title`} className="mt-1 font-headline text-2xl leading-tight text-on-surface">
                            {memory.title}
                        </h2>
                        <p className="mt-1 text-[11px] text-on-surface-variant">
                            {new Date(memory.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })} · {readingTime(note)}
                        </p>
                    </div>
                    <button onClick={copy} className="rounded-lg p-2 text-on-surface-variant hover:bg-on-surface/6 hover:text-on-surface cursor-pointer" title="Copy note">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                    <button onClick={onClose} className="rounded-lg p-2 text-on-surface-variant hover:bg-on-surface/6 hover:text-on-surface cursor-pointer" title="Close">
                        <X className="size-4" />
                    </button>
                </header>
                <div className="overflow-y-auto px-6 py-5">
                    <NoteMarkdown text={note} size="reader" />
                </div>
            </div>
        </div>,
        document.body,
    );
}

export function NoteCard({ memory }: { memory: Memory }) {
    const [open, setOpen] = useState(false);
    const [clipped, setClipped] = useState(false);
    const preview = useRef<HTMLDivElement>(null);

    // Show "Read full note" only when the note is longer than the card's preview
    useLayoutEffect(() => {
        const el = preview.current;
        if (!el) return;
        const check = () => setClipped(el.scrollHeight > el.clientHeight + 1);
        check();
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, [memory.note]);

    return (
        <CardText>
            <SourceLine memory={memory} />
            <CardTitle>{memory.title}</CardTitle>

            {memory.note && (
                <div
                    className="relative mt-1.5 cursor-pointer"
                    onClick={() => setOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(true))}
                    aria-label={`Open note: ${memory.title}`}
                >
                    <div ref={preview} className="max-h-[22rem] overflow-hidden">
                        <NoteMarkdown text={memory.note} />
                    </div>
                    {clipped && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-container-lowest to-transparent" />}
                </div>
            )}
            {clipped && (
                <button onClick={() => setOpen(true)} className="mt-2 text-[12.5px] font-semibold text-primary hover:underline underline-offset-2 cursor-pointer">
                    Read full note →
                </button>
            )}

            {open && <NoteReader memory={memory} onClose={() => setOpen(false)} />}
        </CardText>
    );
}
