"use client";

/**
 * "You saved it. You just can't find it." — four hand-drawn screens of the places saves go to
 * die (an Instagram Saved grid, a browser with too many tabs, a Downloads folder and a camera
 * roll). In each one the thing you actually wanted is in there, buried; once the screen scrolls
 * into view it gets circled. Everything is drawn in HTML/CSS so it stays crisp and light.
 */

import Image from "next/image";
import { createContext, useContext, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Wrap } from "./ui";
import { Reveal } from "./motion";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── Shared pieces ───────────────────────────────────────── */

/** Whether the scene around a <Needle> has been scrolled into view. */
const SeenContext = createContext(false);

/** Wraps the buried item: a red ring and a small label draw in once the scene is seen. */
function Needle({
    children,
    label,
    className = "",
    ring = "-inset-[5px] rounded-[10px]",
    tag = "-top-[26px] left-1/2 -translate-x-1/2",
}: {
    children: React.ReactNode;
    label: string;
    className?: string;
    ring?: string;
    tag?: string;
}) {
    const seen = useContext(SeenContext);
    const reduce = useReducedMotion();
    const on = seen || !!reduce;
    return (
        <div className={`relative ${className}`}>
            {children}
            <motion.span
                className={`pointer-events-none absolute z-10 border-2 border-lp-signal ${ring}`}
                initial={false}
                animate={on ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.35 }}
                transition={{ duration: 0.55, ease: EASE, delay: reduce ? 0 : 0.9 }}
            />
            <motion.span
                className={`pointer-events-none absolute z-10 rounded-full bg-lp-signal px-2 py-[3px] text-[10.5px] leading-none font-medium whitespace-nowrap text-white shadow-[0_4px_10px_-4px_rgb(180_71_43/0.7)] ${tag}`}
                initial={false}
                animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{ duration: 0.45, ease: EASE, delay: reduce ? 0 : 1.25 }}
            >
                {label}
            </motion.span>
        </div>
    );
}

/** A phone, cropped by the bottom of its card like a photo of a hand-held screen. */
function Phone({ children }: { children: React.ReactNode }) {
    return (
        <div className="absolute top-7 left-1/2 w-[236px] -translate-x-1/2 rounded-t-[38px] bg-[#1b1a19] p-[7px] pb-0 shadow-[0_30px_60px_-30px_rgb(40_25_15/0.55)]">
            <div className="relative h-[420px] overflow-hidden rounded-t-[31px] bg-white">
                <div className="flex h-[30px] items-center justify-between px-5 pt-1 text-[10.5px] font-semibold text-[#111]">
                    <span>9:41</span>
                    <span aria-hidden="true" className="absolute top-[7px] left-1/2 h-[17px] w-[62px] -translate-x-1/2 rounded-full bg-[#1b1a19]" />
                    <span className="flex items-center gap-1">
                        <span className="flex items-end gap-px">
                            {[4, 6, 8, 10].map((h) => <i key={h} className="block w-[2.5px] rounded-[1px] bg-[#111]" style={{ height: h }} />)}
                        </span>
                        <span className="ml-0.5 h-[9px] w-[18px] rounded-[3px] border border-[#111] p-px"><i className="block h-full w-3/4 rounded-[1px] bg-[#111]" /></span>
                    </span>
                </div>
                {children}
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
            </div>
        </div>
    );
}

/** A desktop window, cropped by the bottom-right of its card. */
function Window({ children, title, className = "" }: { children: React.ReactNode; title?: string; className?: string }) {
    return (
        <div className={`absolute top-7 left-6 overflow-hidden rounded-[12px] bg-white shadow-[0_0_0_1px_rgb(20_20_20/0.08),0_30px_60px_-30px_rgb(40_25_15/0.5)] min-[560px]:left-8 ${className}`}>
            {title !== undefined && (
                <div className="relative flex h-[34px] items-center gap-[7px] border-b border-[#ececec] bg-[#f6f5f4] px-3.5">
                    <Lights />
                    <span className="absolute left-1/2 -translate-x-1/2 text-[11.5px] font-semibold text-[#4a4a4a]">{title}</span>
                </div>
            )}
            {children}
        </div>
    );
}

function Lights() {
    return (
        <>
            <i className="size-[11px] rounded-full bg-[#ff5f57]" />
            <i className="size-[11px] rounded-full bg-[#febc2e]" />
            <i className="size-[11px] rounded-full bg-[#28c840]" />
        </>
    );
}

/* ── 1. Instagram: the Saved grid ────────────────────────── */

