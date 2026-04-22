"use client";

import { motion } from "motion/react";
import {
    Brain,
    FileText,
    Link2,
    FileEdit,
    Database,
    Target,
    Lock,
    Zap,
    Network,
    ArrowRight,
    Globe,
    Mail,
} from "lucide-react";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about", active: true },
];

const values = [
    {
        icon: Target,
        title: "Precision over Volume",
        desc: "Most tools focus on storing more. We focus on understanding better. Our AI filters noise and surfaces only high-signal insights from your saved content.",
        tags: ["Accuracy", "Curation", "Relevance"],
        wide: true,
        gradient: false,
    },
    {
        icon: Lock,
        title: "Sovereign Privacy",
        desc: "Your data is your property. End-to-end encryption ensures your knowledge base remains yours alone — never sold, never shared.",
        wide: false,
        gradient: false,
    },
    {
        icon: Zap,
        title: "Instant Recall",
        desc: "120ms average search latency. From thought to discovery in the blink of an eye.",
        wide: false,
        gradient: false,
    },
    {
        icon: Network,
        title: "Scale with Your Life",
        desc: "Whether you're a solo student or a research team, Brainly scales to match the complexity of your knowledge stack — from 10 documents to 10,000.",
        wide: true,
        gradient: true,
    },
];

