"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
    Archive,
    Copy,
    Download,
    FolderOpen,
    Library,
    Loader2,
    LogOut,
    MailWarning,
    Menu,
    Network,
    Plus,
    Settings,
    Sparkles,
    Star,
    Trash2,
    X,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useInstall } from "@/app/components/pwa";
import { deleteConversation, errorMessage, getCollections, getConversations, getCounts, logout, resendVerificationEmail } from "@/app/services/api";
import type { Collection, ConversationSummary, Me, MemoryCounts } from "@/app/types/memory";
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
    /** Library totals for the sidebar and the library's type tabs */
    counts: MemoryCounts | null;
    reloadCounts: () => void;
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

type NavItem = { href: string; label: string; icon: LucideIcon; hint: string; count?: (c: MemoryCounts | null, cols: Collection[]) => number | undefined; sub?: boolean };

const NAV: NavItem[] = [
    { href: "/chat", label: "Ask", icon: Sparkles, hint: "Ask your brain anything" },
    { href: "/library", label: "Library", icon: Library, hint: "Everything you've saved", count: (c) => c?.total },
    { href: "/library?view=starred", label: "Starred", icon: Star, hint: "What you starred", count: (c) => c?.starred, sub: true },
    { href: "/library?view=archived", label: "Archive", icon: Archive, hint: "Out of the way, still searchable by you", count: (c) => c?.archived, sub: true },
    { href: "/collections", label: "Collections", icon: FolderOpen, hint: "Boards you can share", count: (_c, cols) => cols.length },
    { href: "/graph", label: "Knowledge graph", icon: Network, hint: "How your saves connect" },
];

/** A stable colour per collection, so its dot looks the same everywhere */
const COLLECTION_COLORS = ["#b4472b", "#5f6a2e", "#4e6aa8", "#c08a2b", "#8a4f7d", "#2f7f7a"];
export const collectionColor = (id: number) => COLLECTION_COLORS[id % COLLECTION_COLORS.length];

