"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, Check, Copy, Sparkles } from "lucide-react";

import { getConversation, streamChat } from "../../services/api";
import { ThinkingDots } from "./ThinkingDots";
import { SourceShelf } from "./Sources";
import { AnswerMarkdown } from "./AnswerMarkdown";
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
                onDone: (done) => {
                    if (done.title) setTitle(done.title);
                    patchLast((m) => ({ ...m, id: done.messageId, content: done.answer, streaming: false }));
                },
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

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={() => {
                void navigator.clipboard?.writeText(text.replace(/\s*\[\d+\]/g, "")).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                });
            }}
            title="Copy answer"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

/** Brainly's reply: the answer as formatted text with citation chips, and its sources as cards underneath. */
function AssistantMessage({ message, activeN, onOpenSource }: { message: ChatMessage; activeN: number | null; onOpenSource: (sources: Source[], n: number) => void }) {
    // Sources the answer actually cites come first; the rest stay available behind "Show more"
    const cited = new Set([...message.content.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
    const sources = [...(message.sources ?? [])].sort((a, b) => Number(cited.has(b.n)) - Number(cited.has(a.n)));
    const open = useCallback((n: number) => onOpenSource(sources, n), [onOpenSource, sources]);
    const waiting = message.streaming && !message.content;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
            <span className={`grid size-7 place-items-center rounded-lg bg-tertiary-container text-primary ${message.streaming ? "animate-pulse" : ""}`} title="Brainly">
                <Sparkles className="size-4" />
            </span>

            {message.error ? (
                <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
                    <AlertCircle className="mt-0.5 size-4 flex-none" />
                    {message.error}
                </div>
            ) : waiting ? (
                <span className="flex items-center gap-2.5 text-[15px] text-on-surface-variant">
                    <ThinkingDots /> Searching your memories…
                </span>
            ) : (
                <AnswerMarkdown text={message.content} sources={sources} activeN={activeN} onCite={open} />
            )}

            {sources.length > 0 && <SourceShelf sources={sources} activeN={activeN} onOpen={open} />}

            {!message.streaming && !message.error && message.content && (
                <div className="-ml-2 flex items-center gap-1">
                    <CopyButton text={message.content} />
                    {sources.length > 0 && <span className="px-2 text-[12px] text-on-surface-variant">{sources.length} {sources.length === 1 ? "source" : "sources"}</span>}
                </div>
            )}
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
        <div className="grid gap-9">
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
