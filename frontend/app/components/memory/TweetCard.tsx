"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Heart, MessageCircle, Play } from "lucide-react";
import type { Memory } from "../../types/memory";
import { compactCount, tweetIdFromUrl, type TweetData, type TweetMedia, type TweetPart } from "../../lib/tweet";

// One request per post per page load, shared by every card that shows it
const cache = new Map<string, Promise<TweetData | null>>();

function loadTweet(id: string): Promise<TweetData | null> {
    let p = cache.get(id);
    if (!p) {
        p = fetch(`/api/tweet/${id}`)
            .then((r) => (r.ok ? (r.json() as Promise<TweetData>) : null))
            .catch(() => null);
        cache.set(id, p);
    }
    return p;
}

function useTweet(url: string | null) {
    const id = tweetIdFromUrl(url);
    const [state, setState] = useState<{ id: string | null; tweet: TweetData | null; done: boolean }>({ id: null, tweet: null, done: !id });
    useEffect(() => {
        if (!id) return;
        let live = true;
        loadTweet(id).then((tweet) => live && setState({ id, tweet, done: true }));
        return () => {
            live = false;
        };
    }, [id]);
    const current = state.id === id;
    return { tweet: current ? state.tweet : null, loading: Boolean(id) && !(current && state.done) };
}

const stop = (e: React.MouseEvent) => e.stopPropagation();