type Reel = { text?: string; bg: string; fg?: string; views: string; art?: string; pos?: string };

const REELS: Reel[] = [
    { text: "POV: your first week as a dev", bg: "#d9c6a5", fg: "#2a2118", views: "2.1M" },
    { text: "pasta in 60 sec", bg: "#d7b98f", fg: "#2a2118", views: "880K" },
    { art: "/art/statue-eye.webp", pos: "50% 30%", bg: "#cdbfae", views: "412K" },
    { text: "the gym split that finally worked", bg: "#39443a", views: "1.4M" },
    { text: "5 projects that got me hired", bg: "#23262e", views: "96K" }, // the one
    { text: "Japan in 7 days", bg: "#7a8d9e", views: "3.3M" },
    { text: "study like this instead", bg: "#ece5d8", fg: "#2a2118", views: "640K" },
    { art: "/art/bust-tree.webp", pos: "50% 40%", bg: "#d8cfc4", views: "57K" },
    { text: "React hooks in 1 minute", bg: "#141414", views: "210K" },
    { text: "my notion setup", bg: "#efeae2", fg: "#2a2118", views: "1.1M" },
    { text: "budget like this at 22", bg: "#5a4636", views: "730K" },
    { text: "morning routine (real)", bg: "#b9a089", fg: "#2a2118", views: "2.8M" },
    { text: "don't skip this stretch", bg: "#8e9b88", views: "390K" },
    { art: "/art/arch-eye.webp", pos: "50% 50%", bg: "#ddd3c7", views: "18K" },
    { text: "cold brew at home", bg: "#3b2f29", views: "1.9M" },
];

function ReelTile({ reel }: { reel: Reel }) {
    return (
        <div className="relative aspect-[3/4] overflow-hidden" style={{ background: reel.bg, color: reel.fg ?? "#fff" }}>
            {reel.art ? (
                <Image src={reel.art} alt="" fill sizes="80px" className="object-cover" style={{ objectPosition: reel.pos }} />
            ) : (
                <span className="absolute inset-x-1.5 top-2 text-[8.5px] leading-[1.15] font-bold tracking-[-0.01em]">{reel.text}</span>
            )}
            <span className="absolute bottom-1 left-1.5 flex items-center gap-[3px] text-[7.5px] font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
                <svg viewBox="0 0 10 10" className="size-[7px] fill-current"><path d="M2 1l7 4-7 4z" /></svg>
                {reel.views}
            </span>
        </div>
    );
}

