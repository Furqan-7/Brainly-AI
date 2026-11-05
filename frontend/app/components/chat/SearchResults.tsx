"use client";

import { useEffect, useState } from "react";
import { Loader2, SearchX } from "lucide-react";
import { searchMemories, errorMessage } from "../../services/api";
import { SourceCard } from "./SourceCard";
import type { SearchFilters, Source } from "../../types/memory";

/** Plain search mode: ranked matching memories, no AI answer (instant and free). */
export function SearchResults({ query }: { query: { text: string; nonce: number; filters: SearchFilters } | null }) {
    const [state, setState] = useState<{ nonce: number; results: Source[] | null; error: string }>({ nonce: 0, results: null, error: "" });

    useEffect(() => {
        if (!query?.text.trim()) return;
        let cancelled = false;
        searchMemories(query.text, query.filters)
            .then((results) => !cancelled && setState({ nonce: query.nonce, results, error: "" }))
            .catch((e) => !cancelled && setState({ nonce: query.nonce, results: null, error: errorMessage(e) }));
        return () => {
            cancelled = true;
        };
    }, [query]);

    if (!query) return null;
    const loading = state.nonce !== query.nonce;
    const { results, error } = state;

    return (
        <div className="w-full max-w-3xl space-y-2">
            {loading && (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant px-1">
                    <Loader2 size={12} className="animate-spin" /> Searching…
                </div>
            )}
            {!loading && error && <p className="text-sm text-error px-1">{error}</p>}
            {!loading && results && results.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant px-1 py-4">
                    <SearchX size={16} /> Nothing matched “{query.text}”.
                </div>
            )}
            {!loading && results && results.length > 0 && (
                <>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant px-1">
                        {results.length} matching {results.length === 1 ? "memory" : "memories"}
                    </p>
                    {results.map((source) => (
                        <SourceCard key={source.memoryId} source={source} />
                    ))}
                </>
            )}
        </div>
    );
}
