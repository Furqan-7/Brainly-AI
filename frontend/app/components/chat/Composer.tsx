"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, AtSign, CalendarDays, Search, SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import type { Collection, MemoryCounts, MemoryType } from "../../types/memory";
import { TYPE_META } from "../memory/typeMeta";

// ─── "/" commands ────────────────────────────────────────────────────────────

type CommandKind = "type" | "date" | "mode";

export interface Command {
    key: string;
    label: string;
    kind: CommandKind;
    types?: MemoryType[];
    days?: number;
}

/** What you can type after "/" to narrow a question. Types add up; one date range at a time. */
export const COMMANDS: Command[] = [
    { key: "instagram", label: "Instagram reels", kind: "type", types: ["reel"] },
    { key: "tiktok", label: "TikToks", kind: "type", types: ["tiktok"] },
    { key: "youtube", label: "YouTube videos", kind: "type", types: ["youtube"] },
    { key: "video", label: "All videos and reels", kind: "type", types: ["youtube", "reel", "tiktok"] },
    { key: "post", label: "Saved X posts", kind: "type", types: ["tweet"] },
    { key: "link", label: "Web pages and links", kind: "type", types: ["url"] },
    { key: "note", label: "Notes", kind: "type", types: ["note"] },
    { key: "voice", label: "Voice memos", kind: "type", types: ["audio"] },
    { key: "pdf", label: "PDFs", kind: "type", types: ["pdf"] },
    { key: "image", label: "Images", kind: "type", types: ["image"] },
    { key: "today", label: "Saved today", kind: "date", days: 1 },
    { key: "week", label: "Saved in the last 7 days", kind: "date", days: 7 },
    { key: "month", label: "Saved in the last 30 days", kind: "date", days: 30 },
    { key: "year", label: "Saved in the last year", kind: "date", days: 365 },
    { key: "find", label: "Just list matches, no AI answer", kind: "mode" },
];

const BY_KEY = new Map(COMMANDS.map((c) => [c.key, c]));

/** The filters a question is narrowed by: "/" commands plus an "@" collection */
export interface Scope {
    commands: string[];
    collectionId?: number;
}

export const EMPTY_SCOPE: Scope = { commands: [] };

export function scopeTypes(scope: Scope): MemoryType[] {
    return [...new Set(scope.commands.flatMap((k) => BY_KEY.get(k)?.types ?? []))];
}
export const scopeDays = (scope: Scope) => scope.commands.map((k) => BY_KEY.get(k)?.days).find(Boolean) ?? 0;
export const scopeFind = (scope: Scope) => scope.commands.includes("find");

export function addCommand(scope: Scope, key: string): Scope {
    const cmd = BY_KEY.get(key);
    if (!cmd || scope.commands.includes(key)) return scope;
    // A new date range replaces the old one
    const kept = cmd.kind === "date" ? scope.commands.filter((k) => BY_KEY.get(k)?.kind !== "date") : scope.commands;
    return { ...scope, commands: [...kept, key] };
}

/** Turns "/week" typed into the text (without picking it from the menu) into a filter, and removes it from the question */
export function takeCommands(text: string, scope: Scope): { text: string; scope: Scope } {
    let next = scope;
    const rest = text.replace(/(^|\s)\/([a-z]+)(?=\s|$)/gi, (match, space: string, key: string) => {
        if (!BY_KEY.has(key.toLowerCase())) return match;
        next = addCommand(next, key.toLowerCase());
        return space;
    });
    return { text: rest.replace(/\s{2,}/g, " ").trim(), scope: next };
}

/** While typing: "/week " (finished with a space) becomes a filter right away; "/we" is left alone */
function takeFinishedCommands(text: string, scope: Scope): { text: string; scope: Scope } | null {
    let next = scope;
    let changed = false;
    const rest = text.replace(/(^|\s)\/([a-z]+)(?=\s)/gi, (match, space: string, key: string) => {
        if (!BY_KEY.has(key.toLowerCase())) return match;
        next = addCommand(next, key.toLowerCase());
        changed = true;
        return space;
    });
    return changed ? { text: rest.replace(/^\s+/, "").replace(/\s{2,}/g, " "), scope: next } : null;
}

