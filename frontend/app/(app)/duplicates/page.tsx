"use client";

import { PageHeader } from "../AppShell";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Loader2, Merge } from "lucide-react";
import { errorMessage, getDuplicates, mergeMemories } from "@/app/services/api";
import { TYPE_META } from "@/app/components/memory/typeMeta";

type Groups = Awaited<ReturnType<typeof getDuplicates>>;

/** Finds memories saved more than once and merges them (tags, collections and notes are combined). */
export default function DuplicatesPage() {
    const [groups, setGroups] = useState<Groups | null>(null);
    const [keep, setKeep] = useState<Record<string, number>>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        getDuplicates()
            .then((g) => {
                setGroups(g);
                // Default to keeping the oldest copy
                setKeep(Object.fromEntries(g.map((group) => [group.key, group.memories[0].id])));
            })
            .catch((e) => setError(errorMessage(e)));
    }, []);

    const merge = async (key: string) => {
        const group = groups!.find((g) => g.key === key)!;
        const keepId = keep[key];
        setBusy(key);
        setError("");
        try {
            await mergeMemories(keepId, group.memories.map((m) => m.id).filter((id) => id !== keepId));
            setGroups((prev) => prev!.filter((g) => g.key !== key));
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-6">
                <PageHeader eyebrow="Duplicates" title="Saved twice? Keep one.">
                    The same link or note saved more than once. Merging keeps one copy and combines tags, collections and personal notes.
                </PageHeader>
                {error && <p className="text-xs text-error">{error}</p>}

                {groups === null ? (
                    <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant/40 mx-auto" />
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-on-surface-variant/60">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600/70" />
                        <p className="text-sm">No duplicates — your brain is tidy.</p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.key} className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 space-y-3">
                            <p className="text-[11px] text-on-surface-variant/50 truncate">
                                {group.memories[0].source_url ?? "Identical notes"}
                            </p>
                            {group.memories.map((m) => {
                                const meta = TYPE_META[m.type];
                                const Icon = meta.icon;
                                return (
                                    <label key={m.id} className="flex items-center gap-3 text-sm cursor-pointer">
                                        <input
                                            type="radio"
                                            name={group.key}
                                            checked={keep[group.key] === m.id}
                                            onChange={() => setKeep((k) => ({ ...k, [group.key]: m.id }))}
                                            className="accent-primary"
                                        />
                                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                        <span className="flex-1 truncate">{m.title}</span>
                                        <span className="text-[11px] text-on-surface-variant/50">{new Date(m.createdAt).toLocaleDateString()}</span>
                                    </label>
                                );
                            })}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => merge(group.key)}
                                    disabled={busy === group.key}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container text-xs font-bold disabled:opacity-50 cursor-pointer"
                                >
                                    {busy === group.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
                                    Keep selected, merge {group.memories.length - 1} other{group.memories.length > 2 ? "s" : ""}
                                </button>
                            </div>
                        </div>
                    ))
                )}
        </div>
    );
}
