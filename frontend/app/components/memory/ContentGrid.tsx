"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Brain, Loader2 } from "lucide-react";
import type { Collection, Memory } from "../../types/memory";
import { MemoryCard } from "./MemoryCard";
import { Masonry } from "./Masonry";

interface ContentGridProps {
    memories: Memory[];
    collections?: Collection[];
    onDelete?: (id: number) => void;
    onUpdate?: (memory: Memory) => void;
    onTagClick?: (tag: string) => void;
    onCollectionsChanged?: () => void;
    hasMore?: boolean;
    loadingMore?: boolean;
    onLoadMore?: () => void;
    emptyMessage?: string;
}

export function ContentGrid({
    memories, collections, onDelete, onUpdate, onTagClick, onCollectionsChanged,
    hasMore, loadingMore, onLoadMore, emptyMessage = "No memories yet. Add your first one!",
}: ContentGridProps) {
    const sentinel = useRef<HTMLDivElement>(null);

    // Infinite scroll: load the next page when the sentinel comes into view
    useEffect(() => {
        const el = sentinel.current;
        if (!el || !hasMore || !onLoadMore) return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) onLoadMore();
        }, { rootMargin: "400px" });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, onLoadMore]);

    if (memories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Brain className="w-10 h-10 text-on-surface-variant/20" />
                <p className="text-sm text-on-surface-variant/50">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <>
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-6"
            >
                {/* Pinterest-style: each card fills the shortest column, so no space is wasted */}
                <Masonry
                    items={memories}
                    getKey={(memory) => memory.id}
                    render={(memory) => (
                        <MemoryCard
                            memory={memory}
                            collections={collections}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            onTagClick={onTagClick}
                            onCollectionsChanged={onCollectionsChanged}
                        />
                    )}
                />
            </motion.section>

            <div ref={sentinel} className="flex justify-center py-6">
                {loadingMore && <Loader2 className="w-5 h-5 text-on-surface-variant/40 animate-spin" />}
                {hasMore && !loadingMore && onLoadMore && (
                    <button onClick={onLoadMore} className="text-xs text-on-surface-variant/60 hover:text-on-surface cursor-pointer disabled:cursor-not-allowed">
                        Load more
                    </button>
                )}
            </div>
        </>
    );
}
