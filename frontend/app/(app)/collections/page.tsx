"use client";

import { PageHeader } from "../AppShell";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, FolderOpen, Globe, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import {
    createCollection, deleteCollection, errorMessage, getCollections, shareCollection, unshareCollection,
} from "@/app/services/api";
import type { Collection } from "@/app/types/memory";

function shareLink(slug: string) {
    return `${window.location.origin}/c/${slug}`;
}

function CollectionRow({ collection, onChange, onDelete }: {
    collection: Collection;
    onChange: (c: Collection) => void;
    onDelete: (id: number) => void;
}) {
    const [copied, setCopied] = useState(false);
    const [busy, setBusy] = useState(false);

    const toggleShare = async () => {
        setBusy(true);
        try {
            if (collection.shareSlug) {
                await unshareCollection(collection.id);
                onChange({ ...collection, shareSlug: null });
            } else {
                const slug = await shareCollection(collection.id);
                onChange({ ...collection, shareSlug: slug });
            }
        } finally {
            setBusy(false);
        }
    };

    const copy = async () => {
        await navigator.clipboard.writeText(shareLink(collection.shareSlug!));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const remove = async () => {
        if (!confirm(`Delete the collection "${collection.name}"? The memories in it are kept.`)) return;
        await deleteCollection(collection.id);
        onDelete(collection.id);
    };

    return (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
                <FolderOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    <Link href={`/library?collection=${collection.id}`} className="text-sm font-bold hover:text-primary">
                        {collection.name}
                    </Link>
                    {collection.description && <p className="text-xs text-on-surface-variant/70">{collection.description}</p>}
                    <p className="text-[11px] text-on-surface-variant/50">
                        {collection.memoryCount} {collection.memoryCount === 1 ? "memory" : "memories"}
                    </p>
                </div>
                <button onClick={remove} className="p-1.5 rounded-lg text-on-surface-variant/50 hover:text-error hover:bg-error/10 cursor-pointer" title="Delete collection">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    onClick={toggleShare}
                    disabled={busy}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${collection.shareSlug
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                        : "bg-on-surface/5 border-on-surface/10 text-on-surface-variant hover:text-on-surface"
                        }`}
                >
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : collection.shareSlug ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {collection.shareSlug ? "Public — click to make private" : "Private — click to share"}
                </button>
                {collection.shareSlug && (
                    <button onClick={copy} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-on-surface/5 border border-on-surface/10 text-on-surface-variant hover:text-on-surface cursor-pointer">
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied!" : "Copy link"}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function CollectionsPage() {
    const [collections, setCollections] = useState<Collection[] | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const load = useCallback(() => {
        getCollections().then(setCollections).catch((e) => setError(errorMessage(e)));
    }, []);
    useEffect(load, [load]);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const c = await createCollection(name.trim(), description.trim() || undefined);
            setCollections((prev) => [...(prev ?? []), c].sort((a, b) => a.name.localeCompare(b.name)));
            setName("");
            setDescription("");
        } catch (err) {
            setError(errorMessage(err));
        }
    };

    return (
        <div className="space-y-6">
                <PageHeader eyebrow="Collections" title="Boards for the things that belong together.">
                    Group memories into boards like “Project ideas”, and share any board publicly with a link.
                </PageHeader>

                <form onSubmit={create} className="flex flex-col sm:flex-row gap-2">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="New collection name"
                        className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40"
                    />
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="flex-1 bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/40"
                    />
                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold disabled:opacity-50 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> Create
                    </button>
                </form>
                {error && <p className="text-xs text-error">{error}</p>}

                {collections === null ? (
                    <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant/40 mx-auto" />
                ) : collections.length === 0 ? (
                    <p className="text-sm text-on-surface-variant/50 text-center py-10">
                        No collections yet. Create one, then add memories from their cards on the dashboard.
                    </p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {collections.map((c) => (
                            <CollectionRow
                                key={c.id}
                                collection={c}
                                onChange={(updated) => setCollections((prev) => prev!.map((x) => (x.id === updated.id ? updated : x)))}
                                onDelete={(id) => setCollections((prev) => prev!.filter((x) => x.id !== id))}
                            />
                        ))}
                    </div>
                )}
        </div>
    );
}
