"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
    Copy,
    FolderOpen,
    Library,
    Loader2,
    LogOut,
    Menu,
    Network,
    Plus,
    Settings,
    Sparkles,
    Trash2,
    X,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { deleteConversation, getCollections, getConversations, logout } from "@/app/services/api";
import type { Collection, ConversationSummary, Me } from "@/app/types/memory";
import AddContent from "@/app/components/AddContent";
import { Logo } from "@/app/components/landing/ui";
import { shine } from "@/app/components/landing/motion";

/** Fired after a memory is added, so pages showing memories can refresh. */
export const MEMORIES_CHANGED = "brainly:memories-changed";

/** Fired by the sidebar's New chat, so the Ask page clears the current conversation. */
export const NEW_CHAT = "brainly:new-chat";

type SharedContent = { url?: string; title?: string; text?: string };

interface Shell {
    me: Me | null;
    refreshMe: () => Promise<void>;
    collections: Collection[];
    reloadCollections: () => void;
    openAddContent: (initial?: SharedContent) => void;
    /** Past conversations for the sidebar, newest first */
    chats: ConversationSummary[];
    reloadChats: () => void;
    /** Shows the faint collage art at the page's edges (the Ask page turns it on mid-chat) */
    setDecor: (on: boolean) => void;
}

const ShellContext = createContext<Shell | null>(null);

export function useShell(): Shell {
    const shell = useContext(ShellContext);
    if (!shell) throw new Error("useShell must be used inside <AppShell>");
    return shell;
}

const NAV: { href: string; label: string; icon: LucideIcon; hint: string }[] = [
    { href: "/chat", label: "Ask", icon: Sparkles, hint: "Ask your brain anything" },
    { href: "/library", label: "Library", icon: Library, hint: "Everything you've saved" },
    { href: "/collections", label: "Collections", icon: FolderOpen, hint: "Boards you can share" },
    { href: "/graph", label: "Knowledge graph", icon: Network, hint: "How your saves connect" },
    { href: "/duplicates", label: "Duplicates", icon: Copy, hint: "Tidy up repeats" },
    { href: "/settings", label: "Settings", icon: Settings, hint: "Account, plan, extension" },
];

