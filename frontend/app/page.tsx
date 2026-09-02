/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Link2,
  MessageSquare,
  Sparkles,
  Zap,
  FileText,
  Video,
  Database,
  BrainCircuit,
  ArrowRight,
  Plus,
  Search,
  Globe,
  Mail,
  ShieldCheck,
  Layers,
  Bot,
  ChevronDown,
  Star,
  Quote,
  Clock,
  Check,
  Hash,
  ExternalLink,
  BookOpen,
  Share2,
  FileSearch,
  Network,
  Cpu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Plans data strictly matching the original /pricing page
const plans = [
  {
    name: "Basic",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    period: "/mo",
    cta: "Get Started",
    ctaStyle: "border",
    popular: false,
    features: [
      { text: "5 documents / month", included: true },
      { text: "Basic AI chat interface", included: true },
      { text: "YouTube video analysis", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    monthlyPrice: "$20",
    yearlyPrice: "$16",
    period: "/mo",
    cta: "Upgrade Now",
    ctaStyle: "filled",
    popular: true,
    features: [
      { text: "Unlimited documents & URLs", included: true },
      { text: "YouTube video analysis", included: true },
      { text: "Priority 24/7 support", included: true },
      { text: "Advanced reasoning models", included: true },
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    period: "",
    cta: "Contact Sales",
    ctaStyle: "border",
    popular: false,
    features: [
      { text: "Team collaboration", included: true },
      { text: "Full API access", included: true },
      { text: "Custom model training", included: true },
      { text: "Dedicated success manager", included: true },
    ],
  },
];

const INGESTION_FORMATS = [
  {
    id: "youtube",
    label: "YouTube Videos",
    icon: Video,
    tag: "Auto-Transcribe & Timestamp",
    title: "Extract Insights from 2-Hour Lectures in Seconds",
    desc: "Paste any YouTube link. Brainly parses the audio transcript, identifies critical keyframes, extracts speaker concepts, and lets you jump directly to relevant timestamps.",
    preview: {
      type: "video",
      title: "Stanford CS229: Machine Learning & Deep Neural Nets",
      duration: "1h 42m",
      timestamp: "04:18",
      keyConcept: "Gradient descent convergence & backpropagation calculus",
      bullets: [
        "Auto-generated synchronized transcript with speaker separation",
        "Semantic chapter segmentation with 1-click video jumping",
        "Instant key takeaway summaries and mathematical formula extraction",
      ],
    },
  },
  {
    id: "pdf",
    label: "Research PDFs & Docs",
    icon: FileText,
    tag: "OCR & Document Chunking",
    title: "Deep Comprehension Across 100+ Page Whitepapers",
    desc: "Upload dense research papers, technical manuals, or legal contracts. Brainly chunks tables, schemas, and footnotes so you can query granular details effortlessly.",
    preview: {
      type: "pdf",
      title: "Attention Is All You Need — Vaswani et al.",
      pages: "15 Pages • PDF",
      keyConcept: "Multi-Head Self-Attention Architecture",
      bullets: [
        "Preserves table relationships, equations, and footnotes",
        "Interactive citations direct you to the exact page and paragraph",
        "Extracts methodology, results, and benchmark comparisons",
      ],
    },
  },
  {
    id: "web",
    label: "Web Pages & URLs",
    icon: Globe,
    tag: "Clean Ingestion",
    title: "Clutter-Free Reader & Intelligent Article Scraper",
    desc: "Clip blog posts, documentation, and technical write-ups. Brainly strips ads, cookie banners, and noise, saving clean structured markdown to your library.",
    preview: {
      type: "web",
      title: "Distributed Systems Consensus & Raft Protocol",
      source: "mit.edu/distributed-systems",
      keyConcept: "Leader Election & Log Replication Safety",
      bullets: [
        "Removes sidebars, popups, and formatting clutter",
        "Vectorized into your permanent knowledge graph instantly",
        "Cross-references newly saved web content with your existing notes",
      ],
    },
  },
  {
    id: "notes",
    label: "Rich Notes & Thoughts",
    icon: BookOpen,
    tag: "Auto-Tagging",
    title: "Dynamic Markdown with Neural Auto-Tagging",
    desc: "Jot down ideas, meeting notes, or code snippets. Brainly automatically categorizes entities, maps conceptual links, and prepares your notes for instant AI synthesis.",
    preview: {
      type: "notes",
      title: "Q3 Architecture Refactoring & Vector DB Benchmarks",
      tags: ["#systems", "#vector-db", "#rag-pipeline"],
      keyConcept: "Cosine Similarity vs HNSW Indexing Latency",
      bullets: [
        "Markdown formatting with code syntax highlighting",
        "Automatic entity recognition and topic categorization",
        "Seamless synthesis with external documents and video clips",
      ],
    },
  },
];

const FAQS = [
  {
    q: "How does Brainly ingest and process YouTube videos and PDFs?",
    a: "Brainly utilizes high-throughput asynchronous workers. For YouTube videos, it extracts verbatim transcripts, aligns them with video timestamps, and segments them into semantic chapters. For PDFs and documents, it uses intelligent layout parsing to preserve tables, headers, and formulas before generating dense vector embeddings for sub-second retrieval.",
  },
  {
    q: "Is my personal data private and secure? Do you train models on my data?",
    a: "No. Your data is strictly private and sovereign. We never train public foundation models on your documents, notes, or chat queries. All stored knowledge is encrypted at rest and in transit.",
  },
  {
    q: "How do citations and verified answers work?",
    a: "When you ask a question in Brainly, our RAG (Retrieval-Augmented Generation) pipeline retrieves the exact chunks of text from your library. Every claim in the AI's response is accompanied by a clickable citation badge that takes you directly to the source page, paragraph, or YouTube timestamp.",
  },
  {
    q: "Can I search across my entire library or focus on a single document?",
    a: "Both! You can have a broad conversation with your entire second brain — querying across dozens of PDFs, videos, and notes simultaneously — or open a specific document workspace to focus solely on that file.",
  },
  {
    q: "What is the difference between the Basic and Pro plans?",
    a: "The Basic plan ($0/mo) lets you explore Brainly with up to 5 documents per month and basic chat capabilities. The Pro plan ($16/mo billed annually or $20/mo monthly) unlocks unlimited documents & URLs, full YouTube video intelligence, advanced reasoning models, and priority 24/7 support.",
  },
];

const TESTIMONIALS = [
  {
    name: "Dr. Elena Rostova",
    role: "AI Researcher, Stanford Vision Lab",
    avatar: "ER",
    text: "Brainly completely transformed my literature review process. Instead of drowning in 50-page PDFs, I can instantly cross-reference algorithms and verify equations with precise source citations in seconds.",
  },
  {
    name: "Marcus Vance",
    role: "Staff Software Engineer, Scaled Systems",
    avatar: "MV",
    text: "Being able to drop a 2-hour technical conference talk and immediately search for the exact architectural trade-offs discussed at minute 43 is pure magic. It's an indispensable tool for my engineering workflow.",
  },
  {
    name: "Sophia Lin",
    role: "Product Strategist & Tech Writer",
    avatar: "SL",
    text: "I save dozens of articles, research whitepapers, and tweets every week. Brainly acts as my external brain, effortlessly synthesizing complex themes and saving me 15+ hours every single week.",
  },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [yearly, setYearly] = useState(true);
  const [activeIngestTab, setActiveIngestTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      router.replace("/chat");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Brain className="w-8 h-8 text-primary-container animate-pulse" />
      </div>
    );
  }

  const handleGetStarted = () => {
    router.push("/auth/signup");
  };

  const selectedFormat = INGESTION_FORMATS[activeIngestTab];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container scroll-smooth">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/70 backdrop-blur-xl border-b border-outline-variant/10">
        <nav className="flex justify-between items-center px-6 md:px-16 py-3.5 max-w-[1200px] mx-auto">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-lg font-black tracking-tighter text-[#E5E2E1] flex items-center gap-2 cursor-pointer"
          >
            <Brain className="text-primary-container w-6 h-6" />
            <span>Brainly AI</span>
          </div>

          <div className="hidden md:flex items-center gap-7 font-headline font-medium tracking-tight text-xs">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-primary-container font-bold border-b-2 border-primary-container pb-0.5 transition-all cursor-pointer"
            >
              HOME
            </button>
            <a
              className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all"
              href="#features"
            >
              FEATURES
            </a>
            <a
              className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all"
              href="#workflow"
            >
              WORKFLOW
            </a>
            <a
              className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all"
              href="#faq"
            >
              FAQ
            </a>
            <a
              className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all"
              href="#pricing"
            >
              PRICING
            </a>
            <button
              onClick={() => router.push("/about")}
              className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all cursor-pointer"
            >
              ABOUT
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGetStarted}
              className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-headline font-medium tracking-tight text-xs hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary-container/20 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* ─────────────────────────────────────────────────────────────
            HERO SECTION (Preserved verbatim as requested)
        ───────────────────────────────────────────────────────────── */}
        <section className="relative pt-24 pb-16 md:pt-36 md:pb-28 px-10 md:px-20 max-w-[1200px] mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative z-10">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5"
            >
              <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter leading-[0.95] text-on-surface">
                Your Personal AI <br />
                <span className="text-primary-container">Knowledge Assistant</span>
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant leading-relaxed max-w-xl">
                Transform any content into an interactive knowledge base. Summarize videos, chat with documents, and organize your digital life with atmospheric precision.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button onClick={() => router.push("/auth/signup")} className="w-full sm:w-auto bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  Try for Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a href="#features" className="w-full sm:w-auto border border-outline-variant/30 text-on-surface px-6 py-3 rounded-xl font-bold text-sm hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer text-center">
                  See How it Works
                </a>
              </div>
              <div className="flex items-center gap-5 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <CheckCircle2 className="text-primary-container w-4 h-4" fill="currentColor" fillOpacity={0.2} />
                  No Credit Card Required
                </div>
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <CheckCircle2 className="text-primary-container w-4 h-4" fill="currentColor" fillOpacity={0.2} />
                  Cancel Anytime
                </div>
              </div>
            </motion.div>

            {/* Right Column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-secondary/10 blur-[60px] rounded-full group-hover:bg-secondary/20 transition-all duration-700"></div>
              <div className="relative bg-surface-container-low border border-outline-variant/15 rounded-[1.5rem] p-6 md:p-8 lavender-glow">
                <div className="flex items-center gap-1.5 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary/40"></div>
                </div>
                <ul className="space-y-4">
                  {[
                    { icon: Link2, title: "Add any URL or Document", desc: "Instantly ingest web pages, PDFs, and YouTube links.", color: "primary-container" },
                    { icon: MessageSquare, title: "Chat with your Content", desc: "Ask questions and get verified answers from your data.", color: "secondary" },
                    { icon: Sparkles, title: "Get AI-powered Insights", desc: "Automated summaries and key-takeaway extraction.", color: "tertiary" }
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 group/item">
                      <div className={`mt-0.5 w-8 h-8 rounded-lg bg-${item.color}/10 flex items-center justify-center text-${item.color} shrink-0`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">{item.title}</h4>
                        <p className="text-xs text-on-surface-variant">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 pt-6 border-t border-outline-variant/10">
                  <div className="bg-surface-container-high rounded-xl p-3 flex items-center gap-3">
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center shrink-0"
                    >
                      <Zap className="text-white w-3.5 h-3.5" fill="currentColor" />
                    </motion.div>
                    <span className="text-xs font-medium">Analyzing "Modern AI Architectures.pdf"...</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          {/* Background Atmosphere */}
          <div className="absolute top-0 right-0 -z-10 w-[400px] h-[400px] bg-primary-container/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 1: UNIVERSAL INGESTION & INTERACTIVE FEATURE SHOWCASE
        ───────────────────────────────────────────────────────────── */}
        <section id="features" className="py-20 md:py-32 px-6 md:px-16 bg-surface-container-low/40 relative">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 mb-4"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-container" />
                <span className="text-primary-container font-bold text-[11px] tracking-wider uppercase font-headline">
                  Universal Cognitive Engine
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-black font-headline tracking-tighter text-on-surface mb-4 leading-tight"
              >
                Ingest Everything. <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                  Recall Anything in Milliseconds.
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 }}
                className="text-sm md:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed"
              >
                No more copy-pasting into disconnected notes. Brainly parses transcripts, OCRs documents, structures web articles, and creates an interconnected second brain.
              </motion.p>
            </div>

            {/* Interactive Ingestion Format Switcher */}
            <div className="mb-16">
              {/* Tabs */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
                {INGESTION_FORMATS.map((f, idx) => {
                  const Icon = f.icon;
                  const isActive = activeIngestTab === idx;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveIngestTab(idx)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-headline text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary-container text-on-primary-container shadow-lg shadow-primary-container/25 scale-105"
                          : "bg-surface-container border border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:border-primary-container/40"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-on-primary-container" : "text-primary"}`} />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Feature Preview Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedFormat.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface-container border border-outline-variant/15 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Left Detail Text */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-md bg-secondary-container/40 text-secondary border border-secondary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      {selectedFormat.tag}
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black font-headline tracking-tight text-on-surface leading-snug">
                      {selectedFormat.title}
                    </h3>

                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {selectedFormat.desc}
                    </p>

                    <div className="space-y-3 pt-2">
                      {selectedFormat.preview.bullets.map((b, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="mt-1 w-4 h-4 rounded-full bg-primary-container/20 text-primary-container flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="text-xs text-on-surface/90 leading-relaxed font-medium">
                            {b}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleGetStarted}
                        className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-on-surface group transition-colors cursor-pointer"
                      >
                        Try with your own {selectedFormat.label.toLowerCase()}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Right Mock UI Simulation */}
                  <div className="lg:col-span-6">
                    <div className="bg-[#0e0e0e] border border-outline-variant/20 rounded-2xl p-5 md:p-6 shadow-xl relative">
                      {/* Top Bar */}
                      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-tertiary/60" />
                          <div className="w-2.5 h-2.5 rounded-full bg-secondary/60" />
                          <span className="text-[11px] text-on-surface/40 font-mono ml-2">
                            brainly://memory/preview
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-primary-container/20 text-primary font-mono">
                          Indexed & Vectorized
                        </span>
                      </div>

                      {/* Content Card Body */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-on-surface">
                              {selectedFormat.preview.title}
                            </h4>
                            <p className="text-[11px] text-on-surface-variant">
                              {selectedFormat.preview.duration ||
                                selectedFormat.preview.pages ||
                                selectedFormat.preview.source ||
                                "Personal Knowledge Document"}
                            </p>
                          </div>
                          <div className="p-2 rounded-lg bg-surface-container-high text-primary-container shrink-0">
                            <selectedFormat.icon className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Simulated AI Output Bubble */}
                        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-primary-container font-bold">
                            <span className="flex items-center gap-1.5">
                              <Bot className="w-3.5 h-3.5" />
                              AI Verified Synthesis
                            </span>
                            <span className="text-[10px] text-on-surface/40 font-mono">120ms recall</span>
                          </div>
                          <p className="text-xs text-on-surface/80 leading-relaxed font-sans">
                            <span className="text-on-surface font-semibold">Key Finding:</span>{" "}
                            {selectedFormat.preview.keyConcept}
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] bg-white/5 hover:bg-white/10 text-on-surface/60 border border-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Quote className="w-2.5 h-2.5" /> Direct Citation Verified
                            </span>
                            {selectedFormat.preview.timestamp && (
                              <span className="text-[10px] bg-primary-container/10 text-primary border border-primary-container/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> @ {selectedFormat.preview.timestamp}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Action Footer */}
                        <div className="flex items-center justify-between pt-2 text-[11px] text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                            Grounded Retrieval (Zero Hallucination)
                          </span>
                          <span className="text-primary font-mono text-[10px] cursor-pointer hover:underline">
                            Open in Chat →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 4-Pillar Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Cpu,
                  title: "Hybrid Neural Search",
                  desc: "Combines dense vector embeddings with BM25 keyword precision for 100% relevant recall.",
                  badge: "120ms Query Speed",
                  accent: "primary-container",
                },
                {
                  icon: ShieldCheck,
                  title: "Strict Citation Grounding",
                  desc: "Every AI response cites exact paragraphs, line numbers, and timestamps with zero fabrication.",
                  badge: "99.4% Accuracy",
                  accent: "secondary",
                },
                {
                  icon: Network,
                  title: "Dynamic Knowledge Graph",
                  desc: "Discovers hidden relationships between disparate PDFs, videos, and notes automatically.",
                  badge: "Auto Clustering",
                  accent: "tertiary",
                },
                {
                  icon: Layers,
                  title: "Multi-Source Workspace",
                  desc: "Synthesize answers from a single paper or query your entire 10,000+ item library simultaneously.",
                  badge: "Infinite Scale",
                  accent: "primary-container",
                },
              ].map((card, i) => {
                const CardIcon = card.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-2xl bg-surface-container border border-outline-variant/15 hover:border-primary-container/40 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container group-hover:scale-110 transition-transform">
                          <CardIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono text-on-surface/40 bg-surface-container-high px-2 py-0.5 rounded">
                          {card.badge}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-on-surface mb-2 font-headline">
                        {card.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-primary font-medium group-hover:underline flex items-center gap-1">
                        Learn details <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 2: WORKFLOW & VALUE PROPOSITIONS
        ───────────────────────────────────────────────────────────── */}
        <section id="workflow" className="py-20 md:py-32 px-6 md:px-16 bg-background relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-xs font-headline font-bold tracking-[0.2em] uppercase text-primary-container mb-3">
                Effortless Workflow
              </p>
              <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-on-surface mb-4">
                From Scattered Information to Pure Insight
              </h2>
              <p className="text-sm text-on-surface-variant max-w-xl mx-auto leading-relaxed">
                Spend less time organizing and more time creating. Here is how Brainly transforms your daily information diet into an unfair advantage.
              </p>
            </div>

            {/* 3-Step Linear Workflow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Capture Without Friction",
                  desc: "Paste YouTube links, drop dense PDFs, clip web pages, or write markdown notes. Brainly ingests and indexes in the background.",
                  highlight: "Zero formatting required",
                  icon: Plus,
                },
                {
                  step: "02",
                  title: "Neural Indexing & Graphing",
                  desc: "Our embedding pipeline structures your content, links overlapping concepts across sources, and prepares instant vector indices.",
                  highlight: "Continuous auto-organization",
                  icon: Network,
                },
                {
                  step: "03",
                  title: "Synthesize & Query",
                  desc: "Ask complex multi-document questions. Get comprehensive syntheses with verifiable, click-to-view source evidence in 120ms.",
                  highlight: "Always factually grounded",
                  icon: MessageSquare,
                },
              ].map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 * idx }}
                    className="relative bg-surface-container-low border border-outline-variant/15 rounded-3xl p-8 flex flex-col justify-between hover:border-primary-container/40 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-3xl font-black font-headline text-primary-container/80 tracking-tighter">
                          {step.step}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                          <StepIcon className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold font-headline text-on-surface mb-3">
                        {step.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                        {step.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span className="text-[11px] font-medium text-on-surface/60">
                        {step.highlight}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Performance Metric Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 bg-surface-container border border-outline-variant/15 rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
            >
              {[
                { value: "120ms", label: "Average Search Latency" },
                { value: "99.4%", label: "Citation Precision" },
                { value: "10+", label: "Supported Ingest Formats" },
                { value: "100%", label: "Private & Sovereign Data" },
              ].map((metric, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-2xl md:text-3xl font-black font-headline text-primary-container">
                    {metric.value}
                  </p>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                    {metric.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 3: TESTIMONIALS & SOCIAL PROOF
        ───────────────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28 px-6 md:px-16 bg-surface-container-low/30 border-y border-outline-variant/10">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs font-headline font-bold tracking-[0.2em] uppercase text-primary-container mb-3">
                Proven Impact
              </p>
              <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-on-surface mb-3">
                Loved by Serious Intellects
              </h2>
              <p className="text-sm text-on-surface-variant">
                Researchers, engineers, and creators use Brainly every day to master their knowledge.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * idx }}
                  className="p-7 rounded-2xl bg-surface-container border border-outline-variant/15 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex gap-1 text-tertiary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-on-surface/80 leading-relaxed italic">
                      "{t.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-9 h-9 rounded-full bg-primary-container/20 border border-primary-container/30 text-primary text-xs font-bold flex items-center justify-center">
                      {t.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{t.name}</h4>
                      <p className="text-[10px] text-on-surface-variant">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 4: FAQ ACCORDION
        ───────────────────────────────────────────────────────────── */}
        <section id="faq" className="py-20 md:py-28 px-6 md:px-16 bg-background">
          <div className="max-w-[900px] mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-headline font-bold tracking-[0.2em] uppercase text-primary-container mb-3">
                Common Questions
              </p>
              <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight text-on-surface mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-on-surface-variant max-w-lg mx-auto">
                Everything you need to know about Brainly AI, data privacy, and architecture.
              </p>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="border border-outline-variant/15 rounded-2xl bg-surface-container overflow-hidden transition-colors hover:border-primary-container/30"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                    >
                      <span className="text-sm font-bold text-on-surface font-headline pr-4">
                        {faq.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-primary-container" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="px-5 pb-5 text-xs text-on-surface-variant leading-relaxed border-t border-white/5 pt-3"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 5: PRICING (Exact implementation from /pricing)
        ───────────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 md:py-32 px-6 md:px-16 bg-surface-container-low/40 border-t border-outline-variant/10">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="max-w-3xl mx-auto text-center mb-16">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl font-black tracking-tighter mb-4 bg-gradient-to-b from-on-surface to-on-surface/50 bg-clip-text text-transparent font-headline"
              >
                Simple, Transparent Pricing
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-on-surface/60 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed"
              >
                Choose the plan that powers your second brain. No hidden fees, just your knowledge — organized and ready.
              </motion.p>

              {/* Billing toggle */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-3"
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    !yearly ? "text-on-surface" : "text-on-surface/40"
                  }`}
                >
                  Monthly
                </span>
                <button
                  onClick={() => setYearly(!yearly)}
                  className="w-12 h-6 bg-surface-container-high rounded-full p-1 flex items-center relative transition-colors hover:bg-surface-container-highest cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 bg-primary-container rounded-full shadow-lg transition-transform duration-300 ${
                      yearly ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium transition-colors ${
                      yearly ? "text-on-surface" : "text-on-surface/40"
                    }`}
                  >
                    Yearly
                  </span>
                  <span className="bg-secondary-container text-secondary text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                    20% Off
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Pricing cards */}
            <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start px-4">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                  className={`relative flex flex-col rounded-2xl p-7 border transition-all duration-300 ${
                    plan.popular
                      ? "bg-surface-container-low border-primary-container/40 shadow-[0_0_40px_-10px_rgba(51,102,255,0.3)] md:-translate-y-4"
                      : "bg-[rgba(28,27,27,0.4)] backdrop-blur-xl border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary-container text-on-primary-container text-[9px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl tracking-widest uppercase">
                      Popular
                    </div>
                  )}

                  {/* Plan name & price */}
                  <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-2">
                      {plan.name}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-on-surface">
                        {yearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      {plan.period && (
                        <span className="text-on-surface/40 text-xs">{plan.period}</span>
                      )}
                    </div>
                    {plan.popular && yearly && (
                      <p className="text-[10px] text-on-surface/40 mt-1">Billed annually</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((f, j) => (
                      <li
                        key={j}
                        className={`flex items-center gap-2.5 ${
                          !f.included ? "opacity-30" : ""
                        }`}
                      >
                        {f.included ? (
                          <CheckCircle2
                            className="w-4 h-4 text-primary shrink-0"
                            fill="currentColor"
                            fillOpacity={0.2}
                          />
                        ) : (
                          <XCircle className="w-4 h-4 text-on-surface-variant shrink-0" />
                        )}
                        <span className="text-xs text-on-surface/80">{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {plan.ctaStyle === "filled" ? (
                    <button
                      onClick={handleGetStarted}
                      className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {plan.cta}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleGetStarted}
                      className="w-full py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      {plan.cta}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-20 max-w-[1000px] mx-auto border-t border-white/5 pt-12 text-center px-4"
            >
              <p className="text-[10px] text-on-surface/40 uppercase tracking-[0.2em] mb-8">
                Trusted by modern intellects
              </p>
              <div className="flex flex-wrap justify-center items-center gap-10 opacity-30 grayscale">
                {[32, 24, 40, 28].map((w, i) => (
                  <div key={i} className={`h-6 w-${w} bg-on-surface/20 rounded`} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 6: FINAL CONVERSION CTA BANNER
        ───────────────────────────────────────────────────────────── */}
        <section className="py-20 px-6 md:px-16 bg-background relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto">
            <motion.div
              whileHover={{ scale: 1.005 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-primary-container via-secondary-container to-surface-container-low p-10 md:p-16 text-center border border-white/15 shadow-2xl"
            >
              {/* Subtle background mesh */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
              <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  Instant Activation
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight font-headline">
                  Ready to Supercharge Your Second Brain?
                </h2>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  Join thousands of researchers, creators, and engineers scaling their cognitive bandwidth. Start free today in under 30 seconds.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
                  <button
                    onClick={handleGetStarted}
                    className="w-full sm:w-auto bg-white text-primary-container px-8 py-4 rounded-xl font-bold text-sm hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Start Free Trial Today
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push("/about")}
                    className="w-full sm:w-auto border border-white/30 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    Explore About Page
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="w-full border-t border-outline-variant/10 bg-background">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 py-10 max-w-[1200px] mx-auto w-full gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary-container" />
              <span className="text-base font-bold text-on-surface">Brainly AI</span>
            </div>
            <p className="text-[10px] font-headline tracking-widest uppercase text-on-surface/40 text-center md:text-left">
              © {new Date().getFullYear()} Brainly AI. Atmospheric Precision in Learning.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-headline tracking-widest uppercase">
            <a href="#features" className="text-on-surface/40 hover:text-secondary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-on-surface/40 hover:text-secondary transition-colors">
              Pricing
            </a>
            <button
              onClick={() => router.push("/about")}
              className="text-on-surface/40 hover:text-secondary transition-colors cursor-pointer"
            >
              About
            </button>
            <a href="#" className="text-on-surface/40 hover:text-secondary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-on-surface/40 hover:text-secondary transition-colors">
              Terms of Service
            </a>
          </div>

          <div className="flex gap-3">
            {[Globe, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-8 h-8 rounded-full border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:border-primary-container transition-all"
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}