"use client";

import { motion } from "motion/react";
import { Brain, ArrowRight } from "lucide-react";
import type { Memory } from "../../types/memory";
import { MemoryCard } from "./MemoryCard";

interface ContentGridProps {
    memories: Memory[];
    onDelete?: (id: number) => void;
}

export function ContentGrid({ memories, onDelete }: ContentGridProps) {
    if (memories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Brain className="w-10 h-10 text-on-surface-variant/20" />
                <p className="text-sm text-on-surface-variant/50">
                    No memories yet. Add your first one!
                </p>
            </div>
        );
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto mt-10"
        >
            {memories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} onDelete={onDelete} />
            ))}

            {/* Brainly Insights prompt */}
            <div className="md:col-span-2 flex items-center gap-4 bg-surface-container-low border border-outline-variant/10 rounded-xl p-5 hover:bg-surface-container-low/80 transition-all cursor-pointer group">
                <div className="hidden md:flex w-12 h-12 shrink-0 items-center justify-center bg-primary-container/10 rounded-xl border border-primary-container/20">
                    <Brain
                        className="w-6 h-6 text-primary-container"
                        fill="currentColor"
                        fillOpacity={0.3}
                    />
                </div>

                <div className="flex-grow space-y-1">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] font-bold tracking-widest uppercase text-primary">
                            Brainly Insights
                        </span>
                    </div>

                    <h3 className="text-sm font-bold leading-snug">
                        You have {memories.length}{" "}
                        {memories.length === 1 ? "memory" : "memories"} in your second brain.
                    </h3>

                    <p className="text-xs text-on-surface-variant/70">
                        Ask me anything about your saved content. Want a summary or insights?
                    </p>
                </div>

                <ArrowRight className="w-4 h-4 text-on-surface-variant/40 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
        </motion.section>
    );
}
