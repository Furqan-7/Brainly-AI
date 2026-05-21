"use client";

import { FileText, Trash2 } from "lucide-react";
import type { Memory } from "../../types/memory";
import { deleteMemory } from "../../services/api";

export function ImageCard({
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

    // Extract just the filename from the stored path (handles both / and \ separators)
    const filename = memory.file_path
        ? memory.file_path.replace(/\\/g, "/").split("/").pop()
        : null;
    const imgSrc = filename
        ? `${process.env.NEXT_PUBLIC_API}/uploads/${filename}`
        : null;

    return (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all group relative flex flex-col">
            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-surface-container/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer"
                title="Delete memory"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Image area */}
            <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={memory.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                        <FileText className="w-10 h-10 text-on-surface-variant/30" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant shrink-0">
                        Image
                    </span>
                    <h3 className="text-xs font-semibold leading-tight text-on-surface truncate">
                        {memory.title}
                    </h3>
                </div>
                <span className="text-[9px] text-on-surface-variant/40 shrink-0">
                    {new Date(memory.createdAt).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}
