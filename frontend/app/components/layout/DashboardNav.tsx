"use client";

import Link from "next/link";
import { Brain, FolderOpen, Network, Plus, UserCircle2 } from "lucide-react";

interface DashboardNavProps {
    onAddContent?: () => void;
    onProfileToggle?: () => void;
}

export function DashboardNav({ onAddContent, onProfileToggle }: DashboardNavProps) {
    return (
        <header className="fixed top-0 w-full z-50 bg-[#121212]/80 backdrop-blur-xl border-b border-outline-variant/10">
            <nav className="flex items-center justify-between px-4 md:px-10 h-12 max-w-5xl mx-auto">
                {/* Logo */}
                <Link href="/chat" className="flex items-center gap-2 shrink-0">
                    <Brain className="w-4 h-4 text-primary-container" />
                    <span className="text-sm font-black tracking-tighter text-on-surface">
                        Brainly AI
                    </span>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Link
                        href="/collections"
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                        title="Collections"
                    >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Collections</span>
                    </Link>
                    <Link
                        href="/graph"
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
                        title="Knowledge graph"
                    >
                        <Network className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Graph</span>
                    </Link>
                    {onAddContent && (
                        <button
                            onClick={onAddContent}
                            className="flex items-center gap-1.5 bg-primary-container text-on-primary-container px-3 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add Memory</span>
                            <span className="sm:hidden">Add</span>
                        </button>
                    )}
                    {onProfileToggle && (
                        <button
                            onClick={onProfileToggle}
                            className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                        >
                            <UserCircle2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
}