function InstagramScene() {
    return (
        <Phone>
            <div className="flex items-center justify-between px-3.5 pt-2 pb-2.5">
                <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-[#111] stroke-2"><path d="M15 5l-7 7 7 7" /></svg>
                <span className="text-[13px] font-semibold text-[#111]">All posts</span>
                <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-[#111] stroke-2"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
            </div>
            <div className="flex border-b border-[#efefef] text-center text-[9.5px] font-semibold">
                <span className="flex-1 border-b border-[#111] pb-1.5 text-[#111]">612 saved</span>
                <span className="flex-1 pb-1.5 text-[#999]">Collections</span>
            </div>
            <div className="grid grid-cols-3 gap-px bg-white">
                {REELS.map((r, i) =>
                    i === 4 ? (
                        <Needle key={i} label="there it is" ring="-inset-[3px] rounded-[4px]" tag="-top-[22px] left-1/2 -translate-x-1/2">
                            <ReelTile reel={r} />
                        </Needle>
                    ) : (
                        <ReelTile key={i} reel={r} />
                    ),
                )}
            </div>
        </Phone>
    );
}

/* ── 2. Browser: forty-three tabs ────────────────────────── */

const FAVICONS = ["#d93025", "#1a73e8", "#141414", "#ff6314", "#0f9d58", "#5b5bd6", "#e37400", "#141414", "#1a73e8", "#a142f4", "#d93025", "#0b8043", "#141414", "#ff6314", "#1a73e8", "#e37400", "#5b5bd6", "#d93025", "#0f9d58", "#141414", "#1a73e8", "#ff6314", "#a142f4", "#e37400"];
const FAV_LETTERS = "YMGRNSWXYMGMRNWSYMGXRNYW";

function Favicon({ color, letter }: { color: string; letter: string }) {
    return (
        <span className="grid size-[13px] shrink-0 place-items-center rounded-[3px] text-[8px] leading-none font-bold text-white" style={{ background: color }}>
            {letter}
        </span>
    );
}

function BrowserScene() {
    return (
        <Window className="w-[660px]">
            {/* tab strip */}
            <div className="flex h-[38px] items-end gap-[3px] bg-[#e9e6e3] pr-2 pl-3.5">
                <span className="mr-2 flex items-center gap-[7px] self-center"><Lights /></span>
                <div className="flex h-[29px] w-[132px] shrink-0 items-center gap-1.5 rounded-t-[8px] bg-white px-2.5 text-[10.5px] text-[#333]">
                    <Favicon color="#d93025" letter="Y" />
                    <span className="truncate">Watch later - YouTube</span>
                </div>
                {FAVICONS.map((c, i) => {
                    const fav = <Favicon color={c} letter={FAV_LETTERS[i]} />;
                    return (
                        <div key={i} className="flex h-[29px] w-[21px] shrink-0 items-center justify-center border-l border-[#d3cfcb] first:border-l-0">
                            {i === 3 ? <Needle label="1 of 43 tabs" ring="-inset-[4px] rounded-[5px]" tag="top-[22px] left-1/2 -translate-x-1/2">{fav}</Needle> : fav}
                        </div>
                    );
                })}
                <span className="ml-1 self-center text-[15px] leading-none text-[#666]">+</span>
            </div>
            {/* address bar */}
            <div className="flex items-center gap-3 bg-white px-3.5 py-[7px] text-[#777]">
                <span className="text-[13px] leading-none">←&nbsp;&nbsp;→&nbsp;&nbsp;↻</span>
                <span className="flex h-[25px] flex-1 items-center rounded-full bg-[#f1efed] px-3 text-[10.5px] text-[#444]">youtube.com/playlist?list=WL</span>
            </div>
            {/* bookmarks bar */}
            <div className="flex items-center gap-3.5 border-b border-[#ececec] bg-white px-4 pb-[7px] text-[10px] text-[#555]">
                {["Read later", "Read later (old)", "ARTICLES!!", "misc", "to sort", "Read later 2"].map((b) => (
                    <span key={b} className="flex items-center gap-1 whitespace-nowrap">
                        <svg viewBox="0 0 16 16" className="size-[11px] fill-[#8a8580]"><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.6l1.5 1.5h5.9A1.5 1.5 0 0 1 15 5v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5z" /></svg>
                        {b}
                    </span>
                ))}
            </div>
            {/* page: a "watch later" list nobody watches */}
            <div className="grid gap-2.5 px-5 py-4">
                <div className="flex items-baseline justify-between">
                    <span className="text-[14px] font-semibold text-[#111]">Watch later</span>
                    <span className="text-[10px] text-[#888]">318 videos · updated 2 years ago</span>
                </div>
                {[
                    ["#3b4a5a", "System design interview, full walkthrough", "1:42:10"],
                    ["#b9a089", "I read 50 books on habits. Here's the summary", "18:22"],
                    ["#2b2f3a", "Build a full-stack app in one video", "4:03:51"],
                    ["#8e9b88", "The only Git tutorial you need", "31:07"],
                ].map(([bg, t, d]) => (
                    <div key={t} className="flex items-center gap-3">
                        <span className="relative h-[42px] w-[74px] shrink-0 rounded-[5px]" style={{ background: bg }}>
                            <span className="absolute right-1 bottom-1 rounded-[2px] bg-black/75 px-[3px] text-[7.5px] text-white">{d}</span>
                        </span>
                        <span className="grid gap-1">
                            <span className="text-[11px] font-medium text-[#222]">{t}</span>
                            <i className="block h-[5px] w-24 rounded-full bg-[#eee]" />
                        </span>
                    </div>
                ))}
            </div>
        </Window>
    );
}

/* ── 3. Downloads: final_v2 (3).pdf ──────────────────────── */

type File = { name: string; kind: "pdf" | "img" | "dmg" | "zip" | "folder" | "doc"; size: string; date: string };

const FILES: File[] = [
    { name: "Screenshot 2026-03-14 at 11.02.17.png", kind: "img", size: "1.2 MB", date: "Today, 11:02" },
    { name: "invoice-0032.pdf", kind: "pdf", size: "88 KB", date: "Yesterday" },
    { name: "final.pdf", kind: "pdf", size: "2.4 MB", date: "12 Mar" },
    { name: "final_v2.pdf", kind: "pdf", size: "2.4 MB", date: "12 Mar" },
    { name: "final_v2 (1).pdf", kind: "pdf", size: "2.4 MB", date: "12 Mar" },
    { name: "final_v2 (3).pdf", kind: "pdf", size: "2.6 MB", date: "12 Mar" }, // the one
    { name: "IMG_4821.HEIC", kind: "img", size: "3.1 MB", date: "9 Mar" },
    { name: "untitled folder 4", kind: "folder", size: "--", date: "2 Mar" },
    { name: "notes (copy).docx", kind: "doc", size: "41 KB", date: "28 Feb" },
    { name: "archive.zip", kind: "zip", size: "220 MB", date: "21 Feb" },
    { name: "Setup-Installer.dmg", kind: "dmg", size: "96 MB", date: "20 Feb" },
];

const FILE_COLOR: Record<File["kind"], string> = {
    pdf: "#d4513b",
    img: "#4b8bd6",
    dmg: "#8a8580",
    zip: "#a28d6a",
    folder: "#6fa8dc",
    doc: "#2f6fd6",
};

function FileIcon({ kind }: { kind: File["kind"] }) {
    if (kind === "folder") {
        return <svg viewBox="0 0 16 16" className="size-[14px] shrink-0" style={{ fill: FILE_COLOR.folder }}><path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.6l1.5 1.5h5.9A1.5 1.5 0 0 1 15 5v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5z" /></svg>;
    }
    return (
        <span className="relative h-[15px] w-[12px] shrink-0 rounded-[2px] border border-[#cfcac5] bg-white">
            <i className="absolute inset-x-0 bottom-[2px] mx-auto h-[4px] w-[9px] rounded-[1px]" style={{ background: FILE_COLOR[kind] }} />
        </span>
    );
}

function DownloadsScene() {
    return (
        <Window title="Downloads" className="w-[620px]">
            <div className="grid min-[560px]:grid-cols-[132px_1fr]">
                <div className="hidden content-start gap-[3px] border-r min-[560px]:grid border-[#ececec] bg-[#f6f5f4] px-2.5 py-3 text-[10.5px] text-[#444]">
                    <span className="px-1.5 pb-1 text-[9px] font-semibold text-[#a19a95]">Favourites</span>
                    {["Recents", "Applications", "Desktop", "Documents", "Downloads"].map((s) => (
                        <span key={s} className={`rounded-[5px] px-1.5 py-[3px] ${s === "Downloads" ? "bg-[#e2dfdc] font-medium text-[#111]" : ""}`}>{s}</span>
                    ))}
                    <span className="px-1.5 pt-2 pb-1 text-[9px] font-semibold text-[#a19a95]">Tags</span>
                    {[["#d4513b", "Important"], ["#e3a33b", "Read this"]].map(([c, t]) => (
                        <span key={t} className="flex items-center gap-1.5 px-1.5 py-[3px]"><i className="size-[7px] rounded-full" style={{ background: c }} />{t}</span>
                    ))}
                </div>
                <div className="text-[10.5px] text-[#333]">
                    <div className="grid grid-cols-[1fr_62px_86px] border-b border-[#ececec] px-3 py-[6px] text-[9.5px] font-medium text-[#888]">
                        <span>Name</span><span>Size</span><span>Date Added</span>
                    </div>
                    {FILES.map((f, i) => {
                        const row = (
                            <div className={`grid grid-cols-[1fr_62px_86px] items-center px-3 py-[5px] ${i % 2 ? "bg-[#f8f7f6]" : ""}`}>
                                <span className="flex min-w-0 items-center gap-2"><FileIcon kind={f.kind} /><span className="truncate">{f.name}</span></span>
                                <span className="text-[#888]">{f.size}</span>
                                <span className="text-[#888]">{f.date}</span>
                            </div>
                        );
                        return i === 5 ? (
                            <Needle key={f.name} label="which final?" ring="-inset-y-[2px] inset-x-1 rounded-[6px]" tag="top-1/2 left-[150px] -translate-y-1/2">{row}</Needle>
                        ) : (
                            <div key={f.name}>{row}</div>
                        );
                    })}
                    <div className="border-t border-[#ececec] px-3 py-[6px] text-center text-[9.5px] text-[#999]">1,284 items, 12.4 GB available</div>
                </div>
            </div>
        </Window>
    );
}

/* ── 4. Camera roll: the diagram between a receipt and a parking spot ── */

type Photo = { bg: string; art?: string; pos?: string; draw?: "receipt" | "parking" | "diagram" | "sky" | "plate" | "plant" | "screen" | "doc"; video?: string };

const PHOTOS: Photo[] = [
    { bg: "#cdbfae", art: "/art/hands.webp", pos: "50% 50%" },
    { bg: "#9fb6c8", draw: "sky" },
    { bg: "#c98f62", draw: "plate" },
    { bg: "#2c2a28", draw: "screen" },
    { bg: "#efe9df", draw: "receipt" },
    { bg: "#f5f3ef", draw: "diagram" }, // the one, between a receipt…
    { bg: "#4f6b8a", draw: "parking" }, // …and a parking spot
    { bg: "#ddd3c7", art: "/art/statue-tree.webp", pos: "50% 20%" },
    { bg: "#1f2227", draw: "screen", video: "0:14" },
    { bg: "#6b7f5e", draw: "plant" },
    { bg: "#f0ede8", draw: "doc" },
    { bg: "#d9c3b0", art: "/art/arch-eye.webp", pos: "50% 60%" },
    { bg: "#e7b98d", draw: "sky" },
    { bg: "#efe9df", draw: "receipt" },
    { bg: "#a7745a", draw: "plate" },
    { bg: "#4f6b8a", draw: "parking" },
    { bg: "#7d8f74", draw: "plant", video: "0:31" },
    { bg: "#f0ede8", draw: "doc" },
    { bg: "#b4c7d6", draw: "sky" },
    { bg: "#cdbfae", art: "/art/bust-tree.webp", pos: "50% 30%" },
];

function PhotoTile({ p }: { p: Photo }) {
    return (
        <div className="relative aspect-square overflow-hidden" style={{ background: p.bg }}>
            {p.art && <Image src={p.art} alt="" fill sizes="60px" className="object-cover" style={{ objectPosition: p.pos }} />}
            {p.draw === "receipt" && (
                <span className="absolute inset-x-[22%] inset-y-[10%] grid content-start gap-[3px] bg-white px-1 py-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.15)]">
                    {[80, 60, 70, 50, 65, 40].map((w, i) => <i key={i} className="block h-px bg-[#999]" style={{ width: `${w}%` }} />)}
                </span>
            )}
            {p.draw === "parking" && (
                <span className="absolute inset-0 grid place-items-center text-center text-[13px] leading-[0.9] font-black text-white">P<br /><span className="text-[7px] font-semibold">B2-14</span></span>
            )}
            {p.draw === "diagram" && (
                <svg viewBox="0 0 40 40" className="absolute inset-0 size-full fill-none stroke-[#3a3a3a] stroke-[1.2]">
                    <rect x="4" y="5" width="12" height="7" rx="1" /><rect x="24" y="5" width="12" height="7" rx="1" />
                    <rect x="14" y="27" width="12" height="8" rx="1" /><path d="M10 12v8h10v7M30 12v8H20" />
                </svg>
            )}
            {p.draw === "sky" && <span className="absolute inset-x-0 bottom-0 h-1/3 bg-[#5d6b58]/70" />}
            {p.draw === "plate" && <span className="absolute inset-[18%] rounded-full bg-[#f4efe6] shadow-[inset_0_0_0_5px_#e9a35d]" />}
            {p.draw === "plant" && <span className="absolute bottom-0 left-1/2 h-3/4 w-1/2 -translate-x-1/2 rounded-t-full bg-[#3f5536]" />}
            {p.draw === "screen" && <span className="absolute inset-[22%] rounded-[2px] bg-[#e9e4dc]/90" />}
            {p.draw === "doc" && (
                <span className="absolute inset-[16%] grid content-start gap-[3px] bg-white p-1 shadow-[0_1px_2px_rgb(0_0_0/0.12)]">
                    {[90, 70, 85, 60].map((w, i) => <i key={i} className="block h-[1.5px] bg-[#bbb]" style={{ width: `${w}%` }} />)}
                </span>
            )}
            {p.video && <span className="absolute right-1 bottom-0.5 text-[7px] font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">{p.video}</span>}
        </div>
    );
}

function PhotosScene() {
    return (
        <Phone>
            <div className="flex items-end justify-between px-3.5 pt-1.5 pb-2">
                <span className="grid">
                    <span className="text-[16px] leading-tight font-bold text-[#111]">Recents</span>
                    <span className="text-[9.5px] text-[#888]">9,406 photos, 212 videos</span>
                </span>
                <span className="rounded-full bg-[#f0eeeb] px-2.5 py-1 text-[9.5px] font-semibold text-[#111]">Select</span>
            </div>
            <div className="grid grid-cols-4 gap-px bg-white">
                {PHOTOS.map((p, i) =>
                    i === 5 ? (
                        <Needle key={i} label="the diagram" ring="-inset-[3px] rounded-[4px]" tag="-top-[22px] left-1/2 -translate-x-1/2">
                            <PhotoTile p={p} />
                        </Needle>
                    ) : (
                        <PhotoTile key={i} p={p} />
                    ),
                )}
            </div>
        </Phone>
    );
}

/* ── The section ─────────────────────────────────────────── */

const SCENES = [
    {
        place: "Instagram",
        where: "Saved · All posts",
        line: "The reel with five project ideas. One of 612 saves, and the search bar can't see inside any of them.",
        cost: "about 4 minutes of scrolling",
        Scene: InstagramScene,
        span: "min-[900px]:col-span-5",
    },
    {
        place: "Browser",
        where: "43 tabs · 6 bookmark folders",
        line: "The video you'll watch later, in a tab you're scared to close, next to a \"Watch later\" list of 318.",
        cost: "closed by accident twice",
        Scene: BrowserScene,
        span: "min-[900px]:col-span-7",
    },
    {
        place: "Downloads",
        where: "1,284 items",
        line: "The paper you meant to finish, saved four times over. You remember what it said, not what it's called.",
        cost: "4 files with the same name",
        Scene: DownloadsScene,
        span: "min-[900px]:col-span-7",
    },
    {
        place: "Camera roll",
        where: "9,406 photos",
        line: "A screenshot of a system design diagram, filed between a receipt and a parking spot.",
        cost: "1 of 9,406 photos",
        Scene: PhotosScene,
        span: "min-[900px]:col-span-5",
    },
];

function SceneCard({ scene, index }: { scene: (typeof SCENES)[number]; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const seen = useInView(ref, { once: true, margin: "-25% 0px -25% 0px" });
    const { Scene } = scene;
    return (
        <Reveal delay={(index % 2) * 0.08} className={`min-w-0 ${scene.span}`}>
            <figure className="m-0 grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-2xl bg-lp-card shadow-[inset_0_0_0_1px_var(--color-lp-rule)]">
                <div ref={ref} aria-hidden="true" className="relative h-[330px] overflow-hidden border-b border-lp-rule bg-lp-field min-[560px]:h-[360px]">
                    <SeenContext.Provider value={seen}>
                        <Scene />
                    </SeenContext.Provider>
                </div>
                <figcaption className="grid content-start gap-2.5 px-5 pt-5 pb-6 min-[560px]:px-6">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="text-[13px] tracking-[0.04em] text-lp-ink uppercase">{scene.place}</span>
                        <span className="text-[12.5px] text-lp-muted">{scene.where}</span>
                    </span>
                    <p className="text-[16px] leading-[1.5] text-lp-ink">{scene.line}</p>
                    <span className="flex items-center gap-2 text-[13px] text-lp-signal">
                        <i aria-hidden="true" className="size-1.5 rounded-full bg-lp-signal" />
                        {scene.cost}
                    </span>
                </figcaption>
            </figure>
        </Reveal>
    );
}

export function Problem() {
    return (
        <section className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <div className="mb-12 grid items-end gap-6 min-[900px]:mb-14 min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:gap-16">
                    <Reveal>
                        <h2 className="font-lp-display text-[clamp(2.1rem,3.9vw,3.7rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">
                            You saved it. <em className="text-lp-muted">You just can&apos;t find it.</em>
                        </h2>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="max-w-[46ch] text-[17px] leading-[1.6] text-lp-muted">
                            Every app has a save button. None of them help you get it back. So the good stuff ends up in
                            four different places, and you can only find it if you remember the app, the folder and roughly the week.
                        </p>
                    </Reveal>
                </div>

                <div className="grid gap-4 min-[900px]:grid-cols-12 min-[900px]:gap-5">
                    {SCENES.map((scene, i) => (
                        <SceneCard key={scene.place} scene={scene} index={i} />
                    ))}
                </div>

                <Reveal className="mt-10 flex justify-center">
                    <a
                        href="#ask"
                        className="group inline-flex items-center gap-3 rounded-full bg-lp-card px-5 py-3 text-[15px] text-lp-ink shadow-[inset_0_0_0_1px_var(--color-lp-rule)] transition-colors hover:bg-white"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-none stroke-current stroke-2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>
                        Brainly searches all four at once
                        <span aria-hidden="true" className="text-lp-muted transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
                    </a>
                </Reveal>
            </Wrap>
        </section>
    );
}
