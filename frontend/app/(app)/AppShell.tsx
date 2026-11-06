"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    X,
    type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { getCollections, logout } from "@/app/services/api";
import type { Collection, Me } from "@/app/types/memory";
import AddContent from "@/app/components/AddContent";
import { Logo } from "@/app/components/landing/ui";
import { shine } from "@/app/components/landing/motion";

/** Fired after a memory is added, so pages showing memories can refresh. */
export const MEMORIES_CHANGED = "brainly:memories-changed";

type SharedContent = { url?: string; title?: string; text?: string };

interface Shell {
    me: Me | null;
    refreshMe: () => Promise<void>;
    collections: Collection[];
    reloadCollections: () => void;
    openAddContent: (initial?: SharedContent) => void;
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

function Sidebar({ me, onAdd, onNavigate }: { me: Me | null; onAdd: () => void; onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();

    const signOut = async () => {
        await logout().catch(() => undefined);
        router.push("/");
    };

    return (
        <div className="flex h-full flex-col gap-6 px-4 py-6">
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
        <ShellContext.Provider value={{ me, refreshMe: refresh, collections, reloadCollections, openAddContent }}>
            <div className="ui-zoom-75 min-h-[calc(100svh/var(--ui-zoom,1))] w-full flex-1 bg-lp-dots text-on-surface">
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
