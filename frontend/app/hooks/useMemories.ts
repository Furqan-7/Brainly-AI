"use client";

/**
 * hooks/useMemories.ts
 *
 * Encapsulates all memory-fetching logic that previously lived inline
 * inside chat/page.tsx. The page component now only calls this hook.
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMemories } from "../services/api";
import type { Memory } from "../types/memory";

export function useMemories() {
    const router = useRouter();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMemories = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/");
                return;
            }
            const data = await getMemories();
            setMemories(data.filter(Boolean));
        } catch (err) {
            setError("Failed to load memories.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [router]);

    /** Poll every 2 s for up to 30 s, stopping once a new memory appears. */
    const pollUntilNewMemory = useCallback(async () => {
        const prevCount = memories.length;
        setRefreshing(true);
        const maxAttempts = 15;

        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const token = localStorage.getItem("token");
            if (!token) break;
            try {
                const latest = await getMemories();
                if (latest.length > prevCount) {
                    setMemories(latest.filter(Boolean));
                    break;
                }
            } catch {
                break;
            }
        }
        setRefreshing(false);
    }, [memories.length]);

    const handleDelete = useCallback((id: number) => {
        setMemories((prev) => prev.filter((m) => m.id !== id));
    }, []);

    return {
        memories,
        loading,
        error,
        refreshing,
        fetchMemories,
        pollUntilNewMemory,
        handleDelete,
    };
}
