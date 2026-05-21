"use client";

import { Plus, Sparkles } from "lucide-react";

interface DashboardFABProps {
    onAddContent: () => void;
}

export function DashboardFAB({ onAddContent }: DashboardFABProps) {
    return (
        <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3">
            <button
                onClick={onAddContent}
                className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full shadow-[0_0_24px_-4px_rgba(51,102,255,0.5)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            >
                <Plus className="w-5 h-5" />
            </button>
            <button className="w-12 h-12 bg-surface-container-high text-on-surface rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-bright transition-colors cursor-pointer">
                <Sparkles className="w-4 h-4" />
            </button>
        </div>
    );
}
