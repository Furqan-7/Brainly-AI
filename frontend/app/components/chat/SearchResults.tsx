"use client";

import { useEffect, useState } from "react";
import { Loader2, SearchX } from "lucide-react";
import { searchMemories, errorMessage } from "../../services/api";
import { SourceTile } from "./Sources";
import type { SearchFilters, Source } from "../../types/memory";

/** Plain search mode: ranked matching memories as cards, no AI answer (instant and free). */
export function SearchResults({
    query,
    activeN,
    onOpen,
}: {
    query: { text: string; nonce: number; filters: SearchFilters } | null;
    activeN: number | null;
    onOpen: (sources: Source[], n: number) => void;
}) {
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
        <div className="grid gap-3">
            {loading && (
                <div className="flex items-center gap-2 px-1 text-sm text-on-surface-variant">
                    <Loader2 className="size-4 animate-spin" /> Searching…
                </div>
            )}
            {!loading && error && <p className="px-1 text-sm text-error">{error}</p>}
            {!loading && results && results.length === 0 && (
                <div className="flex items-center gap-2 px-1 py-4 text-sm text-on-surface-variant">
                    <SearchX className="size-4" /> Nothing matched “{query.text}”.
                </div>
            )}
            {!loading && results && results.length > 0 && (
                <>
                    <p className="px-1 text-[11px] font-medium tracking-[0.08em] text-on-surface-variant uppercase">
                        {results.length} matching {results.length === 1 ? "memory" : "memories"}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                        {results.map((source) => (
                            <SourceTile key={source.memoryId} source={source} active={activeN === source.n} onOpen={() => onOpen(results, source.n)} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
