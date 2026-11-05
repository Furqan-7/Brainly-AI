"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, History, RotateCcw, Sparkles } from "lucide-react";
import { getRediscover, reviewMemory } from "../../services/api";
import type { RediscoverItem } from "../../types/memory";
import { sourceHref } from "../chat/SourceCard";
import { TYPE_META } from "./typeMeta";

function ItemRow({ item, onReviewed }: { item: RediscoverItem; onReviewed?: (id: number) => void }) {
    const meta = TYPE_META[item.type];
    const Icon = meta?.icon ?? Sparkles;
    const href = sourceHref({ source_url: item.source_url, has_file: item.has_file, memoryId: item.id });

    const review = async (remembered: boolean) => {
        await reviewMemory(item.id, remembered);
        onReviewed?.(item.id);
    };

    return (
        <div className="flex items-start gap-3 py-2.5">
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${meta?.color ?? ""}`} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">{item.title}</span>
                    {href && (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant/40 hover:text-primary">
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
                {(item.summary || item.metadata?.description) && (
                    <p className="text-xs text-on-surface-variant/60 line-clamp-2">{item.summary || item.metadata?.description}</p>
                )}
                <span className="text-[10px] text-on-surface-variant/40">Saved {new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            {onReviewed && (
                <div className="flex gap-1 shrink-0">
                    <button
                        onClick={() => review(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 cursor-pointer"
                        title="I remember this — show it less often"
                    >
                        <Check className="w-3 h-3" /> Got it
                    </button>
                    <button
                        onClick={() => review(false)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-on-surface/5 text-on-surface-variant hover:bg-on-surface/10 cursor-pointer"
                        title="Show me this again soon"
                    >
                        <RotateCcw className="w-3 h-3" /> Again
                    </button>
                </div>
            )}
        </div>
    );
}

/** Daily digest: memories due for spaced-repetition review, plus a forgotten throwback. */
export function RediscoverPanel() {
    const [due, setDue] = useState<RediscoverItem[]>([]);
    const [throwback, setThrowback] = useState<RediscoverItem | null>(null);

    useEffect(() => {
        getRediscover()
            .then((r) => {
                setDue(r.due);
                setThrowback(r.throwback);
            })
            .catch(() => undefined);
    }, []);

    if (due.length === 0 && !throwback) return null;

    return (
        <section className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-5">
            <div className="flex items-center gap-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[9px] font-bold tracking-widest uppercase text-primary">Rediscover</span>
            </div>
            {due.length > 0 && (
                <>
                    <h3 className="text-sm font-bold mb-1">Worth a second look today</h3>
                    <div className="divide-y divide-on-surface/5">
                        {due.map((item) => (
                            <ItemRow key={item.id} item={item} onReviewed={(id) => setDue((prev) => prev.filter((d) => d.id !== id))} />
                        ))}
                    </div>
                </>
            )}
            {throwback && (
                <div className={due.length > 0 ? "mt-3 pt-3 border-t border-on-surface/5" : ""}>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" /> Throwback
                    </h3>
                    <ItemRow item={throwback} />
                </div>
            )}
        </section>
    );
}