const VISIBLE_COLLECTIONS = 5;

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
    const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    return (
        <div className="grid gap-1.5">
            <div className="flex justify-between text-[11.5px] text-on-surface-variant">
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

const VISIBLE_CHATS = 6;

/** "Install app" in the sidebar, only when the browser can install Brainly right now. */
function InstallRow({ onNavigate }: { onNavigate?: () => void }) {
    const { state, install } = useInstall();
    if (state !== "available") return null;
    return (
        <button
            type="button"
            onClick={() => {
                onNavigate?.();
                void install();
            }}
            className="-mb-1 flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-left text-[13px] transition-colors hover:border-on-surface/40"
        >
            <Download className="size-4 flex-none" />
            <span className="grid">
                <span className="font-medium">Install Brainly app</span>
                <span className="text-[11.5px] text-on-surface-variant">Save from any app&apos;s Share menu</span>
            </span>
        </button>
    );
}

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
        <div className="flex flex-col gap-1.5">
            <span className="px-3 text-[11px] tracking-[0.08em] text-on-surface-variant uppercase">Chats</span>
            <div className="grid min-w-0 grid-cols-1 content-start gap-px">
                <Link href="/chat" onClick={newChat} className={chatRow(false)}>
                    <Plus className="size-4 flex-none" />
                    New chat
                </Link>
                {groupChats(shown).map((group) => (
                    <div key={group.label} className="grid min-w-0 grid-cols-1 gap-px">
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

/** Which nav row is active, from the path and the library's ?view= / ?collection= */
function useActiveNav() {
    const pathname = usePathname();
    const params = useSearchParams();
    return (href: string) => {
        const [path, query] = href.split("?");
        if (pathname !== path && !pathname.startsWith(path + "/")) return false;
        if (path !== "/library") return true;
        const view = params.get("view");
        if (params.get("collection")) return false;
        return query ? query === `view=${view}` : !view;
    };
}

function MainNav({ onNavigate }: { onNavigate?: () => void }) {
    const { counts, collections } = useShell();
    const isActive = useActiveNav();
    return (
        <nav aria-label="App" className="grid gap-px">
            {NAV.map(({ href, label, icon: Icon, hint, count, sub }) => {
                const active = isActive(href);
                const n = count?.(counts, collections);
                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        title={hint}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex items-center gap-3 rounded-lg transition-colors ${sub ? "py-1.5 pr-3 pl-10 text-[13.5px]" : "px-3 py-2.5 text-[15px]"} ${active ? "font-medium text-on-surface" : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"}`}
                    >
                        {active && (
                            <motion.span
                                layoutId="nav-active"
                                className="rounded-lg absolute inset-0 -z-10 bg-surface-container-high shadow-[inset_2px_0_0_var(--color-primary)]"
                                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                            />
                        )}
                        <Icon className={`${sub ? "size-[15px]" : "size-[18px]"} flex-none transition-transform duration-300 group-hover:scale-110`} />
                        <span className="truncate">{label}</span>
                        {n !== undefined && n > 0 && <span className="ml-auto text-[12px] tabular-nums text-on-surface-variant/70">{n.toLocaleString()}</span>}
                    </Link>
                );
            })}
        </nav>
    );
}

function CollectionsNav({ onNavigate }: { onNavigate?: () => void }) {
    const { collections } = useShell();
    const pathname = usePathname();
    const params = useSearchParams();
    const activeId = pathname === "/library" ? Number(params.get("collection")) || null : null;
    const shown = [...collections].sort((a, b) => b.memoryCount - a.memoryCount).slice(0, VISIBLE_COLLECTIONS);

    return (
        <div className="grid gap-px">
            <div className="flex items-center justify-between px-3 pb-1">
                <span className="text-[11px] tracking-[0.08em] text-on-surface-variant uppercase">Collections</span>
                <Link href="/collections" onClick={onNavigate} className="grid size-5 place-items-center rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface" title="New collection">
                    <Plus className="size-3.5" />
                </Link>
            </div>
            {shown.length === 0 && (
                <Link href="/collections" onClick={onNavigate} className="rounded-md px-3 py-1.5 text-[13px] text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface">
                    Group saves into boards →
                </Link>
            )}
            {shown.map((c) => (
                <Link
                    key={c.id}
                    href={`/library?collection=${c.id}`}
                    onClick={onNavigate}
                    aria-current={activeId === c.id ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13.5px] transition-colors ${activeId === c.id ? "bg-surface-container-high font-medium text-on-surface" : "text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface"}`}
                >
                    <span className="size-2.5 flex-none rounded-[3px]" style={{ background: collectionColor(c.id) }} />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-[12px] tabular-nums text-on-surface-variant/70">{c.memoryCount}</span>
                </Link>
            ))}
            {collections.length > VISIBLE_COLLECTIONS && (
                <Link href="/collections" onClick={onNavigate} className="rounded-md px-3 py-1.5 text-[12.5px] text-on-surface-variant hover:text-on-surface">
                    All {collections.length} collections →
                </Link>
            )}
        </div>
    );
}

/**
 * The sidebar's scrolling middle. No scrollbar (browsers draw them with arrows and tracks on
 * Windows); instead the top or bottom edge fades out while there is more to scroll that way.
 */
function FadeScroll({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ top: false, bottom: false });

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            const top = el.scrollTop > 2;
            const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
            setEdges((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }));
        };
        el.addEventListener("scroll", update, { passive: true });
        // Also runs once right away, then whenever the content changes size as chats and collections load
        const ro = new ResizeObserver(update);
        ro.observe(el);
        Array.from(el.children).forEach((child) => ro.observe(child));
        const mo = new MutationObserver(update);
        mo.observe(el, { childList: true, subtree: true });
        return () => {
            el.removeEventListener("scroll", update);
            ro.disconnect();
            mo.disconnect();
        };
    }, []);

    const fade = 28;
    const mask = `linear-gradient(to bottom, ${edges.top ? "transparent" : "#000"} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edges.bottom ? "transparent" : "#000"} 100%)`;

    return (
        <div
            ref={ref}
            className="-mx-1 flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto overscroll-contain px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
            {children}
        </div>
    );
}

function Sidebar({ me, onAdd, onNavigate }: { me: Me | null; onAdd: () => void; onNavigate?: () => void }) {
    const router = useRouter();
    const pathname = usePathname();

    const signOut = async () => {
        await logout().catch(() => undefined);
        router.push("/");
    };

    const toolRow = (href: string) =>
        `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors ${pathname === href ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface"}`;

    return (
        <div className="flex h-full flex-col gap-5 px-4 py-6">
            <div className="px-2">
                <Logo />
            </div>

            <button
                type="button"
                onClick={onAdd}
                className={`rounded-xl group/btn ${shine} flex items-center justify-center gap-2 bg-primary-container px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-black`}
            >
                <Plus className="size-4 transition-transform duration-300 group-hover/btn:rotate-90" />
                Add memory
            </button>

            <FadeScroll>
                <Suspense fallback={<div className="h-64" />}>
                    <MainNav onNavigate={onNavigate} />
                    <CollectionsNav onNavigate={onNavigate} />
                    <ChatsNav onNavigate={onNavigate} />
                </Suspense>
            </FadeScroll>

            <div className="grid gap-3 border-t border-outline-variant pt-4">
                <InstallRow onNavigate={onNavigate} />
                <Link href="/duplicates" onClick={onNavigate} className={toolRow("/duplicates")} title="Find and merge saves you added twice">
                    <Copy className="size-4" /> Tidy up duplicates
                </Link>
                {me && (
                    <div className="grid gap-2.5 rounded-xl bg-surface-container-high/50 px-3 py-2.5">
                        <UsageBar label="Memories" used={me.usage.memoryCount} limit={me.plan.maxMemories} />
                        <UsageBar label="AI answers today" used={me.usage.chatsToday} limit={me.plan.chatsPerDay} />
                    </div>
                )}
                <div className="flex items-center gap-2.5 px-1">
                    <span className="grid size-9 flex-none place-items-center rounded-full bg-primary-container font-headline text-base text-white">
                        {me?.user.username.slice(0, 1).toUpperCase() ?? "·"}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{me?.user.username}</span>
                        <span className="block truncate text-xs text-on-surface-variant">
                            {me?.plan.name === "premium" ? "Pro plan" : "Free plan"}
                        </span>
                    </span>
                    <Link
                        href="/settings"
                        onClick={onNavigate}
                        title="Settings"
                        aria-current={pathname === "/settings" ? "page" : undefined}
                        className={`grid size-8 place-items-center rounded-lg transition-colors ${pathname === "/settings" ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"}`}
                    >
                        <Settings className="size-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={signOut}
                        title="Sign out"
                        className="grid size-8 place-items-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Layout for every signed-in page: sidebar navigation, Add memory, and shared account data. */
/** Asks email sign-ups to confirm their address, so a forgotten password can always be reset. */
function VerifyEmailBanner({ me }: { me: Me }) {
    const [state, setState] = useState<"idle" | "sending" | "sent" | "hidden">(() => {
        try {
            return sessionStorage.getItem("brainly:verify-hidden") ? "hidden" : "idle";
        } catch {
            return "idle";
        }
    });
    const [error, setError] = useState("");
    if (me.user.emailVerified || state === "hidden") return null;

    const resend = async () => {
        setState("sending");
        setError("");
        try {
            await resendVerificationEmail();
            setState("sent");
        } catch (err) {
            setError(errorMessage(err));
            setState("idle");
        }
    };
    const hide = () => {
        try {
            sessionStorage.setItem("brainly:verify-hidden", "1");
        } catch { /* storage blocked */ }
        setState("hidden");
    };

    return (
        <div role="status" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-[14px]">
            <MailWarning className="size-4 flex-none text-amber-700" />
            <p className="m-0 min-w-0 flex-1">
                {state === "sent"
                    ? <>Sent. Open the link we emailed to <b className="font-medium">{me.user.email}</b>.</>
                    : <>Confirm your email (<b className="font-medium">{me.user.email}</b>) so you can reset your password if you ever forget it.</>}
                {error && <span className="block text-error">{error}</span>}
            </p>
            {state !== "sent" && (
                <button type="button" onClick={resend} disabled={state === "sending"} className="rounded-lg flex items-center gap-1.5 border border-on-surface/20 bg-surface-container-lowest px-3 py-1.5 text-[13px] hover:border-on-surface disabled:opacity-60">
                    {state === "sending" && <Loader2 className="size-3.5 animate-spin" />} Resend link
                </button>
            )}
            <button type="button" onClick={hide} className="grid size-7 place-items-center rounded-md text-on-surface-variant hover:text-on-surface" title="Hide for now">
                <X className="size-4" />
            </button>
        </div>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const { me, loading, refresh } = useAuth();
    const pathname = usePathname();
    const [collections, setCollections] = useState<Collection[]>([]);
    const router = useRouter();
    const [shared, setShared] = useState<SharedContent | undefined>();
    const [adding, setAdding] = useState(false);
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
    }, [reloadCollections]);

    const [counts, setCounts] = useState<MemoryCounts | null>(null);
    const reloadCounts = useCallback(() => {
        getCounts().then(setCounts).catch(() => undefined);
    }, []);

    // Totals change when memories are added (any page) or starred, archived and deleted (library)
    useEffect(() => {
        reloadCounts();
        window.addEventListener(MEMORIES_CHANGED, reloadCounts);
        return () => window.removeEventListener(MEMORIES_CHANGED, reloadCounts);
    }, [reloadCounts]);

    // Back from Google sign-in (which always returns to /chat): continue where the user was going
    useEffect(() => {
        if (!me) return;
        try {
            const next = sessionStorage.getItem("brainly:next");
            if (!next) return;
            sessionStorage.removeItem("brainly:next");
            if (next.startsWith("/") && !next.startsWith("//") && next !== window.location.pathname + window.location.search) router.replace(next);
        } catch {
            /* storage blocked */
        }
    }, [me, router]);

    // Shares used to land on /chat (older installs of the app still send them there): save on /share
    useEffect(() => {
        if (pathname !== "/share" && window.location.search.includes("share_")) router.replace(`/share${window.location.search}`);
    }, [pathname, router]);

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
        <ShellContext.Provider value={{ me, refreshMe: refresh, collections, reloadCollections, counts, reloadCounts, openAddContent, chats, reloadChats, setDecor }}>
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
                        <button type="button" onClick={() => openAddContent()} className="rounded-lg grid size-9 place-items-center bg-primary-container text-white" title="Add memory">
                            <Plus className="size-4" />
                        </button>
                        <button type="button" onClick={() => setDrawer(true)} className="rounded-lg grid size-9 place-items-center shadow-[inset_0_0_0_1px_var(--color-outline-variant)]" title="Menu">
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
                        <VerifyEmailBanner me={me} />
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
            <span className="rounded-md w-fit bg-surface-container-high px-2.5 py-1.5 text-[12px] leading-none tracking-[0.05em] uppercase">{eyebrow}</span>
            <h1 className="font-headline text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] font-normal tracking-[-0.025em] text-balance">{title}</h1>
            {children && <div className="max-w-[60ch] text-[15.5px] leading-[1.6] text-on-surface-variant">{children}</div>}
        </header>
    );
}
