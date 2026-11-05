"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, AlertCircle, History, Plus, Send, Trash2, User } from "lucide-react";

import {
    deleteConversation, getConversation, getConversations, streamChat,
} from "../../services/api";
import { BrainLogo } from "./BrainLogo";
import { ThinkingDots } from "./ThinkingDots";
import { SourceCard } from "./SourceCard";
import type { ChatMessage, ConversationSummary, SearchFilters } from "../../types/memory";

/** Renders an answer with [n] citations as buttons that highlight the matching source. */
function AnswerText({ text, onCite }: { text: string; onCite: (n: number) => void }) {
    const parts = text.split(/(\[\d+\])/g);
    return (
        <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">
            {parts.map((part, i) => {
                const cite = part.match(/^\[(\d+)\]$/);
                if (!cite) return <Fragment key={i}>{part}</Fragment>;
                return (
                    <button
                        key={i}
                        onClick={() => onCite(Number(cite[1]))}
                        className="inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 mx-0.5 align-text-top rounded bg-primary/20 text-[10px] font-bold text-primary hover:bg-black/40 cursor-pointer"
                        title={`Show source ${cite[1]}`}
                    >
                        {cite[1]}
                    </button>
                );
            })}
        </p>
    );
}

function AssistantMessage({ message, index }: { message: ChatMessage; index: number }) {
    const [highlight, setHighlight] = useState<number | null>(null);

    const cite = (n: number) => {
        setHighlight(n);
        document.getElementById(`source-${index}-${n}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        setTimeout(() => setHighlight(null), 1800);
    };

    // Sources the answer actually cites come first; the rest stay available below
    const cited = new Set([...message.content.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
    const sources = [...(message.sources ?? [])].sort((a, b) => Number(cited.has(b.n)) - Number(cited.has(a.n)));

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-surface-container-lowest border border-on-surface/10 overflow-hidden"
        >
            <div className="flex items-center gap-2 px-5 py-3 border-b border-on-surface/6">
                <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
                    <Sparkles size={12} className="text-primary" />
                </div>
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Brainly Answer</span>
                {message.streaming && <ThinkingDots />}
            </div>

            <div className="px-5 py-4">
                {message.error ? (
                    <div className="flex items-center gap-2 text-sm text-error">
                        <AlertCircle size={16} />
                        {message.error}
                    </div>
                ) : message.content ? (
                    <AnswerText text={message.content} onCite={cite} />
                ) : (
                    <span className="text-xs text-on-surface-variant">Searching your memories…</span>
                )}
            </div>

            {sources.length > 0 && (
                <div className="px-5 pb-5 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                        Sources from your brain
                    </p>
                    <div className="flex flex-col gap-2">
                        {sources.map((source) => (
                            <div key={source.memoryId} id={`source-${index}-${source.n}`}>
                                <SourceCard source={source} highlighted={highlight === source.n} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

interface ChatThreadProps {
    /** A question submitted from the main search box; `nonce` changes on every submit */
    ask: { text: string; nonce: number; filters: SearchFilters } | null;
    onAnswered?: () => void;
}

export function ChatComponent({ ask, onAnswered }: ChatThreadProps) {
    // Follow-ups reuse the filters of the question that started the thread
    const filters = ask?.filters ?? {};
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<number | null>(null);
    const [busy, setBusy] = useState(false);
    const [followUp, setFollowUp] = useState("");
    const [history, setHistory] = useState<ConversationSummary[] | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const send = useCallback(async (question: string) => {
        const text = question.trim();
        if (!text || busy) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setBusy(true);

        setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "", streaming: true }]);
        const patchLast = (fn: (m: ChatMessage) => ChatMessage) =>
            setMessages((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);

        try {
            await streamChat(text, { conversationId, filters, signal: controller.signal }, {
                onMeta: (meta) => {
                    setConversationId(meta.conversationId);
                    patchLast((m) => ({ ...m, sources: meta.sources }));
                },
                onToken: (delta) => patchLast((m) => ({ ...m, content: m.content + delta })),
                onDone: (done) => patchLast((m) => ({ ...m, id: done.messageId, content: done.answer, streaming: false })),
            });
            patchLast((m) => ({ ...m, streaming: false }));
            onAnswered?.();
        } catch (err) {
            if (controller.signal.aborted) return;
            patchLast((m) => ({ ...m, streaming: false, error: err instanceof Error ? err.message : "Failed to generate AI response." }));
        } finally {
            setBusy(false);
        }
    }, [busy, conversationId, filters, onAnswered]);

    useEffect(() => {
        if (ask?.text) void send(ask.text);
        // Only react to new submissions from the search box
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ask?.nonce]);

    useEffect(() => () => abortRef.current?.abort(), []);

    const newChat = () => {
        abortRef.current?.abort();
        setMessages([]);
        setConversationId(null);
        setBusy(false);
    };

    const openHistory = async () => {
        if (history) return setHistory(null);
        setHistory(await getConversations().catch(() => []));
    };

    const loadConversation = async (id: number) => {
        setHistory(null);
        const conversation = await getConversation(id);
        abortRef.current?.abort();
        setConversationId(conversation.id);
        setMessages(conversation.messages);
    };

    const removeConversation = async (id: number) => {
        await deleteConversation(id);
        setHistory((prev) => prev?.filter((c) => c.id !== id) ?? null);
        if (id === conversationId) newChat();
    };

    const thinking = busy && messages[messages.length - 1]?.content === "";

    return (
        <div className="w-full max-w-3xl space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-end gap-2 relative">
                {messages.length > 0 && (
                    <button
                        onClick={newChat}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-on-surface/6 cursor-pointer"
                    >
                        <Plus size={12} /> New chat
                    </button>
                )}
                <button
                    onClick={openHistory}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-on-surface/6 cursor-pointer"
                >
                    <History size={12} /> History
                </button>
                {history && (
                    <div className="absolute right-0 top-9 z-30 w-72 max-h-80 overflow-y-auto rounded-xl bg-surface-container-lowest border border-on-surface/10 shadow-2xl p-1">
                        {history.length === 0 && <p className="text-xs text-on-surface-variant p-3">No past conversations yet.</p>}
                        {history.map((c) => (
                            <div key={c.id} className="flex items-center group rounded-lg hover:bg-on-surface/6">
                                <button onClick={() => loadConversation(c.id)} className="flex-1 text-left px-3 py-2 min-w-0 cursor-pointer">
                                    <span className="block text-xs text-on-surface truncate">{c.title}</span>
                                    <span className="block text-[10px] text-on-surface-variant">{new Date(c.updatedAt).toLocaleString()}</span>
                                </button>
                                <button
                                    onClick={() => removeConversation(c.id)}
                                    className="p-2 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error cursor-pointer"
                                    title="Delete conversation"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Thinking state */}
            <AnimatePresence>
                {thinking && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20"
                    >
                        <BrainLogo state="thinking" />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-on-surface">Brainly is thinking</span>
                            <div className="flex items-center gap-2">
                                <ThinkingDots />
                                <span className="text-xs text-on-surface-variant">Searching your memories…</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Conversation */}
            {messages.map((message, i) =>
                message.role === "user" ? (
                    <div key={i} className="flex items-start gap-2 justify-end">
                        <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary-container/30 border border-primary/20 px-4 py-2.5 text-sm text-on-surface whitespace-pre-wrap">
                            {message.content}
                        </p>
                        <div className="w-7 h-7 shrink-0 rounded-full bg-on-surface/8 flex items-center justify-center">
                            <User size={14} className="text-on-surface" />
                        </div>
                    </div>
                ) : (
                    <AssistantMessage key={i} message={message} index={i} />
                )
            )}

            {/* Follow-up */}
            {messages.length > 0 && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void send(followUp);
                        setFollowUp("");
                    }}
                    className="flex items-center gap-2 rounded-xl bg-on-surface/5 border border-on-surface/10 px-3 h-11"
                >
                    <input
                        value={followUp}
                        onChange={(e) => setFollowUp(e.target.value)}
                        placeholder='Ask a follow-up, e.g. "show me more like that"'
                        className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70 outline-none min-w-0"
                    />
                    <button
                        type="submit"
                        disabled={busy || !followUp.trim()}
                        className="p-1.5 rounded-lg text-primary hover:bg-black/20 disabled:opacity-30 cursor-pointer"
                    >
                        <Send size={14} />
                    </button>
                </form>
            )}
        </div>
    );
}
