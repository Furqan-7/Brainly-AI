"use client";

import { FileText, Trash2 } from "lucide-react";
import type { Memory } from "../../types/memory";
import { deleteMemory } from "../../services/api";

export function PdfCard({
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
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 hover:border-secondary/40 transition-all group relative overflow-hidden">
            {/* Delete button */}
            <button
                onClick={handleDelete}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200 cursor-pointer"
                title="Delete memory"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>

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

                    <h3 className="text-sm font-bold leading-snug">{memory.title}</h3>

                    <div className="space-y-1">
                        <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-container rounded-full transition-all"
                                style={{
                                    width:
                                        memory.status === "ready"
                                            ? "100%"
                                            : memory.status === "processing"
                                            ? "60%"
                                            : "10%",
                                }}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-on-surface-variant/60">
                            <span>
                                {memory.status === "ready" ? "Analyzed" : memory.status}
                            </span>
                            {meta.file_size_mb && <span>{meta.file_size_mb} MB</span>}
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