/** Pulls a shared page from the PWA share sheet (?share_url / ?share_text / ?share_title). */
function readSharedContent(): SharedContent | undefined {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    const text = params.get("share_text") ?? undefined;
    // Android often puts the link inside the text instead of the url field
    const url = params.get("share_url") ?? text?.match(/https?:\/\/\S+/)?.[0];
    const title = params.get("share_title") ?? undefined;
    if (!url && !text) return undefined;
    return { url, title, text };
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
    const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    return (
        <div className="grid gap-1">
            <div className="flex justify-between text-[11px] text-on-surface-variant">
                <span>{label}</span>
                <span className="tabular-nums">{used} / {limit}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-on-surface/10">
                <div className={`h-full rounded-full ${pct > 90 ? "bg-error" : pct > 75 ? "bg-amber-500" : "bg-on-surface"}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

const DAY = 24 * 60 * 60 * 1000;

/** Groups chats into Today / Yesterday / Previous 7 days / Older. */
function groupChats(chats: ConversationSummary[]): { label: string; items: ConversationSummary[] }[] {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const groups = [
        { label: "Today", after: startOfToday },
        { label: "Yesterday", after: startOfToday - DAY },
        { label: "Previous 7 days", after: startOfToday - 7 * DAY },
        { label: "Older", after: -Infinity },
    ].map((g) => ({ ...g, items: [] as ConversationSummary[] }));
    for (const chat of chats) {
        const time = new Date(chat.updatedAt).getTime();
        groups.find((g) => time >= g.after)!.items.push(chat);
    }
    return groups.filter((g) => g.items.length > 0);
}

/** One row in the Chats list. New chat uses the same row so the two look alike. */
const chatRow = (active: boolean) =>
    `group/row flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] transition-colors ${active
        ? "bg-surface-container-high font-medium text-on-surface"
        : "text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface"
    }`;

const VISIBLE_CHATS = 8;

function ChatsNav({ onNavigate }: { onNavigate?: () => void }) {
    const { chats, reloadChats } = useShell();
    const pathname = usePathname();
    const params = useSearchParams();
    const router = useRouter();
    const [showAll, setShowAll] = useState(false);
    const openId = pathname === "/chat" ? Number(params.get("c")) || null : null;
    const shown = showAll ? chats : chats.slice(0, VISIBLE_CHATS);

    const newChat = () => {
        window.dispatchEvent(new Event(NEW_CHAT));
        onNavigate?.();
    };

    const remove = async (chat: ConversationSummary) => {
        if (!window.confirm(`Delete "${chat.title}"?`)) return;
        await deleteConversation(chat.id).catch(() => undefined);
        reloadChats();
        if (openId === chat.id) router.replace("/chat");
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <span className="px-3 text-[11px] tracking-[0.08em] text-on-surface-variant uppercase">Chats</span>
            <div className="-mx-1 grid min-h-0 content-start gap-px overflow-y-auto px-1 [scrollbar-width:thin]">
                <Link href="/chat" onClick={newChat} className={chatRow(false)}>
                    <Plus className="size-4 flex-none" />
                    New chat
                </Link>
                {groupChats(shown).map((group) => (
                    <div key={group.label} className="grid gap-px">
                        <span className="px-3 pt-2.5 pb-1 text-[10.5px] tracking-[0.06em] text-on-surface-variant/70 uppercase">{group.label}</span>
                        {group.items.map((chat) => (
                            <div key={chat.id} className="group/item relative">
                                <Link
                                    href={`/chat?c=${chat.id}`}
                                    onClick={onNavigate}
                                    title={chat.title}
                                    aria-current={openId === chat.id ? "page" : undefined}
                                    className={`${chatRow(openId === chat.id)} pr-8`}
                                >
                                    <span className="truncate">{chat.title}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => remove(chat)}
                                    title="Delete chat"
                                    className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded text-on-surface-variant opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-error focus-visible:opacity-100"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                ))}
                {chats.length > VISIBLE_CHATS && (
                    <button type="button" onClick={() => setShowAll((v) => !v)} className={chatRow(false)}>
                        {showAll ? "Show fewer" : `See all chats (${chats.length})`}
                    </button>
                )}
            </div>
        </div>
    );
}

function Sidebar({ me, onAdd, onNavigate }: { me: Me | null; onAdd: () => void; onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();

    const signOut = async () => {
        await logout().catch(() => undefined);
        router.push("/");
    };

    return (
        <div className="flex h-full flex-col gap-5 px-4 py-6">
            <div className="px-2">
                <Logo />
            </div>

            <button
                type="button"
                onClick={onAdd}
                className={`group/btn ${shine} flex items-center justify-center gap-2 bg-primary-container px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-black`}
            >
                <Plus className="size-4 transition-transform duration-300 group-hover/btn:rotate-90" />
                Add memory
            </button>

            <nav aria-label="App" className="grid gap-0.5">
                {NAV.map(({ href, label, icon: Icon, hint }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onNavigate}
                            title={hint}
                            aria-current={active ? "page" : undefined}
                            className={`group relative flex items-center gap-3 px-3 py-2.5 text-[15px] transition-colors ${active ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
                        >
                            {active && (
                                <motion.span
                                    layoutId="nav-active"
                                    className="absolute inset-0 -z-10 bg-surface-container-high shadow-[inset_2px_0_0_var(--color-primary)]"
                                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                />
                            )}
                            <Icon className="size-[18px] transition-transform duration-300 group-hover:scale-110" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <Suspense fallback={<div className="flex-1" />}>
                <ChatsNav onNavigate={onNavigate} />
            </Suspense>

            <div className="mt-auto grid gap-4 border-t border-outline-variant pt-5">
                {me && (
                    <div className="grid gap-3 px-1">
                        <UsageBar label="Memories" used={me.usage.memoryCount} limit={me.plan.maxMemories} />
                        <UsageBar label="AI answers today" used={me.usage.chatsToday} limit={me.plan.chatsPerDay} />
                    </div>
                )}
                <div className="flex items-center gap-3 px-1">
                    <span className="grid size-9 flex-none place-items-center rounded-full bg-primary-container font-headline text-base text-white">
                        {me?.user.username.slice(0, 1).toUpperCase() ?? "·"}
                    </span>
                    <Link href="/settings" onClick={onNavigate} className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{me?.user.username}</span>
                        <span className="block truncate text-xs text-on-surface-variant">
                            {me?.plan.name === "premium" ? "Pro plan" : "Free plan"}
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={signOut}
                        title="Sign out"
                        className="grid size-8 place-items-center text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Layout for every signed-in page: sidebar navigation, Add memory, and shared account data. */
export function AppShell({ children }: { children: React.ReactNode }) {
    const { me, loading, refresh } = useAuth();
    const pathname = usePathname();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [shared, setShared] = useState<SharedContent | undefined>(readSharedContent);
    const [adding, setAdding] = useState(() => Boolean(shared));
    const [drawer, setDrawer] = useState(false);
    const [chats, setChats] = useState<ConversationSummary[]>([]);
    const [decor, setDecor] = useState(false);

    const reloadChats = useCallback(() => {
        getConversations().then(setChats).catch(() => undefined);
    }, []);

    useEffect(() => {
        reloadChats();
    }, [reloadChats]);

    const reloadCollections = useCallback(() => {
        getCollections().then(setCollections).catch(() => undefined);
    }, []);

    useEffect(() => {
        reloadCollections();
        // Drop ?share_* from the address bar once read
        if (window.location.search.includes("share_")) window.history.replaceState({}, "", window.location.pathname);
    }, [reloadCollections]);

    const openAddContent = useCallback((initial?: SharedContent) => {
        setShared(initial);
        setAdding(true);
    }, []);

    if (loading || !me) {
        return (
            <div className="ui-zoom-75 grid min-h-[calc(100svh/var(--ui-zoom,1))] w-full place-items-center bg-lp-dots">
                <Loader2 className="size-6 animate-spin text-on-surface-variant" />
            </div>
        );
    }

    return (
        <ShellContext.Provider value={{ me, refreshMe: refresh, collections, reloadCollections, openAddContent, chats, reloadChats, setDecor }}>
            <div className="ui-zoom-75 isolate min-h-[calc(100svh/var(--ui-zoom,1))] w-full flex-1 bg-lp-dots text-on-surface">
                {/* Faint collage art at the right edge during a chat (wide screens only, behind everything) */}
                <AnimatePresence>
                    {decor && pathname === "/chat" && (
                        <motion.div
                            aria-hidden="true"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="pointer-events-none fixed inset-y-0 right-0 -z-10 hidden w-[300px] overflow-hidden xl:block"
                        >
                            <svg className="absolute inset-0 size-full text-on-surface/10">
                                <line x1="78%" y1="0" x2="78%" y2="100%" stroke="currentColor" strokeDasharray="2 6" />
                                <circle cx="70%" cy="12%" r="90" fill="none" stroke="currentColor" />
                            </svg>
                            <span className="absolute right-[90px] bottom-[300px] size-[110px] rounded-full bg-[#e2694d]/45" />
                            <Image
                                src="/art/statue-eye.webp"
                                alt=""
                                width={489}
                                height={792}
                                className="absolute -right-6 -bottom-8 w-[230px] opacity-80 mix-blend-multiply [mask-image:radial-gradient(ellipse_70%_75%_at_60%_60%,#000_50%,transparent_80%)]"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop sidebar */}
                <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-outline-variant bg-background/95 backdrop-blur md:block">
                    <Sidebar me={me} onAdd={() => openAddContent()} />
                </aside>

                {/* Phone top bar + drawer */}
                <header className="sticky top-0 z-30 flex items-center justify-between border-b border-outline-variant bg-background/90 px-4 py-3 backdrop-blur md:hidden">
                    <Logo />
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => openAddContent()} className="grid size-9 place-items-center bg-primary-container text-white" title="Add memory">
                            <Plus className="size-4" />
                        </button>
                        <button type="button" onClick={() => setDrawer(true)} className="grid size-9 place-items-center shadow-[inset_0_0_0_1px_var(--color-outline-variant)]" title="Menu">
                            <Menu className="size-4" />
                        </button>
                    </div>
                </header>
                <AnimatePresence>
                    {drawer && (
                        <>
                            <motion.div
                                className="fixed inset-0 z-40 bg-on-surface/25 md:hidden"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setDrawer(false)}
                            />
                            <motion.aside
                                className="fixed inset-y-0 left-0 z-50 w-[280px] bg-background md:hidden"
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", stiffness: 320, damping: 34 }}
                            >
                                <button type="button" onClick={() => setDrawer(false)} className="absolute top-5 right-4 grid size-8 place-items-center" title="Close menu">
                                    <X className="size-4" />
                                </button>
                                <Sidebar me={me} onAdd={() => { setDrawer(false); openAddContent(); }} onNavigate={() => setDrawer(false)} />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                <main className="md:pl-[264px]">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto w-full max-w-[1100px] px-4 pt-8 pb-24 md:px-10 md:pt-12"
                    >
                        {children}
                    </motion.div>
                </main>

                {adding && (
                    <AddContent
                        isAddContentOpen={adding}
                        setIsAddContentOpen={(open) => {
                            setAdding(open);
                            if (!open) setShared(undefined);
                        }}
                        onSaved={() => {
                            void refresh();
                            reloadCollections();
                            window.dispatchEvent(new Event(MEMORIES_CHANGED));
                        }}
                        collections={collections}
                        initial={shared}
                    />
                )}
            </div>
        </ShellContext.Provider>
    );
}

/** Page title block used at the top of every app page. */
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode }) {
    return (
        <header className="mb-8 grid gap-3">
            <span className="w-fit bg-surface-container-high px-2.5 py-1.5 text-[12px] leading-none tracking-[0.05em] uppercase">{eyebrow}</span>
            <h1 className="font-headline text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] font-normal tracking-[-0.025em] text-balance">{title}</h1>
            {children && <div className="max-w-[60ch] text-[15.5px] leading-[1.6] text-on-surface-variant">{children}</div>}
        </header>
    );
}
