"use client";

import { PageHeader } from "../AppShell";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, List, Loader2, Network, X } from "lucide-react";
import { getGraph } from "@/app/services/api";
import type { GraphEdge, GraphNode, MemoryType } from "@/app/types/memory";

const SURFACE = "#fffcf9";
const WIDTH = 1000;
const HEIGHT = 680;

// Nine memory types fold into six families so each gets a distinct, validated categorical
// color (light-surface slots 1–6, fixed order; checked with the dataviz palette validator).
// Three sit under 3:1 against the card, so identity never relies on color alone: legend,
// tooltip, focus labels and the list view all name each family.
const FAMILIES = [
    { id: "web", label: "Web pages", color: "#2a78d6", types: ["url"] },
    { id: "video", label: "Videos", color: "#eb6834", types: ["youtube", "reel", "tiktok"] },
    { id: "tweet", label: "Tweets", color: "#1baf7a", types: ["tweet"] },
    { id: "doc", label: "Documents", color: "#eda100", types: ["pdf", "image"] },
    { id: "note", label: "Notes", color: "#e87ba4", types: ["note"] },
    { id: "voice", label: "Voice notes", color: "#008300", types: ["audio"] },
] as const;

function familyOf(type: MemoryType) {
    return FAMILIES.find((f) => (f.types as readonly string[]).includes(type)) ?? FAMILIES[0];
}

interface Positioned extends GraphNode {
    x: number;
    y: number;
}

/** A small force-directed layout: node repulsion, edge springs weighted by similarity, centering. */
function layout(nodes: GraphNode[], edges: GraphEdge[]): Positioned[] {
    const pts = nodes.map((n, i) => {
        const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
        const radius = 200 + (i % 7) * 25;
        return { ...n, x: WIDTH / 2 + Math.cos(angle) * radius, y: HEIGHT / 2 + Math.sin(angle) * radius, vx: 0, vy: 0 };
    });
    const index = new Map(pts.map((p, i) => [p.id, i]));
    const links = edges
        .map((e) => ({ a: index.get(e.source), b: index.get(e.target), w: e.similarity }))
        .filter((l): l is { a: number; b: number; w: number } => l.a !== undefined && l.b !== undefined);

    const repulsion = 2200;
    for (let iter = 0; iter < 300; iter++) {
        const cooling = 1 - iter / 300;
        for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                const dx = pts[i].x - pts[j].x;
                const dy = pts[i].y - pts[j].y;
                const d2 = Math.max(dx * dx + dy * dy, 25);
                const f = repulsion / d2;
                const d = Math.sqrt(d2);
                pts[i].vx += (dx / d) * f; pts[i].vy += (dy / d) * f;
                pts[j].vx -= (dx / d) * f; pts[j].vy -= (dy / d) * f;
            }
        }
        for (const { a, b, w } of links) {
            const dx = pts[b].x - pts[a].x;
            const dy = pts[b].y - pts[a].y;
            const d = Math.sqrt(dx * dx + dy * dy) || 1;
            const target = 140 - w * 80; // more similar → closer
            const f = (d - target) * 0.02 * w;
            pts[a].vx += (dx / d) * f; pts[a].vy += (dy / d) * f;
            pts[b].vx -= (dx / d) * f; pts[b].vy -= (dy / d) * f;
        }
        for (const p of pts) {
            p.vx += (WIDTH / 2 - p.x) * 0.004;
            p.vy += (HEIGHT / 2 - p.y) * 0.004;
            p.x += Math.max(-20, Math.min(20, p.vx)) * cooling;
            p.y += Math.max(-20, Math.min(20, p.vy)) * cooling;
            p.vx *= 0.5;
            p.vy *= 0.5;
        }
    }
    return pts.map(({ vx: _vx, vy: _vy, ...p }) => p);
}

/**
 * Pointer position for an element placed with `position: fixed` inside the app shell, which is
 * scaled with CSS zoom on desktop (--ui-zoom); without this the tooltip drifts from the pointer.
 */
function pointerInZoom(e: React.PointerEvent<Element>) {
    const zoom = parseFloat(getComputedStyle(e.currentTarget).getPropertyValue("--ui-zoom")) || 1;
    return { x: e.clientX / zoom, y: e.clientY / zoom };
}

