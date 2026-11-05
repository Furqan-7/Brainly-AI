"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LogOut, Puzzle, Smartphone } from "lucide-react";
import { getExtensionToken, logout } from "@/app/services/api";
import { PageHeader, useShell } from "../AppShell";

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
    return (
        <section className="grid gap-5 border-t border-outline-variant py-8 md:grid-cols-[220px_1fr] md:gap-10">
            <div className="grid content-start gap-1.5">
                <h2 className="font-headline text-xl font-normal">{title}</h2>
                {aside && <p className="text-[13.5px] leading-[1.55] text-on-surface-variant">{aside}</p>}
            </div>
            <div className="min-w-0">{children}</div>
        </section>
    );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
    const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
    return (
        <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-4">
                <span className="text-[15px]">{label}</span>
                <span className="text-sm tabular-nums text-on-surface-variant">{used.toLocaleString()} of {limit.toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden bg-on-surface/10">
                <div className={`h-full transition-[width] duration-700 ${pct > 90 ? "bg-error" : pct > 75 ? "bg-amber-500" : "bg-on-surface"}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { me } = useShell();
    const router = useRouter();
    const [token, setToken] = useState<"idle" | "copied" | "error">("idle");

    if (!me) return null;
    const pro = me.plan.name === "premium";

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(await getExtensionToken());
            setToken("copied");
        } catch {
            setToken("error");
        }
        setTimeout(() => setToken("idle"), 3000);
    };

    const signOut = async () => {
        await logout().catch(() => undefined);
        router.push("/");
    };

    return (
        <>
            <PageHeader eyebrow="Settings" title="Your account." />

            <Section title="Profile">
                <dl className="grid gap-4 sm:grid-cols-2">
                    {[
                        ["Name", me.user.username],
                        ["Email", me.user.email],
                        ["Member since", new Date(me.user.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })],
                        ["Plan", pro ? "Pro" : "Free"],
                    ].map(([k, v]) => (
                        <div key={k} className="grid gap-1">
                            <dt className="text-xs tracking-[0.05em] text-on-surface-variant uppercase">{k}</dt>
                            <dd className="m-0 truncate text-[15px]">{v}</dd>
                        </div>
                    ))}
                </dl>
            </Section>

            <Section title="Plan and usage" aside={pro ? "You're on Pro." : "Free plan. Upgrade when your brain fills up."}>
                <div className="grid gap-5">
                    <Meter label="Saved memories" used={me.usage.memoryCount} limit={me.plan.maxMemories} />
                    <Meter label="AI answers today" used={me.usage.chatsToday} limit={me.plan.chatsPerDay} />
                    <p className="text-[13.5px] text-on-surface-variant">
                        Files can be up to {me.plan.maxUploadMb} MB. AI answers reset every day; plain searches are unlimited.
                    </p>
                </div>
            </Section>

            <Section title="Browser extension" aside="Save the page you're on in one click, or right-click a link or selected text.">
                <div className="grid gap-4">
                    <ol className="m-0 grid list-decimal gap-1.5 pl-5 text-[14.5px] text-on-surface-variant">
                        <li>Install the Brainly extension in Chrome or Edge.</li>
                        <li>Copy your extension token below.</li>
                        <li>Open the extension&apos;s settings and paste it in.</li>
                    </ol>
                    <button
                        type="button"
                        onClick={copyToken}
                        className="flex w-fit items-center gap-2 border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm transition-colors hover:border-on-surface"
                    >
                        {token === "copied" ? <Check className="size-4 text-emerald-600" /> : token === "error" ? <Copy className="size-4 text-error" /> : <Puzzle className="size-4" />}
                        {token === "copied" ? "Token copied" : token === "error" ? "Couldn't copy, try again" : "Copy extension token"}
                    </button>
                    <p className="text-xs text-on-surface-variant">The token signs the extension in for 90 days. Treat it like a password.</p>
                </div>
            </Section>

            <Section title="On your phone" aside="Send reels and links to Brainly from any app.">
                <p className="flex items-start gap-3 text-[14.5px] text-on-surface-variant">
                    <Smartphone className="mt-0.5 size-4 flex-none text-on-surface" />
                    Open Brainly in Chrome on Android and choose “Install app”. Brainly then appears in the Share menu, so sharing a reel opens Add memory with the link filled in.
                </p>
            </Section>

            <Section title="Session">
                <button
                    type="button"
                    onClick={signOut}
                    className="flex w-fit items-center gap-2 px-4 py-2.5 text-sm text-error shadow-[inset_0_0_0_1px_var(--color-error)] transition-colors hover:bg-error hover:text-white"
                >
                    <LogOut className="size-4" /> Sign out
                </button>
            </Section>
        </>
    );
}
