"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Brain, ExternalLink, Loader2 } from "lucide-react";
import { getPublicCollection, fileUrl } from "../../services/api";
import { TYPE_META } from "../../components/memory/typeMeta";
import type { PublicMemory } from "../../types/memory";

/** Public, read-only view of a shared collection — no sign-in needed. */
export default function PublicCollectionPage() {
    const { slug } = useParams<{ slug: string }>();
    const [collection, setCollection] = useState<{ name: string; description: string | null; owner: string; memories: PublicMemory[] } | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        getPublicCollection(slug).then(setCollection).catch(() => setNotFound(true));
    }, [slug]);

    return (
        <div className="min-h-screen bg-background text-on-surface font-body">
            <header className="border-b border-outline-variant/10">
                <div className="max-w-4xl mx-auto px-4 md:px-10 h-12 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary-container" />
                        <span className="text-sm font-black tracking-tighter">Brainly AI</span>
                    </Link>
                    <Link href="/auth/signup" className="text-xs font-semibold text-primary hover:underline">
                        Build your own second brain →
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 md:px-10 py-10 space-y-6">
                {notFound ? (
                    <p className="text-center text-sm text-on-surface-variant/60 py-20">
                        This collection doesn&apos;t exist or is no longer shared.
                    </p>
                ) : !collection ? (
                    <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant/40 mx-auto" />
                ) : (
                    <>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black tracking-tighter">{collection.name}</h1>
                            {collection.description && <p className="text-sm text-on-surface-variant/80">{collection.description}</p>}
                            <p className="text-xs text-on-surface-variant/50">
                                Shared by {collection.owner} · {collection.memories.length} items
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {collection.memories.map((m) => {
                                const meta = TYPE_META[m.type];
                                const Icon = meta.icon;
                                const href = m.source_url ?? (m.has_file ? fileUrl(m.id) : null);
                                return (
                                    <div key={m.id} className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden flex flex-col">
                                        {m.thumbnail_url && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={m.thumbnail_url} alt="" referrerPolicy="no-referrer" className="w-full aspect-video object-cover" />
                                        )}
                                        <div className="p-4 space-y-2 flex-1">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">
                                                <Icon className={`w-3 h-3 ${meta.color}`} /> {meta.label}
                                            </div>
                                            <h2 className="text-sm font-bold leading-snug">{m.title}</h2>
                                            {(m.summary || m.description) && (
                                                <p className="text-xs text-on-surface-variant/70 line-clamp-4">{m.summary || m.description}</p>
                                            )}
                                            {m.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {m.tags.slice(0, 5).map((t) => (
                                                        <span key={t} className="px-1.5 py-0.5 rounded bg-on-surface/5 text-[10px] text-on-surface-variant/70">#{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {href && (
                                            <a
                                                href={href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-1.5 py-2 border-t border-outline-variant/10 text-xs font-semibold text-primary hover:bg-on-surface/5"
                                            >
                                                Open <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
