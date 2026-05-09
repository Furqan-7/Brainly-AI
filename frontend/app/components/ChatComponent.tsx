"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Brain,
    ExternalLink,
    Sparkles,
    AlertCircle,
} from "lucide-react";

import { GetResponseFromOllama } from "./GetResponseFromOllama";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ThinkingState = "idle" | "thinking" | "done";

interface Source {
    memoryId: number;
    title: string;
    type: string;
    source_url: string | null;
    similarity: number;
}

interface AIResponse {
    success: boolean;
    message?: string;
    answer: string;
    sources: Source[];
}

// ─────────────────────────────────────────────────────────────
// Brain Logo
// ─────────────────────────────────────────────────────────────

function BrainLogo({
    state,
}: {
    state: ThinkingState;
}) {
    return (
        <div className="relative w-12 h-12 flex items-center justify-center">

            {/* Ripple animation */}
            <AnimatePresence>
                {state === "thinking" &&
                    [0, 0.7, 1.4].map((delay, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-indigo-500"
                            initial={{
                                scale: 0.3,
                                opacity: 0.8,
                            }}
                            animate={{
                                scale: 1.6,
                                opacity: 0,
                            }}
                            transition={{
                                duration: 2.2,
                                delay,
                                repeat: Infinity,
                                ease: "easeOut",
                            }}
                        />
                    ))}
            </AnimatePresence>

            {/* Main brain */}
            <motion.div
                animate={
                    state === "thinking"
                        ? {
                            scale: [1, 1.1, 1],
                            opacity: [0.7, 1, 0.7],
                        }
                        : state === "done"
                            ? {
                                scale: [0.9, 1.05, 1],
                            }
                            : {
                                scale: 1,
                                opacity: 0.4,
                            }
                }
                transition={
                    state === "thinking"
                        ? {
                            duration: 2,
                            repeat: Infinity,
                        }
                        : {
                            duration: 0.3,
                        }
                }
            >
                <Brain
                    size={26}
                    className="text-indigo-400"
                />
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Thinking dots
// ─────────────────────────────────────────────────────────────

function ThinkingDots() {
    return (
        <div className="flex items-center gap-1">
            {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                    animate={{
                        y: [0, -4, 0],
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 1.4,
                        delay,
                        repeat: Infinity,
                    }}
                />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Chat Component
// ─────────────────────────────────────────────────────────────

export function ChatComponent({
    text,
}: {
    text: string;
}) {

    const router = useRouter();

    const [thinkingState, setThinkingState] =
        useState<ThinkingState>("idle");

    const [statusLabel, setStatusLabel] =
        useState("");

    const [LLMResponse, setLLMResponse] =
        useState("");

    const [Sources, setSources] =
        useState<Source[]>([]);

    const [Error, setError] =
        useState("");

    useEffect(() => {

        if (!text.trim()) return;

        const getresponse = async () => {

            try {

                const token =
                    localStorage.getItem("token");

                if (!token) {
                    router.push("/");
                    return;
                }

                // Reset states
                setError("");
                setLLMResponse("");
                setSources([]);

                // Start thinking animation
                setThinkingState("thinking");

                setStatusLabel(
                    "Searching your memories..."
                );

                const timer1 = setTimeout(() => {
                    setStatusLabel(
                        "Thinking through your notes..."
                    );
                }, 1500);

                const timer2 = setTimeout(() => {
                    setStatusLabel(
                        "Generating answer..."
                    );
                }, 3000);

                const response: AIResponse =
                    await GetResponseFromOllama(
                        text,
                        token
                    );

                clearTimeout(timer1);
                clearTimeout(timer2);

                setThinkingState("done");

                if (response.success) {
                    setStatusLabel("Answer ready");
                    setLLMResponse(
                        response.answer || ""
                    );
                    setSources(
                        response.sources || []
                    );
                } else {
                    setStatusLabel("Failed");
                    setError(
                        response.message || "Failed to generate AI response."
                    );
                }

                setTimeout(() => {
                    setThinkingState("idle");
                }, 2000);

            } catch (err) {

                console.error(err);

                setThinkingState("idle");

                setError(
                    "Failed to generate AI response."
                );
            }
        };

        getresponse();

    }, [text]);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">

            {/* ───────────────── Thinking UI ───────────────── */}

            <AnimatePresence>
                {thinkingState !== "idle" && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: -10,
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                    >

                        <BrainLogo
                            state={thinkingState}
                        />

                        <div className="flex flex-col gap-1">

                            <span className="text-sm font-medium text-white/80">

                                {thinkingState === "thinking"
                                    ? "Brainly is thinking"
                                    : "Answer ready"}

                            </span>

                            <div className="flex items-center gap-2">

                                {thinkingState === "thinking" ? (
                                    <>
                                        <ThinkingDots />

                                        <span className="text-xs text-white/35">
                                            {statusLabel}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xs text-indigo-400">
                                        {statusLabel}
                                    </span>
                                )}

                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ───────────────── Error UI ───────────────── */}

            <AnimatePresence>
                {Error && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10"
                    >

                        <AlertCircle
                            size={16}
                            className="text-red-400"
                        />

                        <p className="text-sm text-red-400">
                            {Error}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ───────────────── Response UI ───────────────── */}

            <AnimatePresence>
                {LLMResponse && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 12,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden"
                    >

                        {/* Header */}

                        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/6">

                            <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
                                <Sparkles
                                    size={12}
                                    className="text-indigo-400"
                                />
                            </div>

                            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                                Brainly Answer
                            </span>
                        </div>

                        {/* Answer */}

                        <div className="px-5 py-4">

                            <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                                {LLMResponse}
                            </p>

                        </div>

                        {/* Sources */}

                        {Sources.length > 0 && (

                            <div className="px-5 pb-5 space-y-2">

                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">
                                    Sources from your brain
                                </p>

                                <div className="flex flex-col gap-2">

                                    {Sources.map(
                                        (
                                            source,
                                            index
                                        ) => (

                                            <motion.div
                                                key={index}
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.96,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                transition={{
                                                    delay:
                                                        index *
                                                        0.06,
                                                }}
                                                className="p-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all"
                                            >

                                                <div className="flex items-center gap-2 mb-1">

                                                    <ExternalLink
                                                        size={12}
                                                        className="text-indigo-400"
                                                    />

                                                    <span className="text-sm font-medium text-white/80">
                                                        {source.title}
                                                    </span>

                                                </div>

                                                <div className="flex items-center gap-3 text-[11px] text-white/35">

                                                    <span>
                                                        {source.type}
                                                    </span>

                                                    <span>
                                                        {(
                                                            source.similarity *
                                                            100
                                                        ).toFixed(
                                                            1
                                                        )}
                                                        % match
                                                    </span>

                                                </div>

                                            </motion.div>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}