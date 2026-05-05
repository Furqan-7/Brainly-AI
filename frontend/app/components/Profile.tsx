

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
    Settings,
    Shield,
    Database,
    Bell,
    Palette,
    Plug,
    LogOut,
    User,
    ChevronRight,
    Sparkles,
    Crown,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProfileProps {
    user?: {
        name: string;
        email: string;
        avatar?: string;
        plan?: "free" | "pro";
        usagePercent?: number;
    };
    onLogout?: () => void;
    onNavigate?: (path: string) => void;
}

const menuItems = [
    { icon: Settings, label: "Account Settings", path: "/settings" },
    { icon: Shield, label: "Security & Privacy", path: "/security" },
    { icon: Database, label: "Knowledge Vault", path: "/vault", showUsage: true },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Palette, label: "Theme: Dark", path: "/theme", isToggle: true },
    { icon: Plug, label: "Integrations", path: "/integrations" },
];

export default function UserProfileDropdown({
    user = {
        name: "Furqan",
        email: "furqan.developer@email.com",
        plan: "free",
        usagePercent: 75,
    },
    onLogout,
    onNavigate,
}: ProfileProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [isDark, setIsDark] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const route = useRouter();
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleItemClick = (path: string, isToggle?: boolean) => {
        if (isToggle) {
            setIsDark(!isDark);
            return;
        }
        setIsOpen(false);
        onNavigate?.(path);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
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
                                <div className="flex items-center justify-center w-11 h-11 rounded-full  bg-primary-container from-indigo-500 to-purple-600 ring-2 ring-indigo-500/20">
                                    <User className="w-5 h-5 text-white " strokeWidth={2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-white truncate">
                                            {user.name}
                                        </h3>
                                        {user.plan === "pro" && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                                                <Crown className="w-2.5 h-2.5" />
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={index}>
                                        <button
                                            onClick={() => handleItemClick(item.path, item.isToggle)}
                                            className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-colors duration-150 group"
                                        >
                                            <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                            <span className="flex-1 text-left">{item.label}</span>

                                            {item.isToggle ? (
                                                <div
                                                    className={`relative w-8 h-4 rounded-full transition-colors duration-200 ${isDark ? "bg-indigo-500" : "bg-slate-600"
                                                        }`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${isDark ? "translate-x-4" : "translate-x-0.5"
                                                            }`}
                                                    />
                                                </div>
                                            ) : (
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                                            )}
                                        </button>

                                        {/* Usage Bar for Knowledge Vault */}
                                        {item.showUsage && user.usagePercent !== undefined && (
                                            <div className="px-5 pb-3 pt-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        Storage Used
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {user.usagePercent}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${user.usagePercent}%` }}
                                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${user.usagePercent > 90
                                                            ? "bg-red-500"
                                                            : user.usagePercent > 75
                                                                ? "bg-amber-500"
                                                                : "bg-indigo-500"
                                                            }`}
                                                    />
                                                </div>
                                                {user.usagePercent > 75 && (
                                                    <p className="mt-1.5 text-[10px] text-amber-400/80 flex items-center gap-1">
                                                        <Sparkles className="w-2.5 h-2.5" />
                                                        Upgrade to Pro for unlimited storage
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/[0.04]" />

                        {/* Logout */}
                        <div className="p-2">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    localStorage.removeItem("token");
                                    route.push("/");
                                    onLogout?.();
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors duration-150 group"
                            >
                                <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}