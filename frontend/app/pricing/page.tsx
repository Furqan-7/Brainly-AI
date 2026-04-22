"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Brain, CheckCircle2, XCircle, Bell, Settings, ArrowRight, Globe, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function PricingPage() {
    const [yearly, setYearly] = useState(true);
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background text-on-surface font-body flex flex-col">

            {/* Nav */}
            <header className="fixed top-0 w-full z-50 bg-[#131313]/60 backdrop-blur-xl border-b border-outline-variant/10">
                <nav className="flex justify-between items-center px-10 md:px-20 py-3 max-w-[1200px] mx-auto">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-primary-container" />
                            <span className="text-lg font-black tracking-tighter text-[#E5E2E1]">Brainly AI</span>
                        </div>
                        <div className="hidden md:flex items-center gap-6 text-xs font-medium">
                            {["Home", "Features"].map((l) => (
                                <a key={l} onClick={() => {
                                    router.push("/");
                                }} className="text-[#E5E2E1]/60 hover:text-[#E5E2E1] transition-colors cursor-pointer">{l}</a>
                            ))}
                            <a href="#" className=" cursor-pointer text-primary-container border-b-2 border-primary-container pb-0.5 font-bold">Pricing</a>
                            <a onClick={() => {
                                router.push("/about");
                            }} className="text-[#E5E2E1]/60 hover:text-[#E5E2E1] transition-colors cursor-pointer">About</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1">
                            <button className="text-[#E5E2E1]/60 hover:bg-white/5 p-2 rounded-full transition-all">
                                <Bell className="w-4 h-4" />
                            </button>
                            <button className="text-[#E5E2E1]/60 hover:bg-white/5 p-2 rounded-full transition-all">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                        <button onClick={() => {
                            router.push("/auth/signup");
                        }} className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-xs font-medium hover:brightness-110 transition-all cursor-pointer">
                            Get Started
                        </button>
                    </div>
                </nav>
            </header>

            <main className="flex-grow pt-28 pb-20 px-6">

                {/* Hero */}
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-black tracking-tighter mb-4 bg-gradient-to-b from-on-surface to-on-surface/50 bg-clip-text text-transparent"
                    >
                        Simple, Transparent Pricing
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-on-surface/60 text-sm md:text-base max-w-xl mx-auto mb-10 leading-relaxed"
                    >
                        Choose the plan that powers your second brain. No hidden fees, just your knowledge — organized and ready.
                    </motion.p>

                    {/* Billing toggle */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center justify-center gap-3"
                    >
                        <span className={`text-sm font-medium transition-colors ${!yearly ? "text-on-surface" : "text-on-surface/40"}`}>Monthly</span>
                        <button
                            onClick={() => setYearly(!yearly)}
                            className="w-12 h-6 bg-surface-container-high rounded-full p-1 flex items-center relative transition-colors hover:bg-surface-container-highest cursor-pointer"
                        >
                            <div className={`w-4 h-4 bg-primary-container rounded-full shadow-lg transition-transform duration-300 ${yearly ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium transition-colors ${yearly ? "text-on-surface" : "text-on-surface/40"}`}>Yearly</span>
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
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                            className={`relative flex flex-col rounded-2xl p-7 border transition-all duration-300
                ${plan.popular
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
                                <p className="text-[10px] font-bold tracking-widest uppercase text-primary mb-2">{plan.name}</p>
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
                                    <li key={j} className={`flex items-center gap-2.5 ${!f.included ? "opacity-30" : ""}`}>
                                        {f.included
                                            ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" fill="currentColor" fillOpacity={0.2} />
                                            : <XCircle className="w-4 h-4 text-on-surface-variant shrink-0" />
                                        }
                                        <span className="text-xs text-on-surface/80">{f.text}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            {plan.ctaStyle === "filled" ? (
                                <button className="w-full py-2.5 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary-container/20 flex items-center justify-center gap-2 cursor-pointer">
                                    {plan.cta}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <button className="w-full py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer">
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
                    className="mt-24 max-w-[1000px] mx-auto border-t border-white/5 pt-12 text-center px-4"
                >
                    <p className="text-[10px] text-on-surface/40 uppercase tracking-[0.2em] mb-8">Trusted by modern intellects</p>
                    <div className="flex flex-wrap justify-center items-center gap-10 opacity-30 grayscale">
                        {[32, 24, 40, 28].map((w, i) => (
                            <div key={i} className={`h-6 w-${w} bg-on-surface/20 rounded`} />
                        ))}
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-white/5 bg-background">
                <div className="flex flex-col md:flex-row justify-between items-center px-10 md:px-20 py-8 max-w-[1200px] mx-auto w-full gap-6">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-on-surface/40" />
                            <span className="text-sm font-bold text-on-surface/50">Brainly AI</span>
                        </div>
                        <p className="text-[9px] font-headline tracking-widest uppercase text-on-surface/40">
                            © 2024 Brainly AI. Atmospheric Precision in Learning.
                        </p>
                    </div>
                    <div className="flex gap-6 text-[9px] font-headline tracking-widest uppercase">
                        {["Privacy Policy", "Terms of Service", "Security", "Status"].map((l) => (
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