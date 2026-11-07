"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { AlertCircle, Check, Library, Loader2, Sparkles } from "lucide-react";
import axios from "axios";
import { addMemory, errorMessage, getMemoryStatuses, updateMemory } from "@/app/services/api";
import { TYPE_META } from "@/app/components/memory/typeMeta";
import type { Memory } from "@/app/types/memory";
import { MEMORIES_CHANGED, useShell } from "../AppShell";

/**
 * What the phone's share sheet sent. Apps put links in different fields: Chrome uses `url`,
 * Instagram, YouTube and most others put the link inside `text`, sometimes with words around it.
 */
function readShare(params: URLSearchParams) {
    const title = params.get("share_title")?.trim() || "";
    const text = params.get("share_text")?.trim() || "";
    const url = params.get("share_url")?.trim() || text.match(/https?:\/\/\S+/)?.[0] || "";
    // Words around a link ("Check out this video!") aren't worth keeping; a longer message is
    const rest = url ? text.replace(url, "").trim() : text;
    return {
        url,
        title: title && title !== url ? title : "",
        text: rest,
        context: url && rest.length >= 60 ? rest : "",
    };
}

type State =
    | { step: "saving" }
    | { step: "saved"; id: number }
    | { step: "duplicate"; title: string }
    | { step: "error"; message: string }
    | { step: "empty" };

export default function SharePage() {
    return (
        <Suspense fallback={null}>
            <Share />
        </Suspense>
    );
}

/**
 * Target of the phone's share sheet (and Android's "Share to Brainly"): saves what was shared
 * straight away, with no form. Brainly fills in the title, summary and tags itself; adding a
 * note is optional.
 */