export default function GraphPage() {
    const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
    const [hover, setHover] = useState<{ node: Positioned; x: number; y: number } | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [listView, setListView] = useState(false);
    const [view, setView] = useState({ x: 0, y: 0, k: 1 });
    const drag = useRef<{ x: number; y: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        getGraph().then(setData).catch(() => setData({ nodes: [], edges: [] }));
    }, []);

    const nodes = useMemo(() => (data ? layout(data.nodes, data.edges) : []), [data]);
    // Fit the view box to the laid-out nodes (with room for labels) so small graphs aren't tiny
    const box = useMemo(() => {
        if (nodes.length === 0) return { x: 0, y: 0, w: WIDTH, h: HEIGHT };
        const xs = nodes.map((n) => n.x);
        const ys = nodes.map((n) => n.y);
        const pad = 60;
        let x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
        let w = Math.max(...xs) - x + pad + 160, h = Math.max(...ys) - y + pad;
        // don't zoom in so far that dots and labels become huge
        if (w < 640) { x -= (640 - w) / 2; w = 640; }
        // keep the canvas aspect ratio
        const ratio = WIDTH / HEIGHT;
        if (w / h > ratio) { const nh = w / ratio; y -= (nh - h) / 2; h = nh; } else { const nw = h * ratio; x -= (nw - w) / 2; w = nw; }
        return { x, y, w, h };
    }, [nodes]);
    const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
    const neighbors = useMemo(() => {
        const map = new Map<number, { id: number; similarity: number }[]>();
        for (const e of data?.edges ?? []) {
            map.set(e.source, [...(map.get(e.source) ?? []), { id: e.target, similarity: e.similarity }]);
            map.set(e.target, [...(map.get(e.target) ?? []), { id: e.source, similarity: e.similarity }]);
        }
        return map;
    }, [data]);

    const focus = selected ?? hover?.node.id ?? null;
    const focusSet = focus !== null ? new Set([focus, ...(neighbors.get(focus) ?? []).map((n) => n.id)]) : null;
    const selectedNode = selected !== null ? byId.get(selected) : null;
    const counts = FAMILIES.map((f) => ({ ...f, count: nodes.filter((n) => familyOf(n.type).id === f.id).length }));

    const onWheel = (e: React.WheelEvent) => {
        const k = Math.min(4, Math.max(0.4, view.k * (e.deltaY < 0 ? 1.1 : 0.9)));
        setView((v) => ({ ...v, k }));
    };

    return (
        <div className="space-y-6">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <PageHeader eyebrow="Knowledge graph" title="How your saves connect.">
                        Each dot is a memory; lines connect memories about similar things. Click a dot to see its neighbours.
                    </PageHeader>
                    <button
                        onClick={() => setListView((l) => !l)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-on-surface/5 border border-on-surface/10 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                        {listView ? <Network className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                        {listView ? "Graph view" : "List view"}
                    </button>
                </header>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {counts.filter((f) => f.count > 0).map((f) => (
                        <span key={f.id} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />
                            {f.label} <span className="text-on-surface-variant/50">{f.count}</span>
                        </span>
                    ))}
                </div>

                {!data ? (
                    <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant/40 mx-auto mt-20" />
                ) : nodes.length < 2 ? (
                    <p className="text-sm text-on-surface-variant/60 text-center py-20">
                        Save a few more memories and they&apos;ll start connecting here.
                    </p>
                ) : listView ? (
                    <div className="rounded-xl border border-outline-variant/10 divide-y divide-on-surface/5">
                        {nodes
                            .slice()
                            .sort((a, b) => (neighbors.get(b.id)?.length ?? 0) - (neighbors.get(a.id)?.length ?? 0))
                            .map((n) => (
                                <div key={n.id} className="px-4 py-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: familyOf(n.type).color }} />
                                        {n.title}
                                        <span className="text-[11px] font-normal text-on-surface-variant/50">
                                            {familyOf(n.type).label} · {neighbors.get(n.id)?.length ?? 0} connections
                                        </span>
                                    </div>
                                    {(neighbors.get(n.id) ?? []).length > 0 && (
                                        <p className="text-xs text-on-surface-variant/60 mt-1 pl-4">
                                            Related: {(neighbors.get(n.id) ?? []).slice(0, 6).map((x) => byId.get(x.id)?.title).join(" · ")}
                                        </p>
                                    )}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="relative rounded-xl border border-outline-variant/10 overflow-hidden" style={{ background: SURFACE }}>
                        <svg
                            ref={svgRef}
                            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
                            className="w-full h-auto touch-none select-none cursor-grab active:cursor-grabbing"
                            onWheel={onWheel}
                            onPointerDown={(e) => {
                                drag.current = { x: e.clientX, y: e.clientY };
                                setDragging(true);
                            }}
                            onPointerMove={(e) => {
                                if (!drag.current || !svgRef.current) return;
                                // on-screen width, so dragging keeps pace with the pointer when the app is zoomed
                                const scale = box.w / svgRef.current.getBoundingClientRect().width / view.k;
                                setView((v) => ({ ...v, x: v.x + (e.clientX - drag.current!.x) * scale, y: v.y + (e.clientY - drag.current!.y) * scale }));
                                drag.current = { x: e.clientX, y: e.clientY };
                            }}
                            onPointerUp={() => {
                                drag.current = null;
                                setDragging(false);
                            }}
                            onPointerLeave={() => {
                                drag.current = null;
                                setDragging(false);
                            }}
                            onClick={(e) => e.target === svgRef.current && setSelected(null)}
                        >
                            <g transform={`translate(${box.x + box.w / 2} ${box.y + box.h / 2}) scale(${view.k}) translate(${-(box.x + box.w / 2) + view.x} ${-(box.y + box.h / 2) + view.y})`}>
                                {data.edges.map((e) => {
                                    const a = byId.get(e.source);
                                    const b = byId.get(e.target);
                                    if (!a || !b) return null;
                                    const active = focus !== null && (e.source === focus || e.target === focus);
                                    return (
                                        <line
                                            key={`${e.source}-${e.target}`}
                                            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                                            stroke={active ? "#6d6966" : "#d8d1cc"}
                                            strokeWidth={active ? 1.5 : 1}
                                            strokeOpacity={focusSet && !active ? 0.15 : 0.35 + (e.similarity - 0.5)}
                                        />
                                    );
                                })}
                                {nodes.map((n) => {
                                    const dim = focusSet && !focusSet.has(n.id);
                                    const r = 5 + Math.min(4, (neighbors.get(n.id)?.length ?? 0) * 0.5);
                                    return (
                                        <g key={n.id} opacity={dim ? 0.25 : 1}>
                                            {/* invisible larger hit target */}
                                            <circle
                                                cx={n.x} cy={n.y} r={r + 6} fill="transparent" className="cursor-pointer"
                                                onPointerEnter={(e) => setHover({ node: n, ...pointerInZoom(e) })}
                                                onPointerMove={(e) => setHover({ node: n, ...pointerInZoom(e) })}
                                                onPointerLeave={() => setHover(null)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelected((s) => (s === n.id ? null : n.id));
                                                }}
                                            />
                                            <circle cx={n.x} cy={n.y} r={r} fill={familyOf(n.type).color} stroke={SURFACE} strokeWidth={2} pointerEvents="none" />
                                            {(n.id === focus || (focusSet?.has(n.id) && view.k > 1.3)) && (
                                                <text x={n.x + r + 4} y={n.y + 4} fontSize={12} fill="#141414" pointerEvents="none">
                                                    {n.title.length > 40 ? `${n.title.slice(0, 40)}…` : n.title}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>

                        {/* Tooltip */}
                        {hover && !dragging && (
                            <div
                                className="fixed z-50 pointer-events-none rounded-lg bg-surface-container-lowest border border-on-surface/10 px-3 py-2 shadow-xl max-w-xs"
                                style={{ left: hover.x + 14, top: hover.y + 14 }}
                            >
                                <p className="text-xs font-semibold text-on-surface">{hover.node.title}</p>
                                <p className="text-[11px] text-on-surface-variant/70">
                                    {familyOf(hover.node.type).label} · {neighbors.get(hover.node.id)?.length ?? 0} connections
                                </p>
                            </div>
                        )}

                        {/* Selection panel */}
                        {selectedNode && (
                            <div className="absolute top-3 right-3 w-72 max-h-[90%] overflow-y-auto rounded-xl bg-surface-container-lowest/95 border border-on-surface/10 p-4 space-y-3">
                                <div className="flex items-start gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: familyOf(selectedNode.type).color }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold">{selectedNode.title}</p>
                                        <p className="text-[11px] text-on-surface-variant/60">{familyOf(selectedNode.type).label}</p>
                                    </div>
                                    <button onClick={() => setSelected(null)} className="text-on-surface-variant/50 hover:text-on-surface cursor-pointer">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {selectedNode.source_url && (
                                    <a href={selectedNode.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        Open original <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40 mb-1">Related memories</p>
                                    {(neighbors.get(selectedNode.id) ?? []).length === 0 && (
                                        <p className="text-xs text-on-surface-variant/50">No close matches yet.</p>
                                    )}
                                    {(neighbors.get(selectedNode.id) ?? [])
                                        .sort((a, b) => b.similarity - a.similarity)
                                        .map((nb) => {
                                            const n = byId.get(nb.id);
                                            return n ? (
                                                <button
                                                    key={nb.id}
                                                    onClick={() => setSelected(nb.id)}
                                                    className="w-full flex items-center gap-2 py-1 text-left text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
                                                >
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: familyOf(n.type).color }} />
                                                    <span className="truncate flex-1">{n.title}</span>
                                                    <span className="text-on-surface-variant/40">{Math.round(nb.similarity * 100)}%</span>
                                                </button>
                                            ) : null;
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
        </div>
    );
}
