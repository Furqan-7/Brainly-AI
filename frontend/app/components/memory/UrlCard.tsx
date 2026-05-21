"use client";

import { ExternalLink, Globe, Trash2 } from "lucide-react";
import type { Memory } from "../../types/memory";
import { deleteMemory } from "../../services/api";

export function UrlCard({
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
        <div className="bg-surface-container-high/40 border border-outline-variant/10 rounded-xl p-4 hover:bg-surface-container-high/60 transition-all flex flex-col justify-between group relative">
            {/* Delete button — shifted left so it doesn't overlap the ExternalLink icon */}
            <button
                onClick={handleDelete}
                className="absolute top-2 right-8 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer"
                title="Delete memory"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

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
                        <a href={memory.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 text-on-surface-variant/40 hover:text-primary transition-colors" />
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

            <div className="mt-3 text-[9px] text-on-surface-variant/40 truncate">
                {memory.source_url}
            </div>
        </div>
    );
}
