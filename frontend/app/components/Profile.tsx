"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    FolderOpen,
    Network,
    Copy,
    Puzzle,
    LogOut,
    User,
    ChevronRight,
    Sparkles,
    Crown,
    Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getExtensionToken, logout } from "../services/api";
import type { Me } from "../types/memory";

interface ProfileProps {
    me: Me | null;
    onClose?: () => void;
}

const menuItems = [
    { icon: FolderOpen, label: "Collections", path: "/collections" },
    { icon: Network, label: "Knowledge Graph", path: "/graph" },
    { icon: Copy, label: "Find Duplicates", path: "/duplicates" },
];

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
    const percent = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                <span className="text-[10px] text-slate-400 font-medium">
                    {used} / {limit}
                </span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-indigo-500"}`}
                />
            </div>
        </div>
    );
}

export default function UserProfileDropdown({ me, onClose }: ProfileProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const [tokenState, setTokenState] = useState<"idle" | "copied" | "error">("idle");

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose?.();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const copyExtensionToken = async () => {
        try {
            await navigator.clipboard.writeText(await getExtensionToken());
            setTokenState("copied");
        } catch {
            setTokenState("error");
        }
        setTimeout(() => setTokenState("idle"), 2500);
    };

    const handleLogout = async () => {
        onClose?.();
        await logout().catch(() => undefined);
        router.push("/");
    };

    const nearLimit = me && (me.usage.memoryCount / me.plan.maxMemories > 0.75 || me.usage.chatsToday / me.plan.chatsPerDay > 0.75);

    return (
        <div className="relative" ref={dropdownRef}>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 top-1 w-72 bg-[#111118] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                >
                    {/* Header */}
                    <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-primary-container ring-2 ring-indigo-500/20">
                                <User className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-white truncate">{me?.user.username ?? "…"}</h3>
                                    {me?.plan.name === "premium" && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                                            <Crown className="w-2.5 h-2.5" />
                                            PRO
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 truncate">{me?.user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Plan usage */}
                    {me && (
                        <div className="px-5 py-4 space-y-3 border-b border-white/[0.04]">
                            <UsageBar label="Memories" used={me.usage.memoryCount} limit={me.plan.maxMemories} />
                            <UsageBar label="AI answers today" used={me.usage.chatsToday} limit={me.plan.chatsPerDay} />
                            {nearLimit && me.plan.name === "free" && (
                                <p className="text-[10px] text-amber-400/80 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5" />
                                    Upgrade to Pro for higher limits
                                </p>
                            )}
                        </div>
                    )}

                    {/* Menu Items */}
                    <div className="py-2">
                        {menuItems.map(({ icon: Icon, label, path }) => (
                            <button
                                key={path}
                                onClick={() => {
                                    onClose?.();
                                    router.push(path);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors duration-150 group cursor-pointer"
                            >
                                <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                <span className="flex-1 text-left">{label}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                            </button>
                        ))}
                        <button
                            onClick={copyExtensionToken}
                            className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors duration-150 group cursor-pointer"
                            title="Paste this token into the Brainly browser extension"
                        >
                            {tokenState === "copied" ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <Puzzle className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                            )}
                            <span className="flex-1 text-left">
                                {tokenState === "copied" ? "Token copied!" : tokenState === "error" ? "Couldn't copy token" : "Copy extension token"}
                            </span>
                        </button>
                    </div>

                    <div className="border-t border-white/[0.04]" />

                    {/* Logout */}
                    <div className="p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors duration-150 group cursor-pointer"
                        >
                            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            <span>Logout</span>
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
