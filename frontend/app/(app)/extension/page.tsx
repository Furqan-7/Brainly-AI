"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Copy, Loader2, Puzzle } from "lucide-react";
import { getExtensionToken } from "@/app/services/api";

type Step = "looking" | "connecting" | "connected" | "missing" | "error";

/**
 * Connects the Brainly browser extension to this account. The extension's content script on
 * this page says hello; the page answers with a sign-in token, which only the extension (on
 * this exact site) receives. No token to copy and paste.
 */
export default function ConnectExtensionPage() {
    const [step, setStep] = useState<Step>("looking");
    const [copied, setCopied] = useState(false);
    const sent = useRef(false);

    useEffect(() => {
        const onMessage = async (e: MessageEvent) => {
            if (e.source !== window || e.origin !== window.location.origin) return;
            const data = e.data as { source?: string; type?: string } | null;
            if (data?.source !== "brainly-extension") return;
            if (data.type === "ready" && !sent.current) {
                sent.current = true;
                setStep("connecting");
                try {
                    const token = await getExtensionToken();
                    window.postMessage({ source: "brainly-web", type: "connect", token }, window.location.origin);
                } catch {
                    setStep("error");
                }
            }
            if (data.type === "connected") setStep("connected");
        };
        window.addEventListener("message", onMessage);
        // Ask in case the extension's script loaded before this listener
        window.postMessage({ source: "brainly-web", type: "hello" }, window.location.origin);
        const timer = setTimeout(() => setStep((s) => (s === "looking" ? "missing" : s)), 2500);
        return () => {
            window.removeEventListener("message", onMessage);
            clearTimeout(timer);
        };
    }, []);

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(await getExtensionToken("copy"));
            setCopied(true);
        } catch {
            setStep("error");
        }
    };

    return (
        <div className="mx-auto grid min-h-[calc(100svh/var(--ui-zoom,1)-12rem)] w-full max-w-[520px] place-items-center">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid w-full gap-5 rounded-[22px] border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-[0_30px_60px_-40px_rgba(60,35,20,0.6)]"
            >
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-tertiary-container text-primary">
                    {step === "connected" ? <Check className="size-6" /> : step === "looking" || step === "connecting" ? <Loader2 className="size-6 animate-spin" /> : <Puzzle className="size-6" />}
                </span>

                {(step === "looking" || step === "connecting") && (
                    <p className="font-headline text-2xl">{step === "looking" ? "Looking for the extension…" : "Connecting…"}</p>
                )}

                {step === "connected" && (
                    <>
                        <p className="font-headline text-2xl">Extension connected</p>
                        <p className="text-[14.5px] leading-[1.6] text-on-surface-variant">
                            Click the Brainly icon on any page to save it, or right-click a link or selected text. Brainly adds the title, summary and tags for you. You can close this tab.
                        </p>
                    </>
                )}

                {step === "missing" && (
                    <>
                        <p className="font-headline text-2xl">Extension not found</p>
                        <p className="text-[14.5px] leading-[1.6] text-on-surface-variant">
                            Install the Brainly extension in your browser (Chrome, Edge, Brave, Opera, Firefox or Safari), then click <b>Connect</b> in it (or reload this page). Just updated it? Reload it on your browser&apos;s extensions page first. Using a custom setup? Copy a token and paste it in the extension&apos;s settings.
                        </p>
                        <button type="button" onClick={copyToken} className="mx-auto flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-2.5 text-[14px] hover:border-on-surface">
                            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                            {copied ? "Token copied" : "Copy token instead"}
                        </button>
                    </>
                )}

                {step === "error" && (
                    <>
                        <p className="font-headline text-2xl">Couldn&apos;t connect</p>
                        <p className="text-[14.5px] text-on-surface-variant">Reload this page to try again.</p>
                    </>
                )}

                <Link href="/chat" className="text-sm text-on-surface-variant underline underline-offset-4 hover:text-on-surface">Back to Brainly</Link>
            </motion.div>
        </div>
    );
}