function XMark({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function Text({ parts, className }: { parts: TweetPart[]; className: string }) {
    return (
        <p className={`whitespace-pre-line break-words ${className}`}>
            {parts.map((p, i) =>
                p.kind === "link" ? (
                    <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" onClick={stop} className="text-primary hover:underline underline-offset-2">
                        {p.text}
                    </a>
                ) : (
                    <span key={i}>{p.text}</span>
                ),
            )}
        </p>
    );
}

/** One photo keeps its shape (within limits); 2–4 tile like they do on X */
function MediaGrid({ media, href }: { media: TweetMedia[]; href: string }) {
    if (media.length === 0) return null;
    const one = media.length === 1;
    const ratio = one ? Math.min(Math.max(media[0].width / media[0].height, 0.75), 2) : undefined;
    const layout = media.length === 2 ? "grid-cols-2 aspect-[16/9]" : media.length === 3 ? "grid-cols-2 grid-rows-2 aspect-[16/9]" : media.length === 4 ? "grid-cols-2 grid-rows-2 aspect-square" : "";

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            className={`mt-3 grid gap-0.5 overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container ${layout}`}
            style={ratio ? { aspectRatio: ratio } : undefined}
            title="Open on X"
        >
            {media.map((m, i) => (
                <span key={m.url} className={`relative block min-h-0 overflow-hidden ${media.length === 3 && i === 0 ? "row-span-2" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote X images, already sized by X's CDN */}
                    <img src={m.url} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
                    {m.type !== "photo" && (
                        <span className="absolute inset-0 grid place-items-center bg-black/10">
                            <span className="grid size-11 place-items-center rounded-full bg-on-surface/75 text-surface-container-lowest">
                                <Play className="size-5 translate-x-px fill-current" />
                            </span>
                            {m.type === "gif" && <span className="absolute bottom-2 left-2 rounded bg-on-surface/75 px-1.5 py-0.5 text-[10px] font-bold text-surface-container-lowest">GIF</span>}
                        </span>
                    )}
                </span>
            ))}
        </a>
    );
}

function Author({ author, small = false }: { author: TweetData["author"]; small?: boolean }) {
    return (
        <a href={`https://x.com/${author.handle}`} target="_blank" rel="noopener noreferrer" onClick={stop} className="flex min-w-0 items-center gap-2.5 group/author">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote X avatar */}
            <img
                src={author.avatar}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className={`${small ? "size-5" : "size-10"} shrink-0 rounded-full bg-surface-container object-cover ring-1 ring-outline-variant/70`}
            />
            <span className={`min-w-0 ${small ? "flex items-center gap-1.5" : "leading-tight"}`}>
                <span className="flex items-center gap-1">
                    <span className={`truncate font-semibold text-on-surface group-hover/author:underline underline-offset-2 ${small ? "text-[12.5px]" : "text-[14px]"}`}>{author.name}</span>
                    {author.verified && <BadgeCheck className={`${small ? "size-3.5" : "size-4"} shrink-0 fill-primary text-surface-container-lowest`} aria-label="Verified" />}
                </span>
                <span className={`block truncate text-on-surface-variant ${small ? "text-[12px]" : "text-[12.5px]"}`}>@{author.handle}</span>
            </span>
        </a>
    );
}

function RichTweet({ tweet }: { tweet: TweetData }) {
    const date = new Date(tweet.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    return (
        <>
            <div className="flex items-start justify-between gap-2">
                <Author author={tweet.author} />
                <OpenOnX href={tweet.url} />
            </div>

            {tweet.parts.length > 0 && <Text parts={tweet.parts} className="mt-3 text-[14px] leading-[1.55] text-on-surface line-clamp-[12]" />}
            <MediaGrid media={tweet.media} href={tweet.url} />

            {tweet.quoted && (
                // The box opens the quoted post through one stretched link; links inside sit above it
                <div className="relative mt-3 rounded-xl border border-outline-variant/70 p-3 hover:bg-on-surface/3">
                    <a href={tweet.quoted.url} target="_blank" rel="noopener noreferrer" onClick={stop} className="absolute inset-0 rounded-xl" aria-label={`Quoted post by @${tweet.quoted.author.handle}`} />
                    <div className="pointer-events-none relative [&_a]:pointer-events-auto">
                        <Author author={tweet.quoted.author} small />
                        {tweet.quoted.parts.length > 0 && <Text parts={tweet.quoted.parts} className="mt-1.5 text-[13px] leading-[1.5] text-on-surface line-clamp-4" />}
                        {tweet.quoted.media[0] && (
                            // eslint-disable-next-line @next/next/no-img-element -- remote X image
                            <img src={tweet.quoted.media[0].url} alt="" loading="lazy" referrerPolicy="no-referrer" className="mt-2 aspect-[16/9] w-full rounded-lg object-cover" />
                        )}
                    </div>
                </div>
            )}

            <div className="mt-3 flex items-center gap-3 text-[11.5px] text-on-surface-variant">
                <a href={tweet.url} target="_blank" rel="noopener noreferrer" onClick={stop} className="hover:text-on-surface hover:underline underline-offset-2">
                    {date}
                </a>
                {tweet.likes > 0 && (
                    <span className="flex items-center gap-1" title={`${tweet.likes.toLocaleString()} likes`}>
                        <Heart className="size-3.5" /> {compactCount(tweet.likes)}
                    </span>
                )}
                {tweet.replies > 0 && (
                    <span className="flex items-center gap-1" title={`${tweet.replies.toLocaleString()} replies`}>
                        <MessageCircle className="size-3.5" /> {compactCount(tweet.replies)}
                    </span>
                )}
            </div>
        </>
    );
}

/** Shown while the post loads, and when X can't provide it (deleted, private, or X is down) */
function SimpleTweet({ memory, loading }: { memory: Memory; loading: boolean }) {
    const meta = memory.metadata ?? {};
    return (
        <>
            <div className="flex items-center gap-2.5">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full bg-on-surface/6 text-on-surface ${loading ? "animate-pulse" : ""}`}>
                    <XMark className="size-4" />
                </span>
                <span className="leading-tight">
                    <span className="block text-[14px] font-semibold text-on-surface">{meta.author || (meta.username ? `@${meta.username}` : "Post on X")}</span>
                    <span className="block text-[12.5px] text-on-surface-variant">{loading ? "Loading post…" : "x.com"}</span>
                </span>
            </div>
            <p className="mt-3 text-[14px] font-medium leading-relaxed line-clamp-4">{memory.title}</p>
            {loading && <span className="mt-3 block h-28 animate-pulse rounded-xl bg-on-surface/5" />}
        </>
    );
}

function OpenOnX({ href }: { href: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={stop} className="-mt-0.5 rounded-lg p-1.5 text-on-surface-variant/70 hover:bg-on-surface/6 hover:text-on-surface" title="Open on X">
            <XMark className="size-3.5" />
        </a>
    );
}

export function TweetCard({ memory }: { memory: Memory }) {
    const { tweet, loading } = useTweet(memory.source_url);
    return <div className="px-4 pt-4">{tweet ? <RichTweet tweet={tweet} /> : <SimpleTweet memory={memory} loading={loading} />}</div>;
}
