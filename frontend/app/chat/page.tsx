"use client";

import { Profiler, useState, useEffect } from "react";
import { motion } from "motion/react";
import {
    Search,
    SlidersHorizontal,
    Video,
    ExternalLink,
    FileText,
    Bookmark,
    Brain,
    ArrowRight,
    Plus,
    Sparkles,
    LayoutDashboard,
    Lightbulb,
    Settings,
    UserCircle2,
    ArrowDown,
    Loader2,
} from "lucide-react";
import AddContent from "../components/AddContent";
import { ContentGrid, MemoryCard } from "../components/ContentGrid";
import Profile from "../components/Profile";
import UserProfileDropdown from "../components/Profile";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ChatComponent } from "../components/ChatComponent";

const navLinks = [
    { label: "Memories", icon: LayoutDashboard, active: true },
    { label: "Insights", icon: Lightbulb, active: false },
    { label: "Settings", icon: Settings, active: false },
];

const viewTabs = ["Recent", "Starred", "Archives"];

const contentFilters = ["All", "Web Pages", "Videos", "Tweets", "Documents", "Notes"];
type MemoryType = "youtube" | "pdf" | "tweet" | "url" | "note" | "image";

interface Memory {
    id: number;
    userId: number;
    type: MemoryType;
    title: string;
    source_url: string | null;
    file_path: string | null;
    status: "pending" | "processing" | "ready" | "failed";
    metadata: any;
    createdAt: string;
}



