"use client";

import { motion } from "motion/react";
import {
    Video,
    ExternalLink,
    FileText,
    Bookmark,
    Brain,
    ArrowRight,
    Globe,
    MessageSquare,
    StickyNote,
} from "lucide-react";

type MemoryType =
    | "youtube"
    | "pdf"
    | "tweet"
    | "url"
    | "note"
    | "image";

interface Memory {
    id: number;
    userId: number;
    type: MemoryType;
    title: string;
    source_url: string | null;
    file_path: string | null;
    note: string | null;
    status: "pending" | "processing" | "ready" | "failed";
    metadata: any;
    createdAt: string;
}

export function MemoryCard({ memory }: { memory: Memory }) {
    const meta = memory.metadata ?? {};

    if (memory.type === "youtube") {
        return (
            <div className="md:row-span-2 flex flex-col bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all group">
                <div
                    className="relative overflow-hidden"
                    style={{ aspectRatio: "16/9" }}
                >
                    {meta.thumbnail_url ? (
                        <img
                            src={meta.thumbnail_url}
                            alt={memory.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                            <Video className="w-10 h-10 text-on-surface-variant/30" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Video
                            className="w-10 h-10 text-white"
                            fill="white"
                        />
                    </div>

                    {meta.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
                            {meta.duration}
                        </div>
                    )}
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 mb-2">
                            <Video
                                className="w-3 h-3 text-red-500"
                                fill="#ef4444"
                            />
                            <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                YouTube Memory
                            </span>
                        </div>

                        <h3 className="text-sm font-bold leading-snug mb-1.5">
                            {memory.title}
                        </h3>

                        {meta.description && (
                            <p className="text-xs text-on-surface-variant/70 line-clamp-3">
                                {meta.description}
                            </p>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-outline-variant/10 pt-3">
                        <span className="text-[9px] font-medium text-on-surface-variant/50">
                            {new Date(
                                memory.createdAt
                            ).toLocaleDateString()}
                        </span>

                        <Bookmark className="w-3.5 h-3.5 text-on-surface-variant/40 hover:text-primary transition-colors cursor-pointer" />
                    </div>
                </div>
            </div>
        );
    }

    if (memory.type === "tweet") {
        return (
            <div className="bg-surface-container-high/40 border border-outline-variant/10 rounded-xl p-4 hover:bg-surface-container-high/60 transition-all flex flex-col justify-between group">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
                                <span className="text-[#1DA1F2] text-xs font-bold">
                                    𝕏
                                </span>
                            </div>

                            <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                Tweet
                            </span>
                        </div>

                        {memory.source_url && (
                            <a
                                href={memory.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="w-3 h-3 text-on-surface-variant/40 hover:text-primary transition-colors" />
                            </a>
                        )}
                    </div>

                    <p className="text-sm font-medium leading-relaxed italic line-clamp-4">
                        {memory.title}
                    </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    {meta.username && (
                        <span className="text-[10px] font-semibold text-on-surface-variant">
                            @{meta.username}
                        </span>
                    )}

                    {meta.likes && (
                        <span className="text-[9px] text-on-surface-variant/40">
                            ♥ {meta.likes}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    if (memory.type === "pdf") {
        return (
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 hover:border-secondary/40 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FileText className="w-20 h-20" />
                </div>

                <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-tertiary-container/20 rounded border border-tertiary/20">
                            <FileText className="w-3 h-3 text-tertiary" />

                            <span className="text-[9px] font-bold tracking-widest uppercase text-tertiary">
                                Document
                            </span>
                        </div>

                        <h3 className="text-sm font-bold leading-snug">
                            {memory.title}
                        </h3>

                        <div className="space-y-1">
                            <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-container rounded-full transition-all"
                                    style={{
                                        width:
                                            memory.status === "ready"
                                                ? "100%"
                                                : memory.status ===
                                                    "processing"
                                                    ? "60%"
                                                    : "10%",
                                    }}
                                />
                            </div>

                            <div className="flex justify-between text-[9px] font-bold text-on-surface-variant/60">
                                <span>
                                    {memory.status === "ready"
                                        ? "Analyzed"
                                        : memory.status}
                                </span>

                                {meta.file_size_mb && (
                                    <span>{meta.file_size_mb} MB</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button className="flex items-center justify-center gap-1.5 py-2 bg-surface-container-highest rounded-lg border border-outline-variant/30 text-[10px] font-bold tracking-widest uppercase hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer">
                        Open Document
                    </button>
                </div>
            </div>
        );
    }

    if (memory.type === "url") {
        return (
            <div className="bg-surface-container-high/40 border border-outline-variant/10 rounded-xl p-4 hover:bg-surface-container-high/60 transition-all flex flex-col justify-between group">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <Globe className="w-3 h-3 text-primary" />
                            </div>

                            <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                Web Page
                            </span>
                        </div>

                        {memory.source_url && (
                            <a
                                href={memory.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="w-3 h-3 text-on-surface-variant/40 hover:text-primary transition-colors" />
                            </a>
                        )}
                    </div>

                    <h3 className="text-sm font-bold leading-snug mb-1.5">
                        {memory.title}
                    </h3>

                    {meta.description && (
                        <p className="text-xs text-on-surface-variant/70 line-clamp-3">
                            {meta.description}
                        </p>
                    )}
                </div>

                <div className="mt-3 text-[9px] text-on-surface-variant/40 truncate">
                    {memory.source_url}
                </div>
            </div>
        );
    }

    if (memory.type === "note") {
        return (
            <div className="bg-surface-container-high/40 border border-outline-variant/10 rounded-xl p-4 hover:bg-surface-container-high/60 transition-all flex flex-col justify-between group">
                <div>
                    <div className="flex items-center gap-1.5 mb-3">
                        <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
                            <StickyNote className="w-3 h-3 text-secondary" />
                        </div>

                        <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                            Note
                        </span>
                    </div>

                    <h3 className="text-xs font-bold text-on-surface-variant/60 mb-1.5">
                        {memory.title}
                    </h3>

                    {memory.note && (
                        <p className="text-sm font-medium leading-relaxed line-clamp-5">
                            {memory.note}
                        </p>
                    )}
                </div>

                <div className="mt-3 text-[9px] text-on-surface-variant/40">
                    {new Date(memory.createdAt).toLocaleDateString()}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-high/40 border border-outline-variant/10 rounded-xl p-4 hover:bg-surface-container-high/60 transition-all flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-1.5 mb-3">
                    <MessageSquare className="w-3 h-3 text-on-surface-variant" />

                    <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                        {memory.type}
                    </span>
                </div>

                <h3 className="text-sm font-bold leading-snug">
                    {memory.title}
                </h3>
            </div>

            <div className="mt-3 text-[9px] text-on-surface-variant/40">
                {new Date(memory.createdAt).toLocaleDateString()}
            </div>
        </div>
    );
}

export function ContentGrid({
    memories,
}: {
    memories: Memory[];
}) {
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
                <MemoryCard key={memory.id} memory={memory} />
            ))}

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
                        {memories.length === 1
                            ? "memory"
                            : "memories"}{" "}
                        in your second brain.
                    </h3>

                    <p className="text-xs text-on-surface-variant/70">
                        Ask me anything about your saved content.
                        Want a summary or insights?
                    </p>
                </div>

                <ArrowRight className="w-4 h-4 text-on-surface-variant/40 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>
        </motion.section>
    );
}