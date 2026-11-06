"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Sparkles } from "lucide-react";

import { getConversation, streamChat } from "../../services/api";
import { ThinkingDots } from "./ThinkingDots";
import { CitationChip, SourceShelf } from "./Sources";
import type { ChatMessage, SearchFilters, Source } from "../../types/memory";

// ─── State ───────────────────────────────────────────────────────────────────

/**
 * One conversation with Brainly: sending questions (streamed answers), loading a past
 * conversation and starting over. The page owns the question box; this owns the thread.
 */
export function useChat({ onAnswered, onConversation }: { onAnswered?: () => void; onConversation?: (id: number) => void } = {}) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [title, setTitle] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    // A ref as well as state, so the page can compare it with ?c= without waiting for a render
    const conversationRef = useRef<number | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const callbacks = useRef({ onAnswered, onConversation });
    useEffect(() => {
        callbacks.current = { onAnswered, onConversation };
    });

    const send = useCallback(async (question: string, filters: SearchFilters = {}) => {
        const text = question.trim();
        if (!text) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setBusy(true);
        setTitle((t) => t ?? text);

        setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "", streaming: true }]);
        const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
            setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

        try {
            await streamChat(text, { conversationId: conversationRef.current, filters, signal: controller.signal }, {
                onMeta: (meta) => {
                    const isNew = conversationRef.current !== meta.conversationId;
                    conversationRef.current = meta.conversationId;
                    if (isNew) callbacks.current.onConversation?.(meta.conversationId);
                    patchLast((m) => ({ ...m, sources: meta.sources }));
                },
                onToken: (delta) => patchLast((m) => ({ ...m, content: m.content + delta })),
                onDone: (done) => patchLast((m) => ({ ...m, id: done.messageId, content: done.answer, streaming: false })),
            });
            patchLast((m) => ({ ...m, streaming: false }));
            callbacks.current.onAnswered?.();
        } catch (err) {
            if (controller.signal.aborted) return;
            patchLast((m) => ({ ...m, streaming: false, error: err instanceof Error ? err.message : "Failed to generate AI response." }));
        } finally {
            if (abortRef.current === controller) setBusy(false);
        }
    }, []);

    const reset = useCallback(() => {
        abortRef.current?.abort();
        conversationRef.current = null;
        setMessages([]);
        setTitle(null);
        setBusy(false);
    }, []);

    const load = useCallback(async (id: number) => {
        abortRef.current?.abort();
        conversationRef.current = id;
        setBusy(false);
        const conversation = await getConversation(id);
        if (conversationRef.current !== id) return; // another chat was opened meanwhile
        setMessages(conversation.messages);
        setTitle(conversation.title);
    }, []);

    useEffect(() => () => abortRef.current?.abort(), []);

    return { messages, title, busy, send, reset, load, conversationRef };
}

// ─── Thread ──────────────────────────────────────────────────────────────────

/** Answer text with [n] citations turned into chips that show the source's picture. */
function AnswerText({ text, sources, activeN, onCite }: { text: string; sources: Source[]; activeN: number | null; onCite: (n: number) => void }) {
    const byN = new Map(sources.map((s) => [s.n, s]));
    const parts = text.split(/(\[\d+\])/g);
    return (
        <p className="text-[15px] leading-[1.75] whitespace-pre-wrap text-on-surface">
            {parts.map((part, i) => {
                const cite = part.match(/^\[(\d+)\]$/);
                if (!cite) return <Fragment key={i}>{part}</Fragment>;
                const n = Number(cite[1]);
                return <CitationChip key={i} n={n} source={byN.get(n)} active={activeN === n} onClick={() => onCite(n)} />;
            })}
        </p>
    );
}

function AssistantMessage({ message, activeN, onOpenSource }: { message: ChatMessage; activeN: number | null; onOpenSource: (sources: Source[], n: number) => void }) {
    // Sources the answer actually cites come first; the rest stay available behind "Show more"
    const cited = new Set([...message.content.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
    const sources = [...(message.sources ?? [])].sort((a, b) => Number(cited.has(b.n)) - Number(cited.has(a.n)));
    const open = (n: number) => onOpenSource(sources, n);
    const waiting = message.streaming && !message.content;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_24px_50px_-38px_rgba(60,35,20,0.55)] sm:p-6"
        >
            <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-on-surface-variant uppercase">
                    <span className="grid size-6 place-items-center rounded-lg bg-tertiary-container text-primary">
                        <Sparkles className="size-3.5" />
                    </span>
                    Brainly answer
                    {message.streaming && <ThinkingDots />}
                </span>
                {sources.length > 0 && <span className="text-xs text-on-surface-variant">{sources.length} {sources.length === 1 ? "source" : "sources"}</span>}
            </div>

            {message.error ? (
                <div className="flex items-center gap-2 text-sm text-error">
                    <AlertCircle className="size-4" />
                    {message.error}
                </div>
            ) : waiting ? (
                <span className="text-sm text-on-surface-variant">Searching your memories…</span>
            ) : (
                <AnswerText text={message.content} sources={sources} activeN={activeN} onCite={open} />
            )}

            {sources.length > 0 && <SourceShelf sources={sources} activeN={activeN} onOpen={open} />}
        </motion.div>
    );
}

/**
 * The conversation: your questions as warm bubbles and Brainly's answers as cards with
 * visual sources. `activeSource` marks the source open in the viewer, as "message:n".
 */
export function ChatThread({
    messages,
    activeSource,
    onOpenSource,
}: {
    messages: ChatMessage[];
    activeSource: string | null;
    onOpenSource: (key: string, sources: Source[], n: number) => void;
}) {
    return (
        <div className="grid gap-5">
            {messages.map((message, i) =>
                message.role === "user" ? (
                    <motion.p
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-[85%] justify-self-end rounded-[18px] rounded-br-[4px] bg-[#ebdfd2] px-4 py-2.5 text-[15px] whitespace-pre-wrap text-on-surface shadow-[0_8px_18px_-14px_rgba(60,35,20,0.6)]"
                    >
                        {message.content}
                    </motion.p>
                ) : (
                    <AssistantMessage
                        key={i}
                        message={message}
                        activeN={activeSource?.startsWith(`${i}:`) ? Number(activeSource.split(":")[1]) : null}
                        onOpenSource={(sources, n) => onOpenSource(`${i}:${n}`, sources, n)}
                    />
                )
            )}
        </div>
    );
}