const integrationNodes = [
    { icon: FileText, label: "Resume_2026.pdf", sub: "2.4 MB • Structured", color: "text-error", bg: "bg-error/10", pos: "top-[70px] left-[50px]" },
    { icon: Link2, label: "Research_article.org", sub: "Web source • Verified", color: "text-primary", bg: "bg-primary/10", pos: "top-[110px] right-[30px]" },
    { icon: FileEdit, label: "Morning_Thoughts.txt", sub: "Markdown • Key Insights", color: "text-secondary", bg: "bg-secondary/10", pos: "bottom-[70px] left-[80px]" },
    { icon: Database, label: "Project_Knowledge_Base", sub: "Database • Synced", color: "text-tertiary", bg: "bg-tertiary/10", pos: "bottom-[90px] right-[50px]" },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background text-on-surface font-body">

            {/* ── NAV ── */}
            <header className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl border-b border-outline-variant/10">
                <nav className="flex justify-between items-center px-10 md:px-20 py-3 max-w-[1200px] mx-auto">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary-container" fill="currentColor" />
                            <span className="text-lg font-black tracking-tighter text-[#E5E2E1]">Brainly AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-xs font-medium">
                            {navLinks.map((l) => (
                                <a
                                    key={l.label}
                                    href={l.href}
                                    className={
                                        l.active
                                            ? "text-primary-container font-bold border-b-2 border-primary-container pb-0.5"
                                            : "text-[#E5E2E1]/60 hover:text-[#E5E2E1] transition-colors"
                                    }
                                >
                                    {l.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="text-xs font-medium text-[#E5E2E1]/60 hover:text-[#E5E2E1] transition-colors">
                            Sign In
                        </button>
                        <button className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-medium hover:brightness-110 transition-all cursor-pointer">
                            Get Started
                        </button>
                    </div>
                </nav>
            </header>

            <main className="pt-24">

                {/* ── HERO ── */}
                <section className="max-w-[1200px] mx-auto px-10 md:px-20 py-16 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <span className="text-secondary font-bold tracking-widest text-[10px] uppercase mb-3 block">
                            Our Identity
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-on-surface mb-6 leading-[1.05]">
                            Solving the{" "}
                            <span className="text-primary-container">Digital Black Hole.</span>
                        </h1>
                        <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
                            We live in an era where valuable information — resumes, YouTube tutorials,
                            research papers, X threads — is scattered across platforms. You save a link
                            to WhatsApp and lose it forever. Brainly was built to end that. One intelligent
                            knowledge base that doesn't just store your content — it understands it.
                        </p>
                    </motion.div>
                </section>

                {/* ── NEURAL ENGINE VISUAL ── */}
                <section className="max-w-[1200px] mx-auto px-10 md:px-20 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-2xl bg-surface-container-low/40 border border-outline-variant/15 overflow-hidden p-10 md:p-14"
                    >
                        {/* glow */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,#3366FF_0%,transparent_70%)]" />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                            {/* Visual node map */}
                            <div className="relative h-[360px] flex items-center justify-center order-2 lg:order-1">
                                {/* Center node */}
                                <div className="relative z-10 w-20 h-20 bg-primary-container rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(51,102,255,0.3)] outline outline-8 outline-primary-container/10">
                                    <Brain className="w-8 h-8 text-on-primary-container" fill="currentColor" />
                                    <div className="absolute inset-0 rounded-full border border-primary-container/40 animate-ping" />
                                </div>

                                {/* SVG lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line stroke="rgba(51,102,255,0.2)" strokeWidth="1" x1="50%" y1="50%" x2="18%" y2="22%" />
                                    <line stroke="rgba(51,102,255,0.2)" strokeWidth="1" x1="50%" y1="50%" x2="82%" y2="32%" />
                                    <line stroke="rgba(51,102,255,0.2)" strokeWidth="1" x1="50%" y1="50%" x2="24%" y2="82%" />
                                    <line stroke="rgba(51,102,255,0.2)" strokeWidth="1" x1="50%" y1="50%" x2="80%" y2="80%" />
                                </svg>

                                {/* Orbit nodes */}
                                {integrationNodes.map((node, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.1 + i * 0.12 }}
                                        className={`absolute ${node.pos} p-3 bg-surface-container-high rounded-xl border border-outline-variant/20 flex items-center gap-2.5`}
                                    >
                                        <div className={`w-8 h-8 ${node.bg} rounded-lg flex items-center justify-center ${node.color} shrink-0`}>
                                            <node.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-on-surface">{node.label}</p>
                                            <p className="text-[9px] text-on-surface-variant">{node.sub}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Text */}
                            <div className="order-1 lg:order-2 space-y-6">
                                <h2 className="text-2xl font-black text-on-surface tracking-tight">
                                    One Brain for All Your Content
                                </h2>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Brainly's AI doesn't just index your files — it builds a semantic map
                                    of relationships between them. A PDF you uploaded 6 months ago connects
                                    to a note you wrote today. A YouTube video links to a saved article.
                                    Everything becomes part of one living, queryable knowledge base.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        {
                                            title: "Automated Cross-Referencing",
                                            desc: "Find links between a PDF read 6 months ago and a note written today — automatically.",
                                        },
                                        {
                                            title: "Verified Answers Only",
                                            desc: "Every answer is grounded strictly in your own data. No hallucinations, no guesswork.",
                                        },
                                        {
                                            title: "No Manual Sorting",
                                            desc: "No folders, no tags. The AI handles organization so you never have to.",
                                        },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-1 w-4 h-4 rounded-full border border-primary-container/40 flex items-center justify-center shrink-0">
                                                <div className="w-1.5 h-1.5 bg-primary-container rounded-full" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-on-surface">{item.title}</p>
                                                <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.desc}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* ── CORE VALUES BENTO ── */}
                <section className="max-w-[1200px] mx-auto px-10 md:px-20 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-8"
                    >
                        <span className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-2 block">
                            What We Stand For
                        </span>
                        <h2 className="text-2xl font-black tracking-tight text-on-surface">
                            Built on four principles
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Precision — wide */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.05 }}
                            className="md:col-span-2 bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-6 text-primary-container/8">
                                <Target className="w-24 h-24" />
                            </div>
                            <div className="relative z-10 max-w-sm">
                                <Target className="w-6 h-6 text-primary-container mb-4" />
                                <h3 className="text-base font-black text-on-surface mb-2">Precision over Volume</h3>
                                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                                    Most AI systems focus on "more data". We focus on "better connections". Our algorithms
                                    filter noise and surface only high-signal insights from your saved content.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {["Accuracy", "Curation", "Relevance"].map((tag) => (
                                        <span key={tag} className="bg-secondary-container/30 text-on-secondary-container px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Privacy */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-surface-container-high p-8 rounded-2xl border border-outline-variant/10 flex flex-col justify-between"
                        >
                            <Lock className="w-6 h-6 text-primary mb-4" />
                            <div>
                                <h3 className="text-sm font-black text-on-surface mb-2">Sovereign Privacy</h3>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Your data is your property. End-to-end encryption ensures your intellect remains yours alone.
                                </p>
                            </div>
                        </motion.div>

                        {/* Speed */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.15 }}
                            className="bg-surface-container-high p-8 rounded-2xl border border-outline-variant/10 flex flex-col justify-between"
                        >
                            <Zap className="w-6 h-6 text-secondary mb-4" />
                            <div>
                                <h3 className="text-sm font-black text-on-surface mb-2">Instant Recall</h3>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    120ms average search latency. From thought to discovery in the blink of an eye.
                                </p>
                            </div>
                        </motion.div>

                        {/* Scale — wide */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="md:col-span-2 bg-gradient-to-br from-primary-container/15 to-surface-container-low p-8 rounded-2xl border border-outline-variant/10 flex items-center justify-between gap-8"
                        >
                            <div className="max-w-sm">
                                <Network className="w-6 h-6 text-primary-container mb-4" />
                                <h3 className="text-base font-black text-on-surface mb-2">Scale with Your Life</h3>
                                <p className="text-xs text-on-surface-variant leading-relaxed">
                                    Whether you're a solo researcher or a global team, Brainly scales its neural pathways
                                    to match the complexity of your knowledge stack — from 10 documents to 10,000.
                                </p>
                            </div>
                            <div className="hidden md:flex w-20 h-20 rounded-2xl bg-surface-container-highest border border-outline-variant/20 items-center justify-center shrink-0">
                                <Network className="w-8 h-8 text-primary opacity-40" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* ── CTA ── */}
                <section className="max-w-[1200px] mx-auto px-10 md:px-20 mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative rounded-2xl bg-surface border border-outline-variant/10 overflow-hidden py-16 text-center"
                    >
                        <div className="absolute -top-20 -left-20 w-52 h-52 bg-primary-container/10 blur-[80px] rounded-full" />
                        <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-secondary-container/10 blur-[80px] rounded-full" />
                        <div className="relative z-10 space-y-5 px-6">
                            <h2 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight">
                                Ready to stop losing your saved content?
                            </h2>
                            <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                                Join thousands of creators, researchers, and students who are turning scattered
                                links and documents into an intelligent second brain.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                                <button className="bg-primary-container text-on-primary-container px-7 py-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    Get Started for Free
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <button className="bg-surface-container-highest text-on-surface px-7 py-3 rounded-xl font-bold text-sm border border-outline-variant/20 hover:bg-surface-container-high transition-all cursor-pointer">
                                    Book a Demo
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* ── FOOTER ── */}
            <footer className="w-full border-t border-outline-variant/10 bg-background">
                <div className="flex flex-col md:flex-row justify-between items-center px-10 md:px-20 py-8 max-w-[1200px] mx-auto w-full gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-on-surface/40" />
                            <span className="text-sm font-black text-on-surface/50">Brainly AI</span>
                        </div>
                        <p className="text-[9px] tracking-widest uppercase text-on-surface/40">
                            © 2024 Brainly AI. Precision built for knowledge.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-5 text-[9px] tracking-widest uppercase">
                        {["Privacy", "Terms", "API Docs", "Status", "Twitter", "GitHub"].map((l) => (
                            <a key={l} href="#" className="text-on-surface/40 hover:text-secondary transition-colors">{l}</a>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {[Globe, Mail].map((Icon, i) => (
                            <a key={i} href="#" className="w-7 h-7 rounded-full border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:border-primary-container transition-all">
                                <Icon className="w-3.5 h-3.5" />
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}