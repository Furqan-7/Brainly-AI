"use client";

import { Video, ExternalLink, Bookmark, Trash2 } from "lucide-react";
import type { Memory } from "../../types/memory";
import { deleteMemory } from "../../services/api";

export function YoutubeCard({
    memory,
    onDelete,
}: {
    memory: Memory;
    onDelete?: (id: number) => void;
}) {
    const meta = memory.metadata ?? {};

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteMemory(memory.id);
        onDelete?.(memory.id);
    };

    return (
        <div className="flex flex-col bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all group relative">
            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-surface-container/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer"
                title="Delete memory"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Thumbnail */}
            <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
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

                {memory.source_url ? (
                    <a
                        href={memory.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Video className="w-10 h-10 text-white" fill="white" />
                    </a>
                ) : (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Video className="w-10 h-10 text-white" fill="white" />
                    </div>
                )}

                {meta.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        {meta.duration}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-2">
                <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                            <Video className="w-3 h-3 text-red-500" fill="#ef4444" />
                            <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                YouTube Memory
                            </span>
                        </div>
                        {memory.source_url && (
                            <a
                                href={memory.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open on YouTube"
                            >
                                <ExternalLink className="w-3 h-3 text-on-surface-variant/40 hover:text-red-500 transition-colors" />
                            </a>
                        )}
                    </div>

                    <h3 className="text-sm font-bold leading-snug mb-1.5">{memory.title}</h3>

                    {meta.description && (
                        <p className="text-xs text-on-surface-variant/70 line-clamp-3">
                            {meta.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 mt-1">
                    <span className="text-[9px] font-medium text-on-surface-variant/50">
                        {new Date(memory.createdAt).toLocaleDateString()}
                    </span>
                    <Bookmark className="w-3.5 h-3.5 text-on-surface-variant/40 hover:text-primary transition-colors cursor-pointer" />
                </div>
            </div>
        </div>
    );
}
