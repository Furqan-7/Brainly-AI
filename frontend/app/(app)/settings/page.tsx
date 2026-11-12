"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Laptop, Loader2, LogOut, Puzzle, Smartphone, Trash2 } from "lucide-react";
import {
    deleteAccount, errorMessage, EXPORT_URL, getDevices, getExtensionToken, logout, signOutDevice, signOutEverywhere,
} from "@/app/services/api";
import type { Device, Me } from "@/app/types/memory";
import { useInstall } from "@/app/components/pwa";
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
            <div className="rounded-full h-2 overflow-hidden bg-on-surface/10">
                <div className={`h-full rounded-full transition-[width] duration-700 ${pct > 90 ? "bg-error" : pct > 75 ? "bg-amber-500" : "bg-on-surface"}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/** Install button where the browser allows it, otherwise the steps for this browser. */
function InstallApp() {
    const { state, install } = useInstall();
    if (state === "installed") {
        return (
            <p className="flex items-center gap-2 text-[14.5px]">
                <Check className="size-4 text-emerald-600" /> Brainly is installed on this device. Look for it in your Share menu.
            </p>
        );
    }
    return (
        <div className="grid gap-4">
            {state === "available" && (
                <button type="button" onClick={install} className="flex w-fit items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-sm text-white transition-colors hover:bg-black">
                    <Download className="size-4" /> Install Brainly app
                </button>
            )}
            {state === "ios" ? (
                <p className="flex items-start gap-3 text-[14.5px] text-on-surface-variant">
                    <Smartphone className="mt-0.5 size-4 flex-none text-on-surface" />
                    In Safari, tap the Share button, then “Add to Home Screen”. (iPhones don&apos;t let web apps appear in the Share menu, so save from Brainly&apos;s Add memory.)
                </p>
            ) : (
                <div className="flex items-start gap-3 text-[14.5px] text-on-surface-variant">
                    <Smartphone className="mt-0.5 size-4 flex-none text-on-surface" />
                    <div className="grid gap-1.5">
                        <span>{state === "available" ? "Or install it from Chrome's menu:" : "Open Brainly in Chrome on your Android phone, then:"}</span>
                        <ol className="m-0 grid list-decimal gap-1 pl-5">
                            <li>Tap the <b>⋮</b> menu at the top right.</li>
                            <li>Tap <b>Add to home screen</b> (or <b>Install app</b>).</li>
                            <li>Choose <b>Install</b>. Brainly now shows up when you tap Share in any app.</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}

const buttonClass = "rounded-xl flex w-fit items-center gap-2 border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm transition-colors hover:border-on-surface disabled:opacity-60";
const dangerClass = "rounded-xl flex w-fit items-center gap-2 px-4 py-2.5 text-sm text-error shadow-[inset_0_0_0_1px_var(--color-error)] transition-colors hover:bg-error hover:text-white disabled:opacity-60";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

function lastUsed(iso: string): string {
    const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
    if (hours < 1) return "used in the last hour";
    if (hours < 24) return "used today";
    const days = Math.floor(hours / 24);
    return days === 1 ? "used yesterday" : days < 30 ? `used ${days} days ago` : `last used ${formatDate(iso)}`;
}

/** Each connected extension, with its own Sign out, plus "sign out everywhere else". */
function ConnectedDevices({ reloadKey }: { reloadKey: number }) {
    const [devices, setDevices] = useState<Device[] | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [message, setMessage] = useState("");

    const load = useCallback(() => {
        getDevices().then(setDevices).catch(() => setDevices([]));
    }, []);
    useEffect(load, [load, reloadKey]);

    const signOut = async (device: Device) => {
        setBusy(device.id);
        setMessage("");
        try {
            await signOutDevice(device.id);
            setDevices((list) => list?.filter((d) => d.id !== device.id) ?? null);
            setMessage(`${device.name} is signed out. It can't save to your account any more.`);
        } catch (err) {
            setMessage(errorMessage(err));
        }
        setBusy(null);
    };

    const everywhere = async () => {
        if (!window.confirm("Sign out every other browser and every connected extension? This browser stays signed in.")) return;
        setBusy("all");
        setMessage("");
        try {
            await signOutEverywhere();
            setDevices([]);
            setMessage("Signed out everywhere else. Only this browser is still signed in.");
        } catch (err) {
            setMessage(errorMessage(err));
        }
        setBusy(null);
    };

    return (
        <div className="grid gap-4">
            {devices === null ? (
                <Loader2 className="size-4 animate-spin text-on-surface-variant" />
            ) : devices.length === 0 ? (
                <p className="text-[14.5px] text-on-surface-variant">No extensions are connected right now.</p>
            ) : (
                <ul className="m-0 grid list-none gap-2 p-0">
                    {devices.map((d) => (
                        <li key={d.id} className="rounded-xl flex flex-wrap items-center gap-3 border border-outline-variant bg-surface-container-lowest px-4 py-3">
                            <Laptop className="size-4 flex-none text-on-surface-variant" />
                            <div className="grid min-w-0 flex-1">
                                <span className="truncate text-[14.5px]">{d.name}</span>
                                <span className="text-[12.5px] text-on-surface-variant">Connected {formatDate(d.createdAt)} · {lastUsed(d.lastUsedAt)}</span>
                            </div>
                            <button type="button" onClick={() => signOut(d)} disabled={busy !== null} className="rounded-lg flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-error shadow-[inset_0_0_0_1px_var(--color-error)] hover:bg-error hover:text-white disabled:opacity-60">
                                {busy === d.id ? <Loader2 className="size-3.5 animate-spin" /> : <LogOut className="size-3.5" />} Sign out
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button type="button" onClick={everywhere} disabled={busy !== null} className={buttonClass}>
                {busy === "all" ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} Sign out everywhere else
            </button>
            {message && <p role="status" className="text-[13.5px] text-on-surface-variant">{message}</p>}
            <p className="text-xs text-on-surface-variant">
                Lost a laptop? Sign its extension out here. Extensions connected before this list existed don&apos;t appear in it; “Sign out everywhere else” signs those out too.
            </p>
        </div>
    );
}

/** Type the email (and password, if there is one) to delete the account for good. */
function DeleteAccount({ me }: { me: Me }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [confirm, setConfirm] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const matches = confirm.trim().toLowerCase() === me.user.email.toLowerCase();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!matches) return setError("Type your email exactly as shown.");
        setDeleting(true);
        setError("");
        try {
            await deleteAccount(confirm.trim(), me.user.hasPassword ? password : undefined);
            router.replace("/");
        } catch (err) {
            setError(errorMessage(err));
            setDeleting(false);
        }
    };

    if (!open) {
        return (
            <button type="button" onClick={() => setOpen(true)} className={dangerClass}>
                <Trash2 className="size-4" /> Delete my account
            </button>
        );
    }

    const inputClass = "rounded-xl w-full border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-[15px] outline-none focus:border-on-surface";
    return (
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-error/40 bg-error/5 p-5" noValidate>
            <p className="m-0 text-[14.5px] leading-[1.6]">
                This deletes <b>{me.user.email}</b>{" "}and everything in it, right now and for good: every memory and uploaded file, your collections (shared links stop working), your chats and connected extensions. It can&apos;t be undone. Want a copy? <a href={EXPORT_URL} download className="underline underline-offset-4">Download your data</a> first.
            </p>
            <label className="grid gap-1.5 text-[13px] font-medium">
                Type your email to confirm
                <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={me.user.email} autoComplete="off" className={inputClass} />
            </label>
            {me.user.hasPassword && (
                <label className="grid gap-1.5 text-[13px] font-medium">
                    Your password
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={inputClass} />
                </label>
            )}
            {error && <p role="alert" className="m-0 text-[13.5px] text-error">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={deleting || !matches || (me.user.hasPassword && !password)} className="rounded-xl flex items-center gap-2 bg-error px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50">
                    {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete forever
                </button>
                <button type="button" onClick={() => { setOpen(false); setConfirm(""); setPassword(""); setError(""); }} className={buttonClass}>
                    Cancel
                </button>
            </div>
        </form>
    );
}

export default function SettingsPage() {
    const { me } = useShell();
    const router = useRouter();
    const [token, setToken] = useState<"idle" | "copied" | "error">("idle");
    const [devicesKey, setDevicesKey] = useState(0);

    if (!me) return null;
    const pro = me.plan.name === "premium";

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(await getExtensionToken("copy"));
            setToken("copied");
            setDevicesKey((k) => k + 1);
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
                        ["Email", me.user.emailVerified ? me.user.email : `${me.user.email} (not confirmed)`],
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
                        <li>Click <b>Connect Brainly</b> (in the extension, or below). It signs in by itself.</li>
                        <li>Click the Brainly icon on any page to save it. Brainly adds the title, summary and tags.</li>
                    </ol>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/extension"
                            className="rounded-xl flex w-fit items-center gap-2 bg-primary-container px-4 py-2.5 text-sm text-white transition-colors hover:bg-black"
                        >
                            <Puzzle className="size-4" /> Connect Brainly
                        </Link>
                        <button
                            type="button"
                            onClick={copyToken}
                            className="rounded-xl flex w-fit items-center gap-2 border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm transition-colors hover:border-on-surface"
                        >
                            {token === "copied" ? <Check className="size-4 text-emerald-600" /> : <Copy className={`size-4 ${token === "error" ? "text-error" : ""}`} />}
                            {token === "copied" ? "Token copied" : token === "error" ? "Couldn't copy, try again" : "Copy token instead"}
                        </button>
                    </div>
                    <p className="text-xs text-on-surface-variant">Connecting signs the extension in for 90 days. Only use the token on your own devices.</p>
                </div>
            </Section>

            <Section title="Connected devices" aside="Every browser extension signed in to your account. Signing one out stops it saving to Brainly straight away.">
                <ConnectedDevices reloadKey={devicesKey} />
            </Section>

            <Section title="On your phone" aside="Install Brainly, then share reels, videos and links to it from any app. They're saved straight away, with the title, summary and tags added for you.">
                <InstallApp />
            </Section>

            <Section title="Your data" aside="A ZIP of everything you saved, yours to keep or take elsewhere.">
                <div className="grid gap-3">
                    <a href={EXPORT_URL} download className={buttonClass}>
                        <Download className="size-4" /> Download everything
                    </a>
                    <p className="text-[13.5px] leading-[1.55] text-on-surface-variant">
                        Includes every memory (links, notes, your context, summaries and tags) and your collections and chats as JSON, your notes as Markdown files, and the PDFs, images and audio you uploaded.
                    </p>
                </div>
            </Section>

            <Section title="Session">
                <button
                    type="button"
                    onClick={signOut}
                    className="rounded-xl flex w-fit items-center gap-2 px-4 py-2.5 text-sm text-error shadow-[inset_0_0_0_1px_var(--color-error)] transition-colors hover:bg-error hover:text-white"
                >
                    <LogOut className="size-4" /> Sign out
                </button>
            </Section>

            <Section title="Delete account" aside="Permanently removes your account and everything you saved.">
                <DeleteAccount me={me} />
            </Section>

            <p className="border-t border-outline-variant pt-6 text-[13px] text-on-surface-variant">
                <Link href="/privacy" className="underline decoration-outline-variant underline-offset-4 hover:text-on-surface">Privacy Policy</Link>
                {" · "}
                <Link href="/terms" className="underline decoration-outline-variant underline-offset-4 hover:text-on-surface">Terms of Service</Link>
            </p>
        </>
    );
}