export default function ChatPage() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeView, setActiveView] = useState("Recent");
    const [isAddContentOpen, setIsAddContentOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState("");





    useEffect(() => {
        fetchMemories();
    }, []);

    const fetchMemories = async () => {
        try {
            const token = localStorage.getItem("token");
            const name = localStorage.getItem("username");
            if (name) {
                setUsername(name);
            }
            if (!token) {
                router.push("/");
            }
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API}/api/content`, {
                headers: { token }
            });

            // ✅ log this to see exact structure
            console.log("API response:", res.data);

            // ✅ adjust path to match your actual response
            const data = res.data.memories        // try this first
                ?? res.data.data?.memories  // fallback
                ?? [];

            setMemories(data.filter(Boolean));    // remove any undefined items

        } catch (err) {
            setError("Failed to load memories.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary-container animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-sm text-error">{error}</p>
            </div>
        );
    }



    return (
        <div
            className="min-h-screen text-on-surface font-body"
            style={{
                backgroundColor: "#121212",
                backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
            }}
        >
            {/* ── TOP NAV ── */}
            <header className="fixed top-0 w-full z-50 bg-[#121212]/80 backdrop-blur-xl border-b border-outline-variant/10">
                <nav className="flex items-center justify-between px-6 md:px-10 h-12 max-w-5xl mx-auto">

                    {/* Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Brain className="w-4 h-4 text-primary-container" />
                        <span className="text-sm font-black tracking-tighter text-on-surface">Brainly AI</span>
                    </div>

                    {/* Nav links */}
                    <div className="flex items-center gap-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.label}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${link.active
                                    ? "bg-primary-container/15 text-primary-container"
                                    : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container-high"
                                    }`}
                            >
                                <link.icon className="w-3.5 h-3.5" />
                                {link.label}
                            </button>
                        ))}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => {
                            setIsAddContentOpen(true);
                        }} className="flex items-center gap-1.5 bg-primary-container text-on-primary-container px-3 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all cursor-pointer">
                            <Plus className="w-3.5 h-3.5" />
                            Add Memory
                        </button>
                        <button onClick={() => {
                            setIsProfileOpen(prev => !prev);
                        }} className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
                            <UserCircle2 className="w-4 h-4" />
                        </button>
                    </div>
                </nav>
            </header>


            {/* Profile Icon Section  */}
            {isProfileOpen && (
                <div className="absolute right-10 top-12 z-50">
                    <UserProfileDropdown />
                </div>
            )}

            {/* Add Content Section  */}
            {isAddContentOpen && (
                <div className="fixed inset-0 w-full h-screen z-[9999] rounded-xl overflow-hidden shadow-2xl relative z-10 bg-surface" >
                    <AddContent isAddContentOpen={isAddContentOpen} setIsAddContentOpen={setIsAddContentOpen} fetchMemories={fetchMemories} />
                </div>
            )}


            {/* ── MAIN ── */}
            <main className="w-full max-w-5xl mx-auto px-6 md:px-10 pt-20 pb-10 space-y-8">

                {/* ── GREETING ── */}
                <motion.header
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center space-y-1.5 pt-4"
                >
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-on-surface">
                        Good Evening, {username || "User"}
                    </h1>
                    <p className="text-on-surface-variant text-sm font-medium opacity-70">
                        Your digital mind is synchronized and ready.
                    </p>
                </motion.header>

                {/* ── SEARCH ── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-2xl mx-auto space-y-3"
                >
                    {/* Search bar */}
                    <div className="relative flex items-center group">
                        <div className="absolute -inset-1 bg-[#6366F1] rounded-xl blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity" />
                        <div className="relative flex w-full items-center bg-surface-container-high border border-outline-variant/30 rounded-xl overflow-hidden px-4 h-12 shadow-2xl gap-3">
                            <Search className="w-4 h-4 text-primary-fixed-dim shrink-0" />
                            <input onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                                className="bg-transparent border-none focus:ring-0 w-full text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                                placeholder="Search your memories, documents, or insights..."
                                type="text"
                            />
                            <button onClick={() => {
                                setSubmittedQuery(searchQuery);
                            }} className="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1.5 rounded-lg border border-outline-variant/50 hover:bg-surface-bright transition-colors shrink-0 cursor-pointer">
                                <SlidersHorizontal className="w-3 h-3" />
                                <span className="text-[10px] font-bold tracking-widest uppercase">Filter</span>
                            </button>
                        </div>
                    </div>

                    {/* Querry Result Component  */}
                    <ChatComponent text={submittedQuery} />


                    {/* {Scroll Down Icon } */}
                    <div className="mt-70 flex justify-center items-center flex-col gap-1  ">
                        <div className="flex justify-center items-center flex-col gap-1">
                            <div className="text-on-surface-variant/60">
                                <p>Scroll Down to see your Memories</p>
                            </div>
                            <div className="justify-center flex">
                                <ArrowDown className="w-5 h-5 text-on-surface-variant/70 " />
                            </div>
                        </div>


                    </div>
                    {/* View tabs — Recent / Starred / Archives */}
                    <div className="flex justify-center gap-2  mt-20">
                        {viewTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveView(tab)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all cursor-pointer ${activeView === tab
                                    ? "bg-secondary-container/30 border border-secondary-fixed-dim/20 text-secondary-fixed-dim"
                                    : "bg-surface-container-high/50 border border-outline-variant/20 text-on-surface-variant/60 hover:text-on-surface-variant"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </motion.section>

                {/* ── CONTENT TYPE FILTER PILLS ── */}

                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="flex flex-wrap items-center gap-2"
                >
                    {contentFilters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${activeFilter === f
                                ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_-2px_rgba(51,102,255,0.4)]"
                                : "bg-surface-container-high border border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50 hover:text-on-surface"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </motion.div>



                {/* ── BENTO GRID ── */}
                {memories.length > 0 ? (
                    <ContentGrid memories={memories} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Brain className="w-10 h-10 text-on-surface-variant/20" />
                        <p className="text-sm text-on-surface-variant/50">No memories yet. Add your first one!</p>
                    </div>
                )}
            </main>

            {/* ── FAB BUTTONS ── */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3">
                <button onClick={() => {
                    setIsAddContentOpen(true);
                }} className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full shadow-[0_0_24px_-4px_rgba(51,102,255,0.5)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                    <Plus className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-surface-container-high text-on-surface rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-bright transition-colors cursor-pointer">
                    <Sparkles className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}