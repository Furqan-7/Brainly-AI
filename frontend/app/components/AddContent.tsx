"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Link2,
    FileText,
    Video,
    MessageSquare,
    StickyNote,
    Image,
    X,
    Upload,
    Sparkles,
    Brain,
} from "lucide-react";
import axios from "axios";

type ContentType = "url" | "pdf" | "youtube" | "tweet" | "note" | "image";

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
            urlLabel: "YouTube URL",
            urlPlaceholder: "https://youtube.com/watch?v=...",
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
            icon: <Image size={20} />,
            placeholder: "e.g., Architecture diagram",
        },
    ];

const FILE_TYPES: ContentType[] = ["pdf", "image"];
const URL_TYPES: ContentType[] = ["url", "youtube", "tweet"];

export default function AddContent({
    isAddContentOpen,
    setIsAddContentOpen,
}: {
    isAddContentOpen: boolean;
    setIsAddContentOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [activeType, setActiveType] = useState<ContentType>("url");
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [note, setNote] = useState("");
    const [context, setContext] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeConfig = CONTENT_TYPES.find((c) => c.type === activeType)!;
    const isFileType = FILE_TYPES.includes(activeType);
    const isUrlType = URL_TYPES.includes(activeType);
    const isNoteType = activeType === "note";

    function handleClose() {
        setIsAddContentOpen(false);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const picked = e.target.files?.[0];
        if (picked) setFile(picked);
    }

    function handleTypeChange(type: ContentType) {
        setActiveType(type);
        setUrl("");
        setNote("");
        setFile(null);
    }

    function handleSubmit() {
        // TODO: wire to API

        // const Response = axios.post("http://localhost:3001/api/content",{
        //       type:activeType,
        //       title,
        //       url,
        //       note,
        //       context,
        //       file,
        // });
        console.log({ type: activeType, title, url, note, context, file });
        handleClose();
    }

    if (!isAddContentOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Brain size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white leading-tight">
                                Add to Brain
                            </h2>
                            <p className="text-xs text-white/40 mt-0.5">
                                Expand your knowledge base
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Type Selector */}
                <div className="px-6 pb-4">
                    <div className="grid grid-cols-6 gap-2">
                        {CONTENT_TYPES.map(({ type, label, icon }) => {
                            const isActive = activeType === type;
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleTypeChange(type)}
                                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-medium transition-all ${isActive
                                        ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
                                        : "bg-white/4 border-white/8 text-white/40 hover:bg-white/8 hover:text-white/70 hover:border-white/15"
                                        }`}
                                >
                                    <span className={isActive ? "text-indigo-400" : ""}>
                                        {icon}
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider">
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/6 mx-6" />

                {/* Dynamic Form */}
                <div className="px-6 py-5 space-y-4">
                    {/* Title — always shown */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={activeConfig.placeholder}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/6 transition-all"
                        />
                    </div>

                    {/* URL input — for url / youtube / tweet */}
                    <AnimatePresence mode="wait">
                        {isUrlType && (
                            <motion.div
                                key="url-input"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="space-y-1.5"
                            >
                                <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30">
                                    {activeConfig.urlLabel}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
                                        <Link2 size={14} />
                                    </span>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder={activeConfig.urlPlaceholder}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/6 transition-all"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* File Dropzone — for pdf / image */}
                        {isFileType && (
                            <motion.div
                                key="file-input"
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                            >
                                <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1.5">
                                    {activeType === "pdf" ? "PDF File" : "Image File"}
                                </label>
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragOver(true);
                                    }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${dragOver
                                        ? "border-indigo-500/60 bg-indigo-500/8"
                                        : file
                                            ? "border-indigo-500/40 bg-indigo-500/5"
                                            : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept={activeType === "pdf" ? ".pdf" : "image/*"}
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {file ? (
                                        <>
                                            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-2">
                                                {activeType === "pdf" ? (
                                                    <FileText size={16} className="text-indigo-400" />
                                                ) : (
                                                    <Image size={16} className="text-indigo-400" />
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-white/80 text-center truncate max-w-[200px]">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-white/30 mt-0.5">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB — click to
                                                change
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center mb-2">
                                                <Upload size={16} className="text-white/40" />
                                            </div>
                                            <p className="text-sm font-medium text-white/50">
                                                Drag & drop or click to upload
                                            </p>
                                            <p className="text-xs text-white/25 mt-0.5">
                                                {activeType === "pdf" ? "PDF" : "PNG, JPG, WEBP"} up to
                                                25MB
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
                                <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30">
                                    Note Content
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Write your note here... markdown is supported"
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/6 transition-all resize-none"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Personal context — always shown */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/30">
                            Personal Context{" "}
                            <span className="normal-case tracking-normal text-white/20">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Why are you saving this? Any notes for your future self..."
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/6 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 pt-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/25">
                        <Sparkles size={12} />
                        <span className="text-[10px]">AI will auto-index this content</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/6 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/20"
                        >
                            Save to Brain
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}