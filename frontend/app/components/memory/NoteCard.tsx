"use client";

import { StickyNote, Trash2 } from "lucide-react";
import type { Memory } from "../../types/memory";
import { deleteMemory } from "../../services/api";

export function NoteCard({
    memory,
    onDelete,
}: {
    memory: Memory;
    onDelete?: (id: number) => void;
}) {
    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteMemory(memory.id);
        onDelete?.(memory.id);
    };

    return (
        <div className="bg-surface-container-high/40 border border-outline-variant/10 rounded-xl p-4 hover:bg-surface-container-high/60 transition-all flex flex-col justify-between group relative">
            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer"
                title="Delete memory"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

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
