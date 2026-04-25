/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import { motion } from "motion/react";
import {
  Brain,
  CheckCircle2,
  Link2,
  MessageSquare,
  Sparkles,
  Zap,
  FileText,
  Video,
  Database,
  BrainCircuit,
  RefreshCw,
  Globe,
  Mail,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    router.push("/chat");

  }, []);

  const handleGetStarted = () => {
    router.push("/auth/signup");
  }

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl border-b border-outline-variant/10">
        <nav className="flex justify-between items-center px-10 md:px-20 py-3 max-w-[1200px] mx-auto">
          <div className="text-lg font-black tracking-tighter text-[#E5E2E1] flex items-center gap-2">
            <Brain className="text-primary-container w-6 h-6" />
            Brainly AI
          </div>
          <div className="hidden md:flex items-center gap-6 font-headline font-medium tracking-tight text-xs">
            <a className="text-primary-container font-bold border-b-2 border-primary-container pb-0.5 transition-all duration-300" href="#">HOME</a>
            <a className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all duration-300" href="#features">FEATURES</a>
            <a onClick={() => {
              router.push("/pricing");
            }} className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all duration-300" >PRICING</a>
            <a onClick={() => {
              router.push("/about");
            }} className="text-[#E5E2E1] opacity-70 hover:opacity-100 hover:text-primary-container transition-all duration-300">ABOUT</a>
          </div>
          <div>
            <button onClick={handleGetStarted} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg font-headline font-medium tracking-tight text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer">
              Get Started
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
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
                <button className="w-full sm:w-auto bg-primary-container text-on-primary-container px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  Try for Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="w-full sm:w-auto border border-outline-variant/30 text-on-surface px-6 py-3 rounded-xl font-bold text-sm hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer">
                  See How it Works
                </button>
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

        {/* Features Section */}
        <section className="py-16 md:py-28 px-10 md:px-20 bg-surface-container-low" id="features">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-14 text-center md:text-left">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-headline font-black tracking-tight text-on-surface mb-4"
              >
                Powerful Features for Your <br className="hidden md:block" />Knowledge Base
              </motion.h2>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
                Transform how you store, retrieve, and interact with information using our suite of advanced cognitive tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: FileText, title: "AI Smart Summaries", desc: "Condense long articles and papers into concise, actionable summaries without losing critical context.", border: "primary-container" },
                { icon: Video, title: "Interactive Video Indexing", desc: "Navigate YouTube lectures via AI-generated timestamps and searchable transcripts automatically synced.", border: "secondary" },
                { icon: Database, title: "Document Insights Engine", desc: "Upload complex technical documents and let Brainly extract schemas, entities, and logical connections.", border: "primary-container" },
                { icon: BrainCircuit, title: "Personalized Chat Assistant", desc: "A dedicated AI that remembers your past queries and personal knowledge preferences for tailored assistance.", border: "secondary", wide: true },
                { icon: RefreshCw, title: "Cross-Platform Sync", desc: "Access your knowledge base on mobile, desktop, and web with real-time cloud synchronization.", border: "primary-container" }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`group p-6 bg-surface-container rounded-2xl border border-outline-variant/10 hover:border-${feature.border}/30 transition-all duration-300 ${feature.wide ? "md:col-span-2" : ""}`}
                >
                  <div className={`flex ${feature.wide ? "flex-col md:flex-row gap-6 items-center" : "flex-col"}`}>
                    <div className="flex-1">
                      <div className={`w-11 h-11 bg-${feature.border}/10 rounded-xl flex items-center justify-center text-${feature.border} mb-5 group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold mb-2.5">{feature.title}</h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                        {feature.desc}
                      </p>
                    </div>
                    {feature.wide && (
                      <div className="flex-1 w-full h-32 bg-surface-container-high rounded-xl overflow-hidden relative border border-outline-variant/5">
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
                        <div className="p-5 space-y-2.5">
                          <motion.div
                            animate={{ width: ["75%", "80%", "75%"] }}
                            transition={{ duration: 4, repeat: Infinity }}
                            className="h-1.5 bg-on-surface-variant/20 rounded-full"
                          ></motion.div>
                          <motion.div
                            animate={{ width: ["50%", "55%", "50%"] }}
                            transition={{ duration: 3.5, repeat: Infinity }}
                            className="h-1.5 bg-on-surface-variant/20 rounded-full"
                          ></motion.div>
                          <motion.div
                            animate={{ width: ["66%", "70%", "66%"] }}
                            transition={{ duration: 4.5, repeat: Infinity }}
                            className="h-1.5 bg-on-surface-variant/20 rounded-full"
                          ></motion.div>
                        </div>
                      </div>
                    )}
                  </div>
                  {!feature.wide && <div className={`h-0.5 w-10 bg-${feature.border}/30 group-hover:w-full transition-all duration-500`}></div>}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Separation Callout */}
        <section className="py-14 px-10 md:px-20">
          <div className="max-w-[1200px] mx-auto">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-container to-secondary-container p-10 md:p-16 text-center"
            >
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <div className="relative z-10 space-y-5">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Ready to master your knowledge?</h2>
                <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto">
                  Join over 50,000+ creators and researchers who are scaling their intelligence with Brainly AI.
                </p>
                <div className="flex justify-center pt-2">
                  <button className="bg-white text-primary-container px-8 py-4 rounded-xl font-bold text-sm hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                    Start Free Trial Today
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-on-surface/15 bg-background">
        <div className="flex flex-col md:flex-row justify-between items-center px-10 md:px-20 py-8 max-w-[1200px] mx-auto w-full gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="text-sm font-bold text-on-surface/50 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              Brainly AI
            </div>
            <p className="font-headline text-[9px] tracking-widest uppercase text-on-surface/40 text-center md:text-left">
              © 2024 Brainly AI. Atmospheric Precision Design.
            </p>
          </div>

          <div className="flex gap-6 font-headline text-[9px] tracking-widest uppercase">
            <a className="text-on-surface/40 hover:text-secondary transition-colors" href="#">Privacy Policy</a>
            <a className="text-on-surface/40 hover:text-secondary transition-colors" href="#">Terms of Service</a>
            <a className="text-on-surface/40 hover:text-secondary transition-colors" href="#">Contact</a>
          </div>

          <div className="flex gap-3">
            {[Globe, Mail].map((Icon, i) => (
              <a key={i} className="w-7 h-7 rounded-full border border-outline-variant/20 flex items-center justify-center text-on-surface-variant hover:text-primary-container hover:border-primary-container transition-all" href="#">
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}