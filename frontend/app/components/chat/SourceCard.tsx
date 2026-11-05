"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Play, X } from "lucide-react";
import type { Source } from "../../types/memory";
import { fileUrl } from "../../services/api";
import { TYPE_META } from "../memory/typeMeta";

/** Link that opens the original content: the saved URL, or the uploaded file. */
export function sourceHref(source: Pick<Source, "source_url" | "has_file" | "memoryId">): string | null {
    if (source.source_url) return source.source_url;
    if (source.has_file) return fileUrl(source.memoryId);
    return null;
}

/** Embeddable player URL for videos, so they can be watched without leaving Brainly. */
export function embedUrl(type: string, url: string | null): string | null {
    if (!url) return null;
    if (type === "reel") {
        // https://instagram.com/reel/ABC123/?igsh=... -> https://www.instagram.com/reel/ABC123/embed
        const m = url.match(/instagram\.com\/(reel|reels|p|tv)\/([\w-]+)/i);
        if (!m) return null;
        const kind = m[1].toLowerCase() === "reels" ? "reel" : m[1].toLowerCase();
        return `https://www.instagram.com/${kind}/${m[2]}/embed`;
    }
    if (type === "tiktok") {
        const m = url.match(/\/video\/(\d+)/);
        return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    }
    if (type === "youtube") {
        const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/i);
        return m ? `https://www.youtube.com/embed/${m[1]}` : null;
    }
    return null;
}

export function SourceCard({ source, highlighted = false }: { source: Source; highlighted?: boolean }) {
    const [playing, setPlaying] = useState(false);
    const [thumbFailed, setThumbFailed] = useState(false);

    const meta = TYPE_META[source.type as keyof typeof TYPE_META];
    const Icon = meta?.icon ?? ExternalLink;
    const href = sourceHref(source);
    const player = embedUrl(source.type, source.source_url);
    const vertical = source.type === "reel" || source.type === "tiktok";
    const showThumb = source.thumbnail && !thumbFailed;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`border transition-all overflow-hidden ${highlighted
                ? "bg-primary/5 border-primary"
                : "bg-surface-container-lowest border-outline-variant hover:border-on-surface"
                }`}
        >
            <div className="flex items-center gap-3 p-3">
                <span className="w-5 h-5 shrink-0 rounded-md bg-on-surface/8 text-[10px] font-bold text-on-surface flex items-center justify-center">
                    {source.n}
                </span>
                {showThumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={source.thumbnail!}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() => setThumbFailed(true)}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                        <Icon size={12} className={meta?.color ?? "text-primary"} />
                        <span>{meta?.label ?? source.type}</span>
                    </div>
                    {href ? (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-medium text-on-surface hover:text-primary truncate"
                        >
                            {source.title}
                        </a>
                    ) : (
                        <span className="block text-sm font-medium text-on-surface truncate">{source.title}</span>
                    )}
                    {source.snippet && <span className="block text-[11px] text-on-surface-variant line-clamp-1">{source.snippet}</span>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {player && (
                        <button
                            onClick={() => setPlaying((p) => !p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary-container text-white hover:bg-black transition-colors cursor-pointer active:scale-95"
                            title={playing ? "Hide video" : "Watch here"}
                        >
                            {playing ? <X size={12} /> : <Play size={12} fill="currentColor" />}
                            {playing ? "Hide" : "Watch"}
                        </button>
                    )}
                    {href && (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8 transition-colors"
                            title="Open original"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>
            </div>

            {playing && player && (
                <div className="px-3 pb-3 flex justify-center">
                    <iframe
                        src={player}
                        title={source.title}
                        className={`w-full rounded-lg border-0 bg-black ${vertical ? "max-w-[340px]" : ""}`}
                        style={{ aspectRatio: vertical ? "9/16" : "16/9", maxHeight: "600px" }}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            )}
        </motion.div>
    );
}
