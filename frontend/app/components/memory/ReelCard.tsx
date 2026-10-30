"use client";

import { useState } from "react";
import { Clapperboard, ExternalLink, Play, Trash2 } from "lucide-react";
import type { Memory } from "../../types/memory";
import { deleteMemory } from "../../services/api";

export function ReelCard({
    memory,
    onDelete,
}: {
    memory: Memory;
    onDelete?: (id: number) => void;
}) {
    const meta = memory.metadata ?? {};
    // Instagram CDN thumbnails expire, so fall back to the icon if the image fails
    const [thumbFailed, setThumbFailed] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteMemory(memory.id);
        onDelete?.(memory.id);
    };

    return (
        <div className="flex flex-col bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden hover:border-pink-500/40 transition-all group relative">
            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-surface-container/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer"
                title="Delete memory"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Thumbnail */}
            <a
                href={memory.source_url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden block"
                style={{ aspectRatio: "4/5" }}
            >
                {meta.thumbnail_url && !thumbFailed ? (
                    <img
                        src={meta.thumbnail_url}
                        alt={memory.title}
                        referrerPolicy="no-referrer"
                        onError={() => setThumbFailed(true)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/30 via-pink-500/20 to-orange-400/30 flex items-center justify-center">
                        <Clapperboard className="w-10 h-10 text-white/40" />
                    </div>
                )}

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-10 h-10 text-white" fill="white" />
                </div>
            </a>

            {/* Info */}
            <div className="p-4 flex flex-col gap-2">
                <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                            <Clapperboard className="w-3 h-3 text-pink-500" />
                            <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                Instagram Reel{meta.author ? ` · @${meta.author}` : ""}
                            </span>
                        </div>
                        {memory.source_url && (
                            <a
                                href={memory.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open on Instagram"
                            >
                                <ExternalLink className="w-3 h-3 text-on-surface-variant/40 hover:text-pink-500 transition-colors" />
                            </a>
                        )}
                    </div>

                    <h3 className="text-sm font-bold leading-snug mb-1.5">{memory.title}</h3>

                    {(meta.context || meta.description) && (
                        <p className="text-xs text-on-surface-variant/70 line-clamp-3">
                            {meta.context || meta.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 mt-1">
                    <span className="text-[9px] font-medium text-on-surface-variant/50">
                        {new Date(memory.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
