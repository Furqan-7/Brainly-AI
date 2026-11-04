"use client";

/**
 * hooks/useMemories.ts
 *
 * Paginated memory list for the dashboard: refetches when the query changes, loads more
 * pages on demand (infinite scroll), and polls memories that are still being processed.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getMemories, getMemoryStatuses, isAuthError } from "../services/api";
import type { Memory, MemoryQuery } from "../types/memory";

const POLL_MS = 3000;

export function useMemories(query: MemoryQuery) {
    const router = useRouter();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    // The query whose results are currently shown; while it differs from queryKey we're loading
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestId = useRef(0);
    const queryKey = JSON.stringify(query);

    const handleError = useCallback((err: unknown) => {
        if (isAuthError(err)) {
            // Session expired or invalid — send user back to landing page
            router.replace("/");
            return;
        }
        setError("Failed to load memories.");
        console.error(err);
    }, [router]);

    const fetchMemories = useCallback(async () => {
        const id = ++requestId.current;
        try {
            const page = await getMemories(JSON.parse(queryKey));
            if (id !== requestId.current) return; // a newer query superseded this one
            setMemories(page.memories);
            setNextCursor(page.nextCursor);
            setError(null);
        } catch (err) {
            if (id === requestId.current) handleError(err);
        } finally {
            if (id === requestId.current) setLoadedKey(queryKey);
        }
    }, [queryKey, handleError]);

    // Refetch from scratch whenever the query changes
    useEffect(() => {
        const id = ++requestId.current;
        getMemories(JSON.parse(queryKey))
            .then((page) => {
                if (id !== requestId.current) return;
                setMemories(page.memories);
                setNextCursor(page.nextCursor);
                setError(null);
            })
            .catch((err) => id === requestId.current && handleError(err))
            .finally(() => id === requestId.current && setLoadedKey(queryKey));
    }, [queryKey, handleError]);

    const loadMore = useCallback(async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const page = await getMemories(JSON.parse(queryKey), nextCursor);
            setMemories((prev) => [...prev, ...page.memories.filter((m) => !prev.some((p) => p.id === m.id))]);
            setNextCursor(page.nextCursor);
        } catch (err) {
            handleError(err);
        } finally {
            setLoadingMore(false);
        }
    }, [nextCursor, loadingMore, queryKey, handleError]);

    // Poll memories that are still pending/processing until they're ready or failed
    const inFlight = memories.filter((m) => m.status === "pending" || m.status === "processing").map((m) => m.id);
    const inFlightKey = inFlight.join(",");
    useEffect(() => {
        if (!inFlightKey) return;
        const timer = setInterval(async () => {
            try {
                const updated = await getMemoryStatuses(inFlightKey.split(",").map(Number));
                setMemories((prev) => prev.map((m) => updated.find((u) => u.id === m.id) ?? m));
            } catch {
                /* transient — try again next tick */
            }
        }, POLL_MS);
        return () => clearInterval(timer);
    }, [inFlightKey]);

    const upsertMemory = useCallback((memory: Memory) => {
        setMemories((prev) => prev.map((m) => (m.id === memory.id ? { ...m, ...memory } : m)));
    }, []);

    const removeMemory = useCallback((id: number) => {
        setMemories((prev) => prev.filter((m) => m.id !== id));
    }, []);

    return {
        memories,
        loading: loadedKey !== queryKey,
        loadingMore,
        hasMore: nextCursor !== null,
        error,
        processingCount: inFlight.length,
        fetchMemories,
        loadMore,
        upsertMemory,
        removeMemory,
    };
}
