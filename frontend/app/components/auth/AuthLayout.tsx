"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import GoogleLogoAnimation from "@/app/components/GoogleLogoAnimation";
import { Logo } from "@/app/components/landing/ui";
import { ArrowChip, shine } from "@/app/components/landing/motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Two-column auth screen: the form on dotted paper, and a framed collage on the other side
 * with a few hand-placed shapes (coral sun, mustard dot, construction lines) like the artwork.
 */
export function AuthLayout({
    art,
    artAlt,
    artSide = "right",
    quote,
    children,
}: {
    art: string;
    artAlt: string;
    artSide?: "left" | "right";
    quote: { title: string; text: string };
    children: React.ReactNode;
}) {
    const artPanel = (
        <motion.div
            initial={{ opacity: 0, x: artSide === "right" ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: EASE }}
            className="relative hidden min-h-svh items-center justify-center overflow-hidden p-10 lg:flex"
        >
            {/* geometry behind the art */}
            <svg aria-hidden="true" className="absolute inset-0 size-full text-on-surface/15" preserveAspectRatio="none">
                <line x1="12%" y1="0" x2="12%" y2="100%" stroke="currentColor" strokeDasharray="2 6" />
                <line x1="0" y1="96%" x2="100%" y2="96%" stroke="currentColor" />
                <circle cx="82%" cy="18%" r="120" fill="none" stroke="currentColor" />
            </svg>
            <motion.span
                aria-hidden="true"
                className="absolute top-[9%] right-[10%] size-40 rounded-full bg-[#e2694d]/85"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
            />
            <motion.span
                aria-hidden="true"
                className="absolute right-[14%] bottom-[7%] size-14 rounded-full bg-[#d49b2a]"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <figure className="relative z-10 m-0 grid w-full max-w-[560px] gap-6">
                <div className="overflow-hidden rounded-[26px] border border-outline-variant bg-surface-container-lowest p-2 shadow-[0_40px_80px_-50px_rgba(60,35,20,0.6)]">
                    <Image src={art} alt={artAlt} width={1100} height={1024} priority className="h-auto max-h-[62vh] w-full rounded-[20px] object-cover" />
                </div>
                <figcaption className="grid gap-2 px-2">
                    <span className="font-headline text-[1.7rem] leading-tight tracking-[-0.02em]">{quote.title}</span>
                    <span className="max-w-[46ch] text-[15px] leading-[1.6] text-on-surface-variant">{quote.text}</span>
                </figcaption>
            </figure>
        </motion.div>
    );

    return (
        <div className={`grid min-h-svh w-full flex-1 bg-lp-dots text-on-surface lg:grid-cols-2`}>
            {artSide === "left" && artPanel}
            <div className="flex min-h-svh flex-col px-6 py-8 sm:px-10">
                <Logo />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                    className="mx-auto my-auto grid w-full max-w-[400px] gap-7 py-10"
                >
                    {children}
                </motion.div>
                <p className="text-center text-xs text-on-surface-variant">
                    <Link href="/" className="hover:text-on-surface">← Back to Brainly</Link>
                </p>
            </div>
            {artSide === "right" && artPanel}
        </div>
    );
}

export function AuthHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-3">
            <span className="w-fit bg-surface-container-high px-2.5 py-1.5 text-[12px] leading-none tracking-[0.05em] uppercase">{eyebrow}</span>
            <h1 className="font-headline text-[2.6rem] leading-[1.02] font-normal tracking-[-0.03em] text-balance">{title}</h1>
            <p className="text-[15px] leading-[1.6] text-on-surface-variant">{children}</p>
        </div>
    );
}

export function Field({
    id,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    autoComplete,
    hint,
}: {
    id: string;
    label: string;
    type?: "text" | "email" | "password";
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    autoComplete?: string;
    hint?: string;
}) {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    return (
        <div className="grid gap-1.5">
            <label htmlFor={id} className="text-[13px] font-medium">{label}</label>
            <div className="group relative">
                <input
                    id={id}
                    type={isPassword && show ? "text" : type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required
                    className="w-full border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-on-surface-variant/60 focus:border-on-surface focus:shadow-[0_0_0_3px_rgba(20,20,20,0.06)]"
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center text-on-surface-variant hover:text-on-surface"
                        aria-label={show ? "Hide password" : "Show password"}
                    >
                        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                )}
            </div>
            {hint && <span className="text-xs text-on-surface-variant">{hint}</span>}
        </div>
    );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: React.ReactNode }) {
    return (
        <button
            type="submit"
            disabled={loading}
            className={`group/btn ${shine} flex h-[52px] w-full items-center justify-center gap-2.5 bg-primary-container text-[15.5px] font-medium text-white transition-[background-color,transform] hover:bg-black active:scale-[0.99] disabled:opacity-70`}
        >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <>{children}<ArrowChip /></>}
        </button>
    );
}

export function GoogleButton({ label }: { label: string }) {
    return (
        <button
            type="button"
            onClick={() => window.location.assign("/backend/auth/google")}
            className="group relative isolate flex h-[52px] w-full items-center justify-center gap-3 overflow-hidden border border-outline-variant bg-surface-container-lowest text-[15px] font-medium transition-colors before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-surface-container-high before:transition-transform before:duration-500 hover:border-on-surface hover:before:scale-x-100"
        >
            <GoogleLogoAnimation className="size-6" scale={1.8} />
            {label}
        </button>
    );
}

export function OrDivider() {
    return (
        <div className="flex items-center gap-3 text-xs tracking-[0.05em] text-on-surface-variant uppercase">
            <span className="h-px flex-1 bg-outline-variant" />
            or
            <span className="h-px flex-1 bg-outline-variant" />
        </div>
    );
}

export function FormError({ message }: { message: string }) {
    if (!message) return null;
    return (
        <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 border border-error/30 bg-error/5 px-3 py-2.5 text-[13.5px] text-error"
        >
            <AlertCircle className="mt-0.5 size-4 flex-none" />
            {message}
        </motion.p>
    );
}
