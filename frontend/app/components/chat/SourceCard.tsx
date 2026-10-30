"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
    Clapperboard,
    ExternalLink,
    FileText,
    Globe,
    Image,
    MessageSquare,
    Play,
    StickyNote,
    Video,
    X,
} from "lucide-react";
import type { Source } from "../../types/memory";

const TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
    reel: { label: "Instagram Reel", icon: <Clapperboard size={12} className="text-pink-400" /> },
    youtube: { label: "YouTube", icon: <Video size={12} className="text-red-400" /> },
    url: { label: "Web Page", icon: <Globe size={12} className="text-indigo-400" /> },
    tweet: { label: "Tweet", icon: <MessageSquare size={12} className="text-sky-400" /> },
    pdf: { label: "PDF", icon: <FileText size={12} className="text-orange-400" /> },
    image: { label: "Image", icon: <Image size={12} className="text-emerald-400" /> },
    note: { label: "Note", icon: <StickyNote size={12} className="text-yellow-400" /> },
};

/** Link that opens the original content: the saved URL, or the uploaded file. */
function sourceHref(source: Source): string | null {
    if (source.source_url) return source.source_url;
    if (source.file_path) return `${process.env.NEXT_PUBLIC_API}/${source.file_path.replace(/\\/g, "/")}`;
    return null;
}

/** https://instagram.com/reel/ABC123/?igsh=... -> https://www.instagram.com/reel/ABC123/embed */
function reelEmbedUrl(url: string): string | null {
    const match = url.match(/instagram\.com\/(reel|reels|p|tv)\/([\w-]+)/i);
    if (!match) return null;
    const kind = match[1].toLowerCase() === "reels" ? "reel" : match[1].toLowerCase();
    return `https://www.instagram.com/${kind}/${match[2]}/embed`;
}

export function SourceCard({ source }: { source: Source }) {
    const [playing, setPlaying] = useState(false);
    const [thumbFailed, setThumbFailed] = useState(false);

    const meta = TYPE_META[source.type] ?? { label: source.type, icon: <ExternalLink size={12} className="text-indigo-400" /> };
    const href = sourceHref(source);
    const embedUrl = source.type === "reel" && source.source_url ? reelEmbedUrl(source.source_url) : null;
    const showThumb = source.thumbnail && !thumbFailed;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-all overflow-hidden"
        >
            <div className="flex items-center gap-3 p-3">
                {showThumb && (
                    <img
                        src={source.thumbnail!}
                        alt={source.title}
                        referrerPolicy="no-referrer"
                        onError={() => setThumbFailed(true)}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase tracking-widest text-white/35">
                        {meta.icon}
                        <span>{meta.label}</span>
                    </div>
                    {href ? (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-medium text-white/85 hover:text-indigo-300 truncate"
                        >
                            {source.title}
                        </a>
                    ) : (
                        <span className="block text-sm font-medium text-white/85 truncate">{source.title}</span>
                    )}
                    {source.source_url && (
                        <span className="block text-[11px] text-white/30 truncate">{source.source_url}</span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {embedUrl && (
                        <button
                            onClick={() => setPlaying((p) => !p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-pink-500/15 text-pink-300 hover:bg-pink-500/25 transition-colors cursor-pointer"
                            title={playing ? "Hide reel" : "Watch reel here"}
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
                            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                            title="Open original"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>
            </div>

            {playing && embedUrl && (
                <div className="px-3 pb-3 flex justify-center">
                    <iframe
                        src={embedUrl}
                        title={source.title}
                        className="w-full max-w-[340px] rounded-lg border-0 bg-white"
                        style={{ aspectRatio: "9/16", maxHeight: "600px" }}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            )}
        </motion.div>
    );
}