function Share() {
    const params = useSearchParams();
    const router = useRouter();
    const { refreshMe } = useShell();
    const savedId = Number(params.get("saved")) || null;
    const share = readShare(params);
    const [state, setState] = useState<State>(() =>
        savedId ? { step: "saved", id: savedId } : share.url || share.text ? { step: "saving" } : { step: "empty" }
    );
    const [memory, setMemory] = useState<Memory | null>(null);
    const [note, setNote] = useState("");
    const [noteSaved, setNoteSaved] = useState(false);
    const started = useRef(false);

    const save = async (allowDuplicate = false) => {
        setState({ step: "saving" });
        try {
            const saved = share.url
                ? await addMemory({ type: "url", source_url: share.url, title: share.title || undefined, context: share.context || undefined, allowDuplicate })
                : await addMemory({ type: "note", note: share.text, title: share.title || undefined });
            // Swap the shared data for the memory id, so reloading this page doesn't save it twice
            router.replace(`/share?saved=${saved.id}`, { scroll: false });
            setState({ step: "saved", id: saved.id });
            window.dispatchEvent(new Event(MEMORIES_CHANGED));
            void refreshMe();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                setState({ step: "duplicate", title: err.response.data?.message?.match(/"(.+)"/)?.[1] ?? "" });
            } else {
                setState({ step: "error", message: errorMessage(err, "Couldn't save this. Check your connection and try again.") });
            }
        }
    };

    // Save once, as soon as the page opens
    useEffect(() => {
        if (started.current || savedId || !(share.url || share.text)) return;
        started.current = true;
        void save();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Follow the memory while Brainly reads it, to show the title and summary it fills in
    const id = state.step === "saved" ? state.id : null;
    useEffect(() => {
        if (!id) return;
        let stop = false;
        let tries = 0;
        const poll = async () => {
            const [m] = await getMemoryStatuses([id]).catch(() => []);
            if (stop) return;
            if (m) setMemory(m);
            if (m && (m.status === "ready" || m.status === "failed")) return;
            if (++tries < 40) setTimeout(poll, 2500);
        };
        void poll();
        return () => {
            stop = true;
        };
    }, [id]);

    const saveNote = async () => {
        if (!id || !note.trim()) return;
        await updateMemory(id, { context: note.trim() }).catch(() => undefined);
        setNoteSaved(true);
    };

    const meta = memory ? TYPE_META[memory.type as keyof typeof TYPE_META] : null;
    const thumb = (memory?.metadata as Record<string, unknown> | null)?.thumbnail_url as string | undefined;
    const reading = !memory || memory.status === "pending" || memory.status === "processing";

    return (
        <div className="mx-auto grid min-h-[calc(100svh/var(--ui-zoom,1)-12rem)] w-full max-w-[520px] place-items-center">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid w-full gap-5 rounded-[22px] border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_30px_60px_-40px_rgba(60,35,20,0.6)]"
            >
                {state.step === "saving" && (
                    <div className="grid justify-items-center gap-3 py-6 text-center">
                        <Loader2 className="size-7 animate-spin text-on-surface-variant" />
                        <p className="font-headline text-2xl">Saving to your brain…</p>
                        <p className="max-w-full truncate text-sm text-on-surface-variant">{share.url || share.text}</p>
                    </div>
                )}

                {state.step === "saved" && (
                    <>
                        <div className="flex items-center gap-3">
                            <motion.span
                                initial={{ scale: 0.6 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                                className="grid size-10 flex-none place-items-center rounded-full bg-secondary text-white"
                            >
                                <Check className="size-5" />
                            </motion.span>
                            <div>
                                <p className="font-headline text-2xl leading-tight">Saved to your brain</p>
                                <p className="text-[13px] text-on-surface-variant">
                                    {reading ? "Brainly is reading it and adding a title, summary and tags." : memory?.status === "failed" ? "Saved, but Brainly couldn't read it yet. It will try again." : "Ready to search and ask about."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 rounded-2xl border border-outline-variant bg-surface p-3">
                            {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt="" referrerPolicy="no-referrer" className="size-16 flex-none rounded-xl object-cover" />
                            ) : (
                                <span className="grid size-16 flex-none place-items-center rounded-xl bg-surface-container-high">
                                    {meta ? <meta.icon className={`size-6 ${meta.color}`} /> : <Sparkles className="size-6 text-primary" />}
                                </span>
                            )}
                            <div className="grid min-w-0 content-center gap-1">
                                <span className="text-[10.5px] tracking-[0.08em] text-on-surface-variant uppercase">{meta?.label ?? "Memory"}</span>
                                <span className="line-clamp-2 text-[15px] font-semibold [overflow-wrap:anywhere]">{memory?.title ?? "…"}</span>
                                {memory?.summary ? (
                                    <span className="line-clamp-2 text-[12.5px] text-on-surface-variant">{memory.summary}</span>
                                ) : reading ? (
                                    <span className="flex items-center gap-1.5 text-[12.5px] text-on-surface-variant">
                                        <Loader2 className="size-3 animate-spin" /> Reading…
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="share-note" className="text-[13px] font-medium">
                                Add a note <span className="font-normal text-on-surface-variant">(optional)</span>
                            </label>
                            <textarea
                                id="share-note"
                                rows={2}
                                value={note}
                                onChange={(e) => {
                                    setNote(e.target.value);
                                    setNoteSaved(false);
                                }}
                                placeholder="Why are you saving this? It helps you find it later."
                                className="w-full resize-none rounded-xl border border-outline-variant bg-surface px-3.5 py-2.5 text-[14.5px] outline-none focus:border-on-surface/40"
                            />
                            {note.trim() && (
                                <button type="button" onClick={saveNote} disabled={noteSaved} className="justify-self-start rounded-lg border border-outline-variant px-3 py-1.5 text-[13px] hover:border-on-surface disabled:opacity-60">
                                    {noteSaved ? "Note saved ✓" : "Save note"}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link href="/library" className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-[14px] font-medium text-white hover:bg-black">
                                <Library className="size-4" /> Open Library
                            </Link>
                            <Link href="/chat" className="flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-[14px] hover:border-on-surface">
                                <Sparkles className="size-4" /> Ask your brain
                            </Link>
                        </div>
                    </>
                )}

                {state.step === "duplicate" && (
                    <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-full bg-surface-container-high">
                                <Check className="size-5" />
                            </span>
                            <div>
                                <p className="font-headline text-2xl leading-tight">Already in your brain</p>
                                <p className="text-[13px] text-on-surface-variant">{state.title ? `You saved this as “${state.title}”.` : "You saved this before."}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/library" className="rounded-xl bg-primary-container px-4 py-2.5 text-[14px] font-medium text-white hover:bg-black">Open Library</Link>
                            <button type="button" onClick={() => save(true)} className="rounded-xl border border-outline-variant px-4 py-2.5 text-[14px] hover:border-on-surface">Save it again</button>
                        </div>
                    </div>
                )}

                {state.step === "error" && (
                    <div className="grid gap-4">
                        <p className="flex items-start gap-2 text-[14.5px] text-error">
                            <AlertCircle className="mt-0.5 size-4 flex-none" /> {state.message}
                        </p>
                        <button type="button" onClick={() => save()} className="justify-self-start rounded-xl bg-primary-container px-4 py-2.5 text-[14px] font-medium text-white hover:bg-black">Try again</button>
                    </div>
                )}

                {state.step === "empty" && (
                    <div className="grid gap-3 text-center">
                        <p className="font-headline text-2xl">Nothing to save</p>
                        <p className="text-sm text-on-surface-variant">Share a link, video or text to Brainly from any app, and it lands here.</p>
                        <Link href="/library" className="justify-self-center text-sm underline underline-offset-4">Go to your Library</Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