function commandCount(cmd: Command, counts: MemoryCounts | null): number | undefined {
    if (!counts) return undefined;
    if (cmd.types) return cmd.types.reduce((n, t) => n + (counts.types[t] ?? 0), 0);
    return undefined;
}

function commandIcon(cmd: Command): LucideIcon {
    if (cmd.kind === "date") return CalendarDays;
    if (cmd.kind === "mode") return Search;
    return cmd.types && cmd.types.length === 1 ? TYPE_META[cmd.types[0]].icon : TYPE_META.youtube.icon;
}

// ─── Composer ────────────────────────────────────────────────────────────────

type Trigger = { char: "/" | "@"; query: string; start: number };

/** The "/word" or "@word" being typed right before the caret, if any */
function triggerAt(text: string, caret: number): Trigger | null {
    const m = text.slice(0, caret).match(/(?:^|\s)([/@])([\w-]*)$/);
    if (!m) return null;
    return { char: m[1] as "/" | "@", query: m[2].toLowerCase(), start: caret - m[2].length - 1 };
}

type MenuItem = { id: string; label: string; hint: string; count?: number; icon?: LucideIcon; color?: string; pick: () => void };

export interface ComposerHandle {
    focus: () => void;
}

interface ComposerProps {
    value: string;
    onChange: (v: string) => void;
    scope: Scope;
    onScopeChange: (s: Scope) => void;
    onSubmit: () => void;
    busy?: boolean;
    placeholder: string;
    counts: MemoryCounts | null;
    collections: Collection[];
    collectionColor: (id: number) => string;
    /** Shown between the text and the toolbar (live matches) */
    below?: ReactNode;
    /** Bigger text and keyboard hints on the empty page */
    large?: boolean;
    /** Where the "/" and "@" menu opens: below the box near the top of the page, above it when docked at the bottom */
    menuPlacement?: "above" | "below";
}

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
    { value, onChange, scope, onScopeChange, onSubmit, busy, placeholder, counts, collections, collectionColor, below, large, menuPlacement = "above" },
    ref,
) {
    const input = useRef<HTMLTextAreaElement>(null);
    const [caret, setCaret] = useState(0);
    const [highlight, setHighlight] = useState(0);
    // Esc closes the menu for the word being typed, until the caret moves to another one
    const [dismissedAt, setDismissedAt] = useState<number | null>(null);

    useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }), []);

    // Grow with the text, up to a limit
    useEffect(() => {
        const el = input.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }, [value]);

    const trigger = triggerAt(value, caret);
    const open = trigger && trigger.start !== dismissedAt ? trigger : null;

    const replaceTrigger = (t: Trigger) => {
        const before = value.slice(0, t.start).replace(/\s+$/, "");
        const after = value.slice(caret).replace(/^\s+/, "");
        const next = before && after ? `${before} ${after}` : before || after;
        onChange(next);
        const pos = before.length + (before && after ? 1 : 0);
        requestAnimationFrame(() => {
            input.current?.focus();
            input.current?.setSelectionRange(pos, pos);
            setCaret(pos);
        });
    };

    // Rebuilt on every keystroke; the lists are short
    const items: MenuItem[] = (() => {
        if (!open) return [];
        if (open.char === "@") {
            return collections
                .filter((c) => c.name.toLowerCase().includes(open.query))
                .slice(0, 8)
                .map((c) => ({
                    id: `c${c.id}`,
                    label: c.name,
                    hint: "Collection",
                    count: c.memoryCount,
                    color: collectionColor(c.id),
                    pick: () => {
                        onScopeChange({ ...scope, collectionId: c.id });
                        replaceTrigger(open);
                    },
                }));
        }
        return COMMANDS.filter((c) => c.key.startsWith(open.query) || c.label.toLowerCase().includes(open.query))
            .filter((c) => !scope.commands.includes(c.key))
            .map((c) => ({
                id: c.key,
                label: `/${c.key}`,
                hint: c.label,
                count: commandCount(c, counts),
                icon: commandIcon(c),
                pick: () => {
                    onScopeChange(addCommand(scope, c.key));
                    replaceTrigger(open);
                },
            }));
    })();

    const active = items.length ? Math.min(highlight, items.length - 1) : 0;

    const insert = (char: "/" | "@") => {
        const el = input.current;
        const at = el?.selectionStart ?? value.length;
        const needsSpace = at > 0 && !/\s/.test(value[at - 1]);
        const next = `${value.slice(0, at)}${needsSpace ? " " : ""}${char}${value.slice(at)}`;
        const pos = at + (needsSpace ? 2 : 1);
        onChange(next);
        setDismissedAt(null);
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(pos, pos);
            setCaret(pos);
        });
    };

    const chips: { id: string; label: string; color?: string; remove: () => void }[] = [
        ...scope.commands.map((k) => ({
            id: k,
            label: k === "find" ? "Find only · no AI" : `/${k}`,
            remove: () => onScopeChange({ ...scope, commands: scope.commands.filter((x) => x !== k) }),
        })),
        ...(scope.collectionId
            ? [{
                id: "collection",
                label: collections.find((c) => c.id === scope.collectionId)?.name ?? "Collection",
                color: collectionColor(scope.collectionId),
                remove: () => onScopeChange({ ...scope, collectionId: undefined }),
            }]
            : []),
    ];

    const canSend = Boolean(value.trim() || chips.length) && !busy;

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (canSend) onSubmit();
            }}
            className="relative rounded-[22px] border border-outline-variant bg-surface-container-lowest shadow-[0_30px_60px_-40px_rgba(60,35,20,0.55),0_0_0_6px_rgba(180,71,43,0.05)] transition-[border-color,box-shadow] duration-300 focus-within:border-on-surface/35 focus-within:shadow-[0_30px_60px_-36px_rgba(60,35,20,0.6),0_0_0_6px_rgba(180,71,43,0.08)]"
        >
            {/* The "/" or "@" menu, above the box so the page doesn't jump */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key={open.char}
                        initial={{ opacity: 0, y: menuPlacement === "above" ? 6 : -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: menuPlacement === "above" ? 4 : -4, scale: 0.98, transition: { duration: 0.12 } }}
                        transition={{ type: "spring", stiffness: 520, damping: 34 }}
                        className={`absolute left-3 z-40 w-[min(360px,calc(100%-24px))] overflow-hidden ${menuPlacement === "above" ? "bottom-[calc(100%+10px)] origin-bottom-left" : "top-[calc(100%-6px)] origin-top-left"} rounded-2xl border border-outline-variant bg-surface-container-lowest p-1.5 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.35)]`}
                        role="listbox"
                        aria-label={open.char === "/" ? "Filters" : "Collections"}
                    >
                        <p className="px-2.5 pt-1.5 pb-1 text-[10.5px] font-semibold tracking-[0.12em] text-on-surface-variant uppercase">
                            {open.char === "/" ? "Narrow your question" : "Ask within a collection"}
                        </p>
                        {items.length === 0 ? (
                            <p className="px-2.5 py-2 text-[13px] text-on-surface-variant">
                                {open.char === "@" && collections.length === 0 ? "No collections yet." : "Nothing matches."}
                            </p>
                        ) : (
                            <div className="max-h-[280px] overflow-y-auto">
                                {items.map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            role="option"
                                            aria-selected={i === active}
                                            onMouseEnter={() => setHighlight(i)}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={item.pick}
                                            className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors cursor-pointer ${i === active ? "bg-surface-container" : ""}`}
                                        >
                                            {Icon ? (
                                                <Icon className="size-4 flex-none text-on-surface-variant" />
                                            ) : (
                                                <span className="size-3 flex-none rounded-[3px]" style={{ background: item.color }} />
                                            )}
                                            <span className={`w-[92px] flex-none truncate text-[13px] ${open.char === "/" ? "font-mono text-primary" : "font-medium text-on-surface"}`}>{item.label}</span>
                                            <span className="min-w-0 flex-1 truncate text-[13px] text-on-surface-variant">{open.char === "/" ? item.hint : ""}</span>
                                            {item.count !== undefined && <span className="text-[11.5px] tabular-nums text-on-surface-variant/70">{item.count}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active filters */}
            <AnimatePresence initial={false}>
                {chips.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                        <div className="flex flex-wrap gap-1.5 px-4 pt-3.5">
                            <AnimatePresence initial={false}>
                                {chips.map((c) => (
                                    <motion.button
                                        key={c.id}
                                        type="button"
                                        onClick={c.remove}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        title="Remove filter"
                                        className={`group flex items-center gap-1.5 rounded-lg bg-tertiary-container px-2 py-1 text-[12.5px] font-semibold text-primary cursor-pointer ${c.id === "collection" ? "" : "font-mono"}`}
                                    >
                                        {c.color && <span className="size-2.5 rounded-[3px]" style={{ background: c.color }} />}
                                        {c.label}
                                        <X className="size-3 opacity-60 group-hover:opacity-100" />
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <textarea
                ref={input}
                rows={1}
                value={value}
                onChange={(e) => {
                    const done = takeFinishedCommands(e.target.value, scope);
                    if (done) {
                        onScopeChange(done.scope);
                        onChange(done.text);
                        const pos = Math.max(0, e.target.selectionStart - (e.target.value.length - done.text.length));
                        requestAnimationFrame(() => input.current?.setSelectionRange(pos, pos));
                        setCaret(pos);
                    } else {
                        onChange(e.target.value);
                        setCaret(e.target.selectionStart);
                    }
                    setHighlight(0);
                }}
                onSelect={(e) => {
                    const pos = e.currentTarget.selectionStart;
                    setCaret(pos);
                    if (dismissedAt !== null && triggerAt(value, pos)?.start !== dismissedAt) setDismissedAt(null);
                }}
                onKeyDown={(e) => {
                    if (open && items.length) {
                        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                            e.preventDefault();
                            setHighlight((h) => (h + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length);
                            return;
                        }
                        if (e.key === "Enter" || e.key === "Tab") {
                            e.preventDefault();
                            items[active].pick();
                            return;
                        }
                    }
                    if (open && e.key === "Escape") {
                        e.preventDefault();
                        setDismissedAt(open.start);
                        return;
                    }
                    // Enter sends, Shift+Enter starts a new line
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        if (canSend) onSubmit();
                    }
                }}
                placeholder={placeholder}
                aria-label="Ask your brain"
                className={`block max-h-[200px] w-full resize-none bg-transparent px-4 outline-none placeholder:text-on-surface-variant/70 ${large ? "pt-4 pb-2 text-[17px] leading-[1.5]" : "pt-3 pb-1.5 text-[15.5px] leading-[1.5]"}`}
            />

            {below}

            <div className="flex items-center gap-1 px-2.5 pt-1 pb-2.5">
                <button type="button" onClick={() => insert("/")} className="flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[12.5px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface cursor-pointer" title="Filter by type, date or mode (type /)">
                    <SlidersHorizontal className="size-3.5" />
                    <span className="max-sm:sr-only">Filters</span>
                    <kbd className="rounded border border-outline-variant px-1 font-mono text-[10.5px] leading-[16px]">/</kbd>
                </button>
                <button type="button" onClick={() => insert("@")} className="flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[12.5px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface cursor-pointer" title="Ask within a collection (type @)">
                    <AtSign className="size-3.5" />
                    <span className="max-sm:sr-only">Collection</span>
                </button>
                {large && (
                    <span className="ml-auto mr-2 hidden items-center gap-1.5 text-[11.5px] text-on-surface-variant/70 sm:flex">
                        <kbd className="rounded border border-outline-variant border-b-2 px-1 font-mono text-[10.5px]">↵</kbd> {scopeFind(scope) ? "find" : "ask"}
                        <kbd className="ml-1.5 rounded border border-outline-variant border-b-2 px-1 font-mono text-[10.5px]">⇧ ↵</kbd> new line
                    </span>
                )}
                <motion.button
                    type="submit"
                    disabled={!canSend}
                    whileTap={{ scale: 0.92 }}
                    className={`grid size-10 flex-none place-items-center rounded-xl text-white transition-[background-color,box-shadow,opacity] duration-300 disabled:cursor-not-allowed ${large ? "ml-auto sm:ml-0" : "ml-auto"} ${canSend ? "bg-primary shadow-[0_8px_18px_-8px_rgba(180,71,43,0.85)] hover:bg-[#9c3c24]" : "bg-primary/35"}`}
                    title={scopeFind(scope) ? "Find (Enter)" : "Ask (Enter)"}
                >
                    {scopeFind(scope) ? <Search className="size-4" /> : <ArrowUp className="size-4" strokeWidth={2.4} />}
                </motion.button>
            </div>
        </form>
    );
});
