"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Link2,
    FileText,
    Video,
    MessageSquare,
    StickyNote,
    Image as ImageIcon,
    X,
    Upload,
    Sparkles,
    Brain,
    Loader2,
    Clapperboard,
    Music2,
    Mic,
    Square,
    FolderInput,
} from "lucide-react";
import axios from "axios";
import { addMemory, errorMessage, importFiles } from "../services/api";
import type { Collection } from "../types/memory";

type ContentType = "url" | "pdf" | "youtube" | "reel" | "tiktok" | "tweet" | "note" | "image" | "audio" | "import";

const CONTENT_TYPES: {
    type: ContentType;
    label: string;
    icon: React.ReactNode;
    placeholder: string;
    urlLabel?: string;
    urlPlaceholder?: string;
}[] = [
        {
            type: "url",
            label: "URL",
            icon: <Link2 size={20} />,
            placeholder: "e.g., Deep Learning Best Practices",
            urlLabel: "Website URL",
            urlPlaceholder: "https://example.com/article",
        },
        {
            type: "pdf",
            label: "PDF",
            icon: <FileText size={20} />,
            placeholder: "e.g., Research Paper on Transformers",
        },
        {
            type: "youtube",
            label: "YouTube",
            icon: <Video size={20} />,
            placeholder: "e.g., Andrew Ng's ML Course",
            urlLabel: "YouTube or Shorts URL",
            urlPlaceholder: "https://youtube.com/watch?v=...",
        },
        {
            type: "reel",
            label: "Reel",
            icon: <Clapperboard size={20} />,
            placeholder: "e.g., Project ideas for my portfolio",
            urlLabel: "Instagram Reel URL",
            urlPlaceholder: "https://instagram.com/reel/...",
        },
        {
            type: "tiktok",
            label: "TikTok",
            icon: <Music2 size={20} />,
            placeholder: "e.g., Quick pasta recipe",
            urlLabel: "TikTok URL",
            urlPlaceholder: "https://www.tiktok.com/@user/video/...",
        },
        {
            type: "tweet",
            label: "Tweet",
            icon: <MessageSquare size={20} />,
            placeholder: "e.g., Thread on system design",
            urlLabel: "Tweet URL",
            urlPlaceholder: "https://x.com/user/status/...",
        },
        {
            type: "note",
            label: "Note",
            icon: <StickyNote size={20} />,
            placeholder: "e.g., Meeting notes — Q2 planning",
        },
        {
            type: "image",
            label: "Image",
            icon: <ImageIcon size={20} />,
            placeholder: "e.g., Architecture diagram",
        },
        {
            type: "audio",
            label: "Voice",
            icon: <Mic size={20} />,
            placeholder: "e.g., Idea while walking",
        },
        {
            type: "import",
            label: "Import",
            icon: <FolderInput size={20} />,
            placeholder: "",
        },
    ];

const FILE_TYPES: ContentType[] = ["pdf", "image", "audio"];
const URL_TYPES: ContentType[] = ["url", "youtube", "reel", "tiktok", "tweet"];

const ACCEPT: Partial<Record<ContentType, string>> = {
    pdf: ".pdf",
    image: "image/*",
    audio: "audio/*,.m4a,.mp3,.wav,.webm,.ogg",
    import: ".md,.markdown,.txt,.html,.htm,.docx,.zip",
};

const inputClass =
    "w-full bg-on-surface/5 border border-on-surface/10 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary/50 focus:bg-on-surface/6 transition-all";
const labelClass = "block text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant";

/** Records a voice note in the browser with MediaRecorder. */
function useRecorder(onRecorded: (file: File) => void) {
    const [recording, setRecording] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [error, setError] = useState("");
    const recorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = async () => {
        setError("");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                stream.getTracks().forEach((t) => t.stop());
                const type = recorder.mimeType || "audio/webm";
                const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
                onRecorded(new File(chunks, `voice-note-${Date.now()}.${ext}`, { type: type.split(";")[0] }));
            };
            recorder.start();
            recorderRef.current = recorder;
            setSeconds(0);
            setRecording(true);
            timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
        } catch {
            setError("Microphone access was blocked.");
        }
    };

    const stop = () => {
        recorderRef.current?.stop();
        if (timerRef.current) clearInterval(timerRef.current);
        setRecording(false);
    };

    useEffect(() => () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, []);

    return { recording, seconds, error, start, stop };
}

