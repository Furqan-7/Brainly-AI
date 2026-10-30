"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { chatWithBrain } from "../../services/api";
import { BrainLogo } from "./BrainLogo";
import { ThinkingDots } from "./ThinkingDots";
import { SourceCard } from "./SourceCard";
import type { AIResponse, Source } from "../../types/memory";

type ThinkingState = "idle" | "thinking" | "done";

export function ChatComponent({ text }: { text: string }) {
    const router = useRouter();
    const [thinkingState, setThinkingState] = useState<ThinkingState>("idle");
    const [statusLabel, setStatusLabel] = useState("");
    const [llmResponse, setLlmResponse] = useState("");
    const [sources, setSources] = useState<Source[]>([]);
    const [chatError, setChatError] = useState("");

    useEffect(() => {
        if (!text.trim()) return;

        const fetchResponse = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) { router.push("/"); return; }

                // Reset
                setChatError("");
                setLlmResponse("");
                setSources([]);
                setThinkingState("thinking");
                setStatusLabel("Searching your memories...");

                const timer1 = setTimeout(() => setStatusLabel("Thinking through your notes..."), 1500);
                const timer2 = setTimeout(() => setStatusLabel("Generating answer..."), 3000);

                const response: AIResponse = await chatWithBrain(text, token);

                clearTimeout(timer1);
                clearTimeout(timer2);
                setThinkingState("done");

                if (response.success) {
                    setStatusLabel("Answer ready");
                    setLlmResponse(response.answer || "");
                    setSources(response.sources || []);
                } else {
                    setStatusLabel("Failed");
                    setChatError(response.message || "Failed to generate AI response.");
                }

                setTimeout(() => setThinkingState("idle"), 2000);
            } catch (err) {
                console.error(err);
                setThinkingState("idle");
                setChatError("Failed to generate AI response.");
            }
        };

        fetchResponse();
    }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            {/* Thinking state */}
            <AnimatePresence>
                {thinkingState !== "idle" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20"
                    >
                        <BrainLogo state={thinkingState} />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-white/80">
                                {thinkingState === "thinking" ? "Brainly is thinking" : "Answer ready"}
                            </span>
                            <div className="flex items-center gap-2">
                                {thinkingState === "thinking" ? (
                                    <>
                                        <ThinkingDots />
                                        <span className="text-xs text-white/35">{statusLabel}</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-indigo-400">{statusLabel}</span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error state */}
            <AnimatePresence>
                {chatError && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/10"
                    >
                        <AlertCircle size={16} className="text-red-400" />
                        <p className="text-sm text-red-400">{chatError}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Response */}
            <AnimatePresence>
                {llmResponse && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/6">
                            <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
                                <Sparkles size={12} className="text-indigo-400" />
                            </div>
                            <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                                Brainly Answer
                            </span>
                        </div>

                        {/* Answer */}
                        <div className="px-5 py-4">
                            <p className="text-sm leading-relaxed text-white/80 whitespace-pre-wrap">
                                {llmResponse}
                            </p>
                        </div>

                        {/* Sources */}
                        {sources.length > 0 && (
                            <div className="px-5 pb-5 space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-3">
                                    Sources from your brain
                                </p>
                                <div className="flex flex-col gap-2">
                                    {sources.map((source) => (
                                        <SourceCard key={source.memoryId} source={source} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
