"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { ChatThread, useChat } from "@/app/components/chat/ChatComponent";
import { SearchResults } from "@/app/components/chat/SearchResults";
import { SourceViewer } from "@/app/components/chat/Sources";
import { Composer, EMPTY_SCOPE, scopeDays, scopeFind, scopeTypes, takeCommands, type ComposerHandle, type Scope } from "@/app/components/chat/Composer";
import { LiveMatches, StartPanels } from "@/app/components/chat/AskStart";
import type { Memory, SearchFilters, Source } from "@/app/types/memory";
import { clearSearchCache, getMemories } from "@/app/services/api";
import { collectionColor, MEMORIES_CHANGED, NEW_CHAT, useShell } from "../AppShell";

type Mode = "ask" | "search";

const ease = [0.22, 1, 0.36, 1] as const;

/** Filters for a question, captured when it's sent. */
function buildFilters(scope: Scope): SearchFilters {
    const types = scopeTypes(scope);
    const rangeDays = scopeDays(scope);
    return {
        types: types.length ? types : undefined,
        // Rounded to the minute, so the same search can come from the cache
        from: rangeDays ? new Date(Math.floor(Date.now() / 60_000) * 60_000 - rangeDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
        collectionId: scope.collectionId,
    };
}

const newNonce = () => Date.now();

export default function AskPage() {
    // useSearchParams (for ?c=<chat id>) needs a Suspense boundary
    return (
        <Suspense fallback={null}>
            <Ask />
        </Suspense>
    );
}

function Ask() {
    const { me, counts, collections, chats, refreshMe, reloadChats, setDecor, openAddContent } = useShell();
    const router = useRouter();
    const params = useSearchParams();
    const chatParam = Number(params.get("c")) || null;

    const [query, setQuery] = useState("");
    const [scope, setScope] = useState<Scope>(EMPTY_SCOPE);
    const [search, setSearch] = useState<{ text: string; nonce: number; filters: SearchFilters } | null>(null);
    // The source open in the viewer: which list it came from ("message:n" or "search:n") and its number
    const [viewer, setViewer] = useState<{ key: string; sources: Source[]; n: number } | null>(null);
    const [recent, setRecent] = useState<Memory[] | null>(null);
    const [savedLabel, setSavedLabel] = useState<string | null>(null);
    const composerRef = useRef<ComposerHandle>(null);
    // "/find" lists matches without an AI answer
    const mode: Mode = scopeFind(scope) ? "search" : "ask";

    const chat = useChat({
        onAnswered: () => {
            void refreshMe();
            reloadChats();
        },
        // Put a new chat in the address bar (so it can be reopened) and in the sidebar
        onConversation: (id) => {
            router.replace(`/chat?c=${id}`, { scroll: false });
            reloadChats();
        },
    });
    const { load, reset, conversationRef } = chat;

    // Open the chat in ?c=, or start fresh when it's removed
    useEffect(() => {
        if (chatParam && chatParam !== conversationRef.current) {
            setScope((s) => ({ ...s, commands: s.commands.filter((k) => k !== "find") }));
            setViewer(null);
            load(chatParam).catch(() => router.replace("/chat"));
        } else if (!chatParam && conversationRef.current) {
            reset();
            setViewer(null);
        }
    }, [chatParam, conversationRef, load, reset, router]);

    // Sidebar "New chat"
    useEffect(() => {
        const onNewChat = () => {
            reset();
            setSearch(null);
            setQuery("");
            setScope(EMPTY_SCOPE);
            setViewer(null);
            requestAnimationFrame(() => composerRef.current?.focus());
        };
        window.addEventListener(NEW_CHAT, onNewChat);
        return () => window.removeEventListener(NEW_CHAT, onNewChat);
    }, [reset]);

    // Newest saves, to suggest questions about them
    useEffect(() => {
        getMemories({ sort: "newest" })
            .then((page) => {
                setRecent(page.memories.filter((m) => m.status === "ready").slice(0, 3));
                const last = page.memories[0]?.createdAt;
                if (last) {
                    const d = Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000);
                    setSavedLabel(d < 1 ? "today" : d < 2 ? "yesterday" : `${d} days ago`);
                }
            })
            .catch(() => setRecent([]));
    }, []);

    const active = mode === "ask" ? chat.messages.length > 0 : search !== null;

    useEffect(() => {
        setDecor(active);
        return () => setDecor(false);
    }, [setDecor, active]);

    const submit = (raw = query) => {
        // "/week" typed without picking it from the menu still counts as a filter
        const { text, scope: next } = takeCommands(raw, scope);
        if (next !== scope) setScope(next);
        if (!text.trim() || (!scopeFind(next) && chat.busy)) return;
        if (!scopeFind(next)) {
            void chat.send(text, buildFilters(next));
            setQuery("");
        } else {
            setQuery(text);
            setSearch({ text: text.trim(), nonce: newNonce(), filters: buildFilters(next) });
        }
    };

    // Find mode: results follow the text as you type (Enter still searches at once)
    useEffect(() => {
        if (mode !== "search") return;
        const text = takeCommands(query, scope).text;
        if (text.length < 2) return;
        const timer = setTimeout(() => {
            const filters = buildFilters(scope);
            setSearch((current) =>
                current && current.text === text && JSON.stringify(current.filters) === JSON.stringify(filters)
                    ? current
                    : { text, nonce: newNonce(), filters }
            );
        }, 350);
        return () => clearTimeout(timer);
    }, [mode, query, scope]);

    // Saved something new: don't show cached results that miss it
    useEffect(() => {
        window.addEventListener(MEMORIES_CHANGED, clearSearchCache);
        return () => window.removeEventListener(MEMORIES_CHANGED, clearSearchCache);
    }, []);

    const closeViewer = useCallback(() => setViewer(null), []);

    // Keep the newest message in view as you ask and answers stream in
    const messageCount = chat.messages.length;
    useEffect(() => {
        if (messageCount > 0) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }, [messageCount]);

    const openSource = (key: string, sources: Source[], n: number) => setViewer({ key, sources, n });
    const heading = mode === "ask" ? chat.title ?? "New chat" : `Results for “${search?.text}”`;
    const placeholder =
        mode === "search"
            ? "Find in your saves… (results appear as you type)"
            : active
                ? 'Ask a follow-up, e.g. "show me more like that"'
                : "Ask anything you saved… type / to filter, @ for a collection";
    const answersLeft = me ? Math.max(0, me.plan.chatsPerDay - me.usage.chatsToday) : null;

    return (
        <MotionConfig reducedMotion="user">
            {/* A screen tall so the question box can rest at the bottom; moves left when the viewer is open */}
            <div className={`relative mx-auto -mb-24 flex min-h-[calc(100svh/var(--ui-zoom,1)-3rem)] w-full max-w-[760px] flex-col ${viewer ? "xl:ml-0" : ""}`}>
                <LayoutGroup>
                    {/* Before the first question: what Brainly knows, then the box, then ideas */}
                    <AnimatePresence mode="popLayout" initial={false}>
                        {!active && (
                            <motion.header
                                key="hello"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -18, filter: "blur(4px)", transition: { duration: 0.32, ease } }}
                                transition={{ duration: 0.5, ease }}
                                className="pt-[9vh] pb-6"
                            >
                                <h1 className="font-headline text-[clamp(2.1rem,3.6vw,2.75rem)] leading-[1.05] font-normal tracking-[-0.025em]">Ask your brain.</h1>
                                <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14.5px] text-on-surface-variant">
                                    {counts && (
                                        <span>
                                            <b className="font-semibold text-on-surface">{counts.total.toLocaleString()}</b> {counts.total === 1 ? "memory" : "memories"}
                                        </span>
                                    )}
                                    {savedLabel && (
                                        <>
                                            <span aria-hidden="true">·</span>
                                            <span>last saved <b className="font-semibold text-on-surface">{savedLabel}</b></span>
                                        </>
                                    )}
                                    <span aria-hidden="true">·</span>
                                    <span>answers cite the saves they came from</span>
                                </p>
                            </motion.header>
                        )}
                    </AnimatePresence>

                    {active && (
                        <motion.div key="thread" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.12, ease }}>
                            <h1 className="mb-8 truncate text-[14px] font-medium text-on-surface-variant first-letter:uppercase" title={heading}>
                                {heading}
                            </h1>
                            {mode === "ask" ? (
                                <ChatThread messages={chat.messages} activeSource={viewer?.key ?? null} onOpenSource={openSource} />
                            ) : (
                                <SearchResults
                                    query={search}
                                    activeN={viewer?.key.startsWith("search:") ? viewer.n : null}
                                    onOpen={(sources, n) => openSource(`search:${n}`, sources, n)}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* The question box: under the greeting at first, then resting at the bottom of the chat */}
                    <motion.div
                        layout="position"
                        transition={{ layout: { type: "spring", stiffness: 260, damping: 32 } }}
                        className={active ? "sticky bottom-0 z-20 mt-auto flex flex-col gap-2 pt-8 pb-4" : "relative z-20"}
                    >
                        {active && (
                            // Messages fade out above the box; soft side edges so it doesn't read as a panel
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 inset-y-0 -z-10 bg-background [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,#000_32px),linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)] lg:-inset-x-16"
                            />
                        )}
                        <Composer
                            ref={composerRef}
                            value={query}
                            onChange={setQuery}
                            scope={scope}
                            onScopeChange={setScope}
                            onSubmit={() => submit()}
                            busy={mode === "ask" && chat.busy}
                            placeholder={placeholder}
                            counts={counts}
                            collections={collections}
                            collectionColor={collectionColor}
                            large={!active}
                            menuPlacement={active ? "above" : "below"}
                            below={!active && mode === "ask" ? <LiveMatches text={takeCommands(query, scope).text} filters={buildFilters(scope)} /> : null}
                        />
                        {active && (
                            <span className="text-center text-[11.5px] text-on-surface-variant">
                                {mode === "search"
                                    ? "Find is instant and doesn't use AI answers. Remove the /find chip to ask instead."
                                    : answersLeft !== null
                                        ? `${answersLeft} of ${me!.plan.chatsPerDay} AI answers left today · answers come only from your saves`
                                        : "Answers come only from your saves."}
                            </span>
                        )}
                    </motion.div>

                    <AnimatePresence mode="popLayout" initial={false}>
                        {!active && (
                            <motion.div
                                key="ideas"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 28, filter: "blur(4px)", transition: { duration: 0.32, ease } }}
                                transition={{ duration: 0.5, delay: 0.08, ease }}
                                className="pt-5 pb-16"
                            >
                                <StartPanels recent={recent} chats={chats} onAsk={(q) => submit(q)} onAdd={() => openAddContent()} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </LayoutGroup>
            </div>

            <SourceViewer
                sources={viewer?.sources ?? []}
                activeN={viewer?.n ?? null}
                onSelect={(n) => setViewer((v) => (v ? { ...v, n, key: `${v.key.split(":")[0]}:${n}` } : v))}
                onClose={closeViewer}
            />
        </MotionConfig>
    );
}