export default function AddContent({
    isAddContentOpen,
    setIsAddContentOpen,
    onSaved,
    collections = [],
    initial,
}: {
    isAddContentOpen: boolean;
    setIsAddContentOpen: (open: boolean) => void;
    onSaved: () => void;
    collections?: Collection[];
    /** Prefill from the share sheet / browser extension */
    initial?: { title?: string; url?: string; text?: string };
}) {
    const [activeType, setActiveType] = useState<ContentType>(initial?.url ? "url" : initial?.text ? "note" : "url");
    const [title, setTitle] = useState(initial?.title ?? "");
    const [url, setUrl] = useState(initial?.url ?? "");
    const [note, setNote] = useState(initial?.url ? "" : initial?.text ?? "");
    const [context, setContext] = useState("");
    const [tags, setTags] = useState("");
    const [collectionId, setCollectionId] = useState<number | "">("");
    const [dragOver, setDragOver] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [duplicateOf, setDuplicateOf] = useState<string | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recorder = useRecorder((recorded) => setFiles([recorded]));

    const activeConfig = CONTENT_TYPES.find((c) => c.type === activeType)!;
    const isImport = activeType === "import";
    const isFileType = FILE_TYPES.includes(activeType) || isImport;
    const isUrlType = URL_TYPES.includes(activeType);
    const isNoteType = activeType === "note";
    const file = files[0] ?? null;

    function handleClose() {
        setIsAddContentOpen(false);
    }

    function pickFiles(list: FileList | null) {
        if (!list?.length) return;
        setFiles(isImport ? Array.from(list) : [list[0]]);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        pickFiles(e.dataTransfer.files);
    }

    function handleTypeChange(type: ContentType) {
        setActiveType(type);
        setUrl("");
        setNote("");
        setFiles([]);
        setSaveError("");
        setDuplicateOf(null);
    }

    async function handleSubmit(allowDuplicate = false) {
        if (isUrlType && !url.trim()) {
            setSaveError("Please paste a link.");
            return;
        }
        if (isNoteType && !note.trim()) {
            setSaveError("Please write your note.");
            return;
        }
        setSaving(true);
        setSaveError("");
        setDuplicateOf(null);
        try {
            if (isImport) {
                if (files.length === 0) throw new Error("Choose at least one file to import.");
                await importFiles(files, collectionId || undefined);
            } else if (isFileType) {
                if (!file) throw new Error("Please choose a file.");
                const formdata = new FormData();
                formdata.append("type", activeType);
                if (title.trim()) formdata.append("title", title.trim());
                formdata.append("context", context);
                formdata.append("tags", tags);
                if (collectionId) formdata.append("collectionId", String(collectionId));
                formdata.append("file", file);
                await addMemory(formdata);
            } else {
                await addMemory({
                    type: activeType,
                    // Left empty, Brainly names it from the page, video or text
                    title: title.trim() || undefined,
                    source_url: url,
                    note,
                    context,
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                    collectionId: collectionId || undefined,
                    allowDuplicate,
                });
            }

            onSaved();
            handleClose();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                setDuplicateOf(err.response.data.message);
            } else {
                setSaveError(err instanceof Error && !axios.isAxiosError(err) ? err.message : errorMessage(err, "Failed to save. Please try again."));
            }
        } finally {
            setSaving(false);
        }
    }

    if (!isAddContentOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-on-surface/25 backdrop-blur-sm px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-xl bg-surface-container-lowest border border-on-surface/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Brain size={16} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-on-surface leading-tight">Add to Brain</h2>
                            <p className="text-xs text-on-surface-variant mt-0.5">Expand your knowledge base</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8 transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Type Selector */}
                <div className="px-5 sm:px-6 pb-4">
                    <div className="grid grid-cols-5 gap-2">
                        {CONTENT_TYPES.map(({ type, label, icon }) => {
                            const isActive = activeType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleTypeChange(type)}
                                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed ${isActive
                                        ? "bg-primary/15 border-primary/40 text-primary"
                                        : "bg-on-surface/4 border-on-surface/8 text-on-surface-variant hover:bg-on-surface/8 hover:text-on-surface hover:border-on-surface/15"
                                        }`}
                                >
                                    <span className={isActive ? "text-primary" : ""}>{icon}</span>
                                    <span className="text-[10px] uppercase tracking-wider">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-on-surface/6 mx-5 sm:mx-6" />

                {/* Dynamic Form */}
                <div className="px-5 sm:px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {!isImport && (
                        <div className="space-y-1.5">
                            <label className={labelClass}>Title <span className="normal-case tracking-normal font-normal">(optional)</span></label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Leave empty and Brainly names it for you"
                                className={inputClass}
                            />
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* URL input — for url / youtube / reel / tiktok / tweet */}
                        {isUrlType && (
                            <motion.div
                                key="url-input"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-1.5"
                            >
                                <label className={labelClass}>{activeConfig.urlLabel}</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                                        <Link2 size={14} />
                                    </span>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder={activeConfig.urlPlaceholder}
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* File Dropzone — for pdf / image / audio / import */}
                        {isFileType && (
                            <motion.div
                                key="file-input"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-3"
                            >
                                {activeType === "audio" && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={recorder.recording ? recorder.stop : recorder.start}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer disabled:cursor-not-allowed ${recorder.recording
                                                ? "bg-error/20 text-error border border-error/40"
                                                : "bg-violet-500/15 text-violet-600 border border-violet-500/30"
                                                }`}
                                        >
                                            {recorder.recording ? <Square size={14} fill="currentColor" /> : <Mic size={14} />}
                                            {recorder.recording ? `Stop (${recorder.seconds}s)` : "Record voice note"}
                                        </button>
                                        <span className="text-xs text-on-surface-variant">or upload a recording below</span>
                                        {recorder.error && <span className="text-xs text-error">{recorder.error}</span>}
                                    </div>
                                )}
                                <label className={labelClass}>
                                    {isImport ? "Notion / Google Docs export or Markdown files" : activeType === "pdf" ? "PDF File" : activeType === "audio" ? "Audio File" : "Image File"}
                                </label>
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all ${dragOver
                                        ? "border-primary/60 bg-primary/8"
                                        : file
                                            ? "border-primary/40 bg-primary/5"
                                            : "border-on-surface/10 bg-on-surface/3 hover:border-on-surface/20 hover:bg-on-surface/5"
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple={isImport}
                                        accept={ACCEPT[activeType]}
                                        className="hidden"
                                        onChange={(e) => pickFiles(e.target.files)}
                                    />
                                    {file ? (
                                        <>
                                            <p className="text-sm font-medium text-on-surface text-center truncate max-w-[260px]">
                                                {files.length > 1 ? `${files.length} files selected` : file.name}
                                            </p>
                                            <p className="text-xs text-on-surface-variant mt-0.5">
                                                {(files.reduce((n, f) => n + f.size, 0) / 1024 / 1024).toFixed(2)} MB — click to change
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-9 h-9 rounded-lg bg-on-surface/8 flex items-center justify-center mb-2">
                                                <Upload size={16} className="text-on-surface-variant" />
                                            </div>
                                            <p className="text-sm font-medium text-on-surface-variant">Drag & drop or click to upload</p>
                                            <p className="text-xs text-on-surface-variant mt-0.5 text-center">
                                                {isImport
                                                    ? ".md, .txt, .html, .docx or a Notion export .zip"
                                                    : activeType === "pdf"
                                                        ? "PDF (scanned PDFs are OCR'd)"
                                                        : activeType === "audio"
                                                            ? "MP3, M4A, WAV, WEBM — transcribed automatically"
                                                            : "PNG, JPG, WEBP"}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* Note textarea */}
                        {isNoteType && (
                            <motion.div
                                key="note-input"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-1.5"
                            >
                                <label className={labelClass}>Note Content</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Write your note here... markdown is supported"
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isImport && (
                        <>
                            <div className="space-y-1.5">
                                <label className={labelClass}>
                                    Personal Context <span className="normal-case tracking-normal text-on-surface-variant">(optional, searchable)</span>
                                </label>
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Why are you saving this? Any notes for your future self..."
                                    rows={2}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelClass}>
                                    Tags <span className="normal-case tracking-normal text-on-surface-variant">(comma separated — AI adds more)</span>
                                </label>
                                <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="projects, career" className={inputClass} />
                            </div>
                        </>
                    )}

                    {collections.length > 0 && (
                        <div className="space-y-1.5">
                            <label className={labelClass}>Collection</label>
                            <select
                                value={collectionId}
                                onChange={(e) => setCollectionId(e.target.value ? Number(e.target.value) : "")}
                                className={`${inputClass} cursor-pointer disabled:cursor-not-allowed`}
                            >
                                <option value="">None</option>
                                {collections.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 sm:px-6 pb-6 pt-1 flex flex-col gap-2">
                    {saveError && <p className="text-xs text-error text-right">{saveError}</p>}
                    {duplicateOf && (
                        <div className="flex items-center justify-end gap-3 text-xs text-amber-300">
                            <span>{duplicateOf}.</span>
                            <button onClick={() => handleSubmit(true)} className="underline hover:text-amber-200 cursor-pointer disabled:cursor-not-allowed">
                                Save anyway
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                            <Sparkles size={12} />
                            <span className="text-[10px]">AI will auto-index, summarise and tag this content</span>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-on-surface/6 transition-all hover:cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleSubmit()}
                                disabled={saving || recorder.recording}
                                className="px-5 py-2 rounded-lg text-sm font-semibold bg-primary-container hover:bg-black text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/10 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Saving…
                                    </>
                                ) : isImport ? (
                                    "Import"
                                ) : (
                                    "Save to Brain"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
