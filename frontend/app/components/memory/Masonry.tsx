"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface MasonryProps<T> {
    items: T[];
    getKey: (item: T) => string | number;
    render: (item: T) => ReactNode;
    /** Columns are at least this wide; as many fit as the space allows. */
    minColumnWidth?: number;
    maxColumns?: number;
    gap?: number;
}

/**
 * Pinterest-style layout: every card goes into the column that is currently shortest, so cards
 * of different heights pack together with no gaps. Cards keep their order (left to right, top
 * to bottom) and stay mounted when the layout changes, so playing videos aren't reset.
 *
 * Positions use top/left, not transforms: a transform would make the cards' fixed-position
 * pop-ups (edit dialog) position themselves inside the card instead of the window.
 */
export function Masonry<T>({ items, getKey, render, minColumnWidth = 280, maxColumns = 4, gap = 16 }: MasonryProps<T>) {
    const container = useRef<HTMLDivElement>(null);
    const nodes = useRef(new Map<string, HTMLDivElement>());
    const [width, setWidth] = useState(0);
    const [heights, setHeights] = useState<Record<string, number>>({});
    const [animate, setAnimate] = useState(false);

    // Re-reads every card's height; only updates state when something actually changed
    const measure = useCallback(() => {
        setHeights((prev) => {
            let changed = false;
            const next: Record<string, number> = {};
            nodes.current.forEach((el, key) => {
                next[key] = el.offsetHeight;
                if (prev[key] !== next[key]) changed = true;
            });
            if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
            return changed ? next : prev;
        });
    }, []);

    const observer = useRef<ResizeObserver | null>(null);
    useLayoutEffect(() => {
        const el = container.current;
        if (!el) return;
        setWidth(el.clientWidth);
        // Cards grow when images load, notes expand or text wraps differently
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === el) setWidth(el.clientWidth);
            }
            measure();
        });
        ro.observe(el);
        nodes.current.forEach((node) => ro.observe(node));
        observer.current = ro;
        return () => {
            ro.disconnect();
            observer.current = null;
        };
    }, [measure]);

    // Measure new or re-rendered cards before the browser paints, so nothing overlaps on screen
    useLayoutEffect(() => {
        measure();
    });

    // Glide cards to new spots on later changes, but don't animate the first layout
    useLayoutEffect(() => {
        if (width > 0 && !animate) {
            const id = requestAnimationFrame(() => setAnimate(true));
            return () => cancelAnimationFrame(id);
        }
    }, [width, animate]);

    // One stable callback for every card (React 19 runs the returned cleanup on unmount)
    const attach = useCallback((el: HTMLDivElement) => {
        const key = el.dataset.key as string;
        nodes.current.set(key, el);
        observer.current?.observe(el);
        return () => {
            observer.current?.unobserve(el);
            if (nodes.current.get(key) === el) nodes.current.delete(key);
        };
    }, []);

    const columns = width > 0 ? Math.max(1, Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap)))) : 1;
    const columnWidth = width > 0 ? (width - gap * (columns - 1)) / columns : 0;

    // Shortest column first; ties go to the leftmost column
    const columnHeights = new Array<number>(columns).fill(0);
    const placed = items.map((item) => {
        const key = String(getKey(item));
        let column = 0;
        for (let c = 1; c < columns; c++) if (columnHeights[c] < columnHeights[column]) column = c;
        const top = columnHeights[column];
        columnHeights[column] += (heights[key] ?? 0) + gap;
        return { item, key, top, left: column * (columnWidth + gap) };
    });
    const height = Math.max(0, ...columnHeights) - gap;

    return (
        <div ref={container} className="relative w-full" style={{ height: width > 0 ? Math.max(height, 0) : undefined }}>
            {placed.map(({ item, key, top, left }) => (
                <div
                    key={key}
                    ref={attach}
                    data-key={key}
                    // Raised while in use, so its pop-ups (collection picker) sit above the cards below
                    className={`hover:z-20 focus-within:z-20 ${width > 0 ? "absolute" : "mb-4"} ${animate ? "transition-[top,left] duration-300 ease-out" : ""}`}
                    style={width > 0 ? { top, left, width: columnWidth, visibility: key in heights ? undefined : "hidden" } : undefined}
                >
                    {render(item)}
                </div>
            ))}
        </div>
    );
}
