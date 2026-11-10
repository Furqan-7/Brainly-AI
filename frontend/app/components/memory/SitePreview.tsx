"use client";

import { useState } from "react";

/** Prefer the live screenshot, then the site's own preview image (og:image), then nothing. */
type Stage = "screenshot" | "fallback" | "none";

/**
 * A screenshot of a saved website in a small browser frame, like Vercel's deployment previews.
 * The screenshot is taken on the server (/api/preview) the first time and cached after that.
 */
export function SitePreview({ url, fallbackImage, title }: { url: string; fallbackImage?: string | null; title?: string }) {
    const [stage, setStage] = useState<Stage>("screenshot");
    const [loaded, setLoaded] = useState(false);

    if (stage === "none") return null;
    const src = stage === "screenshot" ? `/api/preview?url=${encodeURIComponent(url)}` : fallbackImage!;
    let host = url;
    try {
        host = new URL(url).hostname.replace(/^www\./, "");
    } catch { /* keep the raw URL */ }

    const onError = () => {
        setLoaded(false);
        setStage(stage === "screenshot" && fallbackImage ? "fallback" : "none");
    };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-[11px] overflow-hidden border border-outline-variant/50 bg-surface-container-highest/40 hover:border-outline-variant/30 transition-colors"
            title={title ? `Open ${title}` : `Open ${host}`}
        >
            <div className="flex items-center gap-1.5 px-2.5 h-5 border-b border-outline-variant/10 bg-surface-container-high/60">
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/25" />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/25" />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/25" />
                <span className="ml-1.5 text-[8px] text-on-surface-variant/50 truncate">{host}</span>
            </div>
            <div className="relative aspect-[16/10]">
                {!loaded && <div className="absolute inset-0 animate-pulse bg-on-surface/5" />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={src}
                    src={src}
                    alt={title ? `Preview of ${title}` : `Preview of ${host}`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onLoad={() => setLoaded(true)}
                    onError={onError}
                    className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                />
            </div>
        </a>
    );
}
