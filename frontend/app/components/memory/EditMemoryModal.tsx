"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { Memory } from "../../types/memory";
import { errorMessage, updateMemory } from "../../services/api";

const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all";
const labelClass = "block text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5";

/** Edit title, note, personal context and tags. Text changes re-index the memory. */
export function EditMemoryModal({ memory, onClose, onSaved }: { memory: Memory; onClose: () => void; onSaved: (m: Memory) => void }) {
    const [title, setTitle] = useState(memory.title);
    const [note, setNote] = useState(memory.note ?? "");
    const [context, setContext] = useState(memory.metadata?.context ?? "");
    const [tags, setTags] = useState(memory.tags.join(", "));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const save = async () => {
        setSaving(true);
        setError("");
        try {
            const updated = await updateMemory(memory.id, {
                title,
                context,
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                ...(memory.type === "note" ? { note } : {}),
            });
            onSaved(updated);
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Edit memory</h2>
                    <button onClick={onClose} className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer">
                        <X size={15} />
                    </button>
                </div>

                <div>
                    <label className={labelClass}>Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
                </div>

                {memory.type === "note" && (
                    <div>
                        <label className={labelClass}>Note</label>
                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={6} className={`${inputClass} resize-y`} />
                    </div>
                )}

                <div>
                    <label className={labelClass}>Personal context</label>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        rows={2}
                        placeholder="Why did you save this?"
                        className={`${inputClass} resize-none`}
                    />
                </div>

                <div>
                    <label className={labelClass}>Tags (comma separated)</label>
                    <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="projects, career" className={inputClass} />
                </div>

                <p className="text-[11px] text-white/30">Changing the title, note or context re-indexes this memory for search.</p>
                {error && <p className="text-xs text-red-400">{error}</p>}

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/6 cursor-pointer">
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={saving || !title.trim()}
                        className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                    >
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
