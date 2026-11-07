"use client";

import { Mic, Trash2 } from "lucide-react";
import type { Memory } from "../../types/memory";
import { deleteMemory, fileUrl } from "../../services/api";

export function AudioCard({
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
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 hover:border-violet-400/40 transition-all group relative flex flex-col gap-3">
            <button
                onClick={handleDelete}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                title="Delete memory"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-violet-500/15 flex items-center justify-center">
                    <Mic className="w-3 h-3 text-violet-600" />
                </div>
                <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">Voice Note</span>
            </div>

            <h3 className="text-sm font-bold leading-snug">{memory.title}</h3>

            {(memory.summary || meta.description) && (
                <p className="text-xs text-on-surface-variant/70 line-clamp-3">{memory.summary || meta.description}</p>
            )}

            {memory.file_path && (
                <audio controls preload="none" src={fileUrl(memory.id)} className="w-full h-9" />
            )}

            <span className="text-[9px] font-medium text-on-surface-variant/50">
                {new Date(memory.createdAt).toLocaleDateString()}
            </span>
        </div>
    );
}
