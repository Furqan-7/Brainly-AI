/**
 * "A brain that also tidies up": the organising features, each shown as a small working
 * screen with the same saves used across the page (the project reel, the walkthrough,
 * the transformer notes, the pasta TikTok) so it reads like one person's library.
 */

import { SectionHead, Wrap } from "./ui";
import { SpotlightCard, Stagger } from "./motion";
import { BrandLogo, type LogoName } from "./logos";

const BRAND: Partial<Record<LogoName, string>> = { Instagram: "#E4405F", YouTube: "#FF0000", TikTok: "#000000" };

type Mark = LogoName | "note" | "pdf" | "image";

function SmallMark({ m, className = "size-3.5" }: { m: Mark; className?: string }) {
    if (m === "note") return <i aria-hidden="true" className="size-2.5 flex-none rounded-[3px] bg-[#c79a2e]" />;
    if (m === "pdf") return <i aria-hidden="true" className="size-2.5 flex-none rounded-[3px] bg-[#d4513b]" />;
    if (m === "image") return <i aria-hidden="true" className="size-2.5 flex-none rounded-[3px] bg-[#4b8bd6]" />;
    return <BrandLogo name={m} color={BRAND[m]} className={`flex-none ${className}`} />;
}

const panel = "rounded-[14px] bg-white shadow-[0_0_0_1px_rgb(20_20_20/0.07),0_20px_40px_-30px_rgb(40_25_15/0.5)]";

/* ── Collections ─────────────────────────────────────────── */

function CollectionsScene() {
    const items: { m: Mark; title: string; bg: string; fg?: string }[] = [
        { m: "Instagram", title: "5 projects that got me hired", bg: "#23262e" },
        { m: "YouTube", title: "Build a full-stack app in one video", bg: "#2b2f3a" },
        { m: "note", title: "Ideas: AI notes app", bg: "#f7efd9", fg: "#3a2f1a" },
    ];
    return (
        <div className={`absolute inset-4 grid content-start gap-3 p-3.5 ${panel}`}>
            <span className="flex items-center justify-between gap-2">
                <span className="min-w-0">
                    <strong className="block truncate text-[13px] font-semibold">Portfolio ideas</strong>
                    <span className="text-[10.5px] text-lp-muted">6 saves</span>
                </span>
                <span className="flex flex-none items-center gap-1.5 text-[10.5px] text-lp-ink">
                    Public
                    <span className="flex h-[16px] w-[28px] items-center justify-end rounded-full bg-[#2f7d4f] p-[2px]"><i className="size-3 rounded-full bg-white" /></span>
                </span>
            </span>
            <span className="grid grid-cols-3 gap-2">
                {items.map((it) => (
                    <span key={it.title} className="grid gap-1.5">
                        <span className="h-[62px] rounded-[8px] p-1.5 text-[7.5px] leading-[1.15] font-bold" style={{ background: it.bg, color: it.fg ?? "#fff" }}>{it.title}</span>
                        <span className="flex items-center gap-1 text-[9.5px] text-lp-muted"><SmallMark m={it.m} className="size-2.5" />{it.m === "note" ? "Note" : it.m}</span>
                    </span>
                ))}
            </span>
            <span className="flex items-center gap-2 rounded-[9px] bg-lp-paper px-2.5 py-1.5 text-[10.5px]">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 flex-none fill-none stroke-lp-muted stroke-2" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
                <span className="truncate text-lp-muted">brainly.app/c/portfolio-ideas</span>
                <span className="ml-auto flex-none font-medium">Copy</span>
            </span>
        </div>
    );
}

/* ── Knowledge graph ─────────────────────────────────────── */

const NODES: { id: string; x: number; y: number; m: Mark; label: string; main?: boolean }[] = [
    { id: "reel", x: 50, y: 48, m: "Instagram", label: "5 projects that got me hired", main: true },
    { id: "build", x: 21, y: 18, m: "YouTube", label: "Full-stack build" },
    { id: "idea", x: 80, y: 20, m: "note", label: "Ideas: AI notes app" },
    { id: "rag", x: 16, y: 80, m: "pdf", label: "RAG explained.pdf" },
    { id: "sys", x: 83, y: 78, m: "YouTube", label: "System design" },
    { id: "diagram", x: 50, y: 90, m: "image", label: "IMG_5120" },
];
const EDGES = [["reel", "build"], ["reel", "idea"], ["reel", "rag"], ["reel", "sys"], ["sys", "diagram"], ["build", "idea"]];

function GraphScene() {
    const at = (id: string) => NODES.find((n) => n.id === id)!;
    return (
        <div className="absolute inset-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden="true">
                {EDGES.map(([a, b]) => (
                    <line key={a + b} x1={at(a).x} y1={at(a).y} x2={at(b).x} y2={at(b).y} vectorEffect="non-scaling-stroke" className={`stroke-[1.3] ${a === "reel" ? "stroke-lp-signal/60" : "stroke-lp-line"}`} />
                ))}
            </svg>
            {NODES.map((n) => (
                <span
                    key={n.id}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white whitespace-nowrap shadow-[0_0_0_1px_rgb(20_20_20/0.08),0_8px_18px_-12px_rgb(40_25_15/0.5)] ${n.main ? "px-3 py-1.5 text-[11.5px] font-semibold shadow-[0_0_0_2px_var(--color-lp-signal),0_10px_22px_-12px_rgb(40_25_15/0.6)]" : "px-2.5 py-1 text-[10.5px]"}`}
                    style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                    <SmallMark m={n.m} className={n.main ? "size-3.5" : "size-3"} />
                    {n.label}
                </span>
            ))}
        </div>
    );
}

/* ── Rediscover ──────────────────────────────────────────── */

function RediscoverScene() {
    const steps = ["1 day", "2 days", "4 days", "8 days", "… 6 months"];
    return (
        <div className="absolute inset-4 grid content-start gap-3">
            <div className={`grid gap-2.5 p-3 ${panel}`}>
                <span className="text-[10.5px] tracking-[0.04em] text-lp-muted uppercase">Worth a second look today</span>
                <span className="grid grid-cols-[40px_1fr] items-center gap-2.5">
                    <span className="h-[50px] rounded-[7px] bg-[#d7b98f] p-1 text-[6.5px] leading-[1.1] font-bold text-[#2a2118]">pasta in 60 sec</span>
                    <span className="min-w-0">
                        <span className="block truncate text-[12px] font-semibold">Pasta in 60 seconds</span>
                        <span className="flex items-center gap-1 text-[10px] text-lp-muted"><SmallMark m="TikTok" className="size-2.5" />Saved 5 weeks ago</span>
                    </span>
                </span>
                <span className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                    <span className="rounded-[8px] bg-lp-button px-2 py-1.5 text-center text-white">Got it, less often</span>
                    <span className="rounded-[8px] px-2 py-1.5 text-center shadow-[inset_0_0_0_1px_var(--color-lp-line)]">Again soon</span>
                </span>
            </div>
            <span className="flex flex-wrap items-center gap-1 text-[10px] text-lp-muted">
                {steps.map((s, i) => (
                    <span key={s} className={`rounded-full px-2 py-[3px] ${i < 3 ? "bg-lp-ink text-white" : "shadow-[inset_0_0_0_1px_var(--color-lp-line)]"}`}>{s}</span>
                ))}
            </span>
        </div>
    );
}

/* ── No duplicates ───────────────────────────────────────── */

function DuplicatesScene() {
    return (
        <div className={`absolute inset-4 grid content-start gap-2.5 p-3 ${panel}`}>
            <span className="flex items-center justify-between text-[10.5px]">
                <span className="tracking-[0.04em] text-lp-muted uppercase">Same reel, saved twice</span>
            </span>
            {["instagram.com/reel/C8abc_12", "instagram.com/reel/C8abc_12/?igsh=MWx0eGs…"].map((u, i) => (
                <span key={u} className="grid grid-cols-[30px_1fr] items-center gap-2 rounded-[9px] bg-lp-paper p-1.5">
                    <span className="h-[38px] rounded-[6px] bg-[#23262e]" />
                    <span className="min-w-0">
                        <span className="block truncate text-[11px] font-medium">5 projects that got me hired</span>
                        <span className="flex items-center gap-1 text-[9.5px] text-lp-muted"><SmallMark m="Instagram" className="size-2.5" /><span className="truncate">{u}</span></span>
                    </span>
                    {i === 0 && <span className="sr-only">original</span>}
                </span>
            ))}
            <span className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-lp-muted">Notes and tags are kept</span>
                <span className="rounded-[8px] bg-lp-button px-3 py-1.5 text-[10.5px] text-white">Merge</span>
            </span>
        </div>
    );
}

/* ── Tags and stars ──────────────────────────────────────── */

function TagsScene() {
    return (
        <div className={`absolute inset-4 grid content-start gap-3 p-3 ${panel}`}>
            <span className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold">Build a full-stack app in one video</span>
                    <span className="flex items-center gap-1 text-[10px] text-lp-muted"><SmallMark m="YouTube" className="size-2.5" />YouTube · 4:03:51</span>
                </span>
                <svg viewBox="0 0 24 24" aria-label="Starred" className="size-[18px] flex-none fill-[#f5b400]"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>
            </span>
            <span className="grid gap-1.5">
                <span className="text-[10px] text-lp-muted">Your tags</span>
                <span className="flex flex-wrap gap-1">
                    {["projects", "to build"].map((t) => <span key={t} className="rounded-full bg-lp-chip px-2 py-0.5 text-[10.5px]">#{t}</span>)}
                </span>
            </span>
            <span className="grid gap-1.5">
                <span className="text-[10px] text-lp-muted">Suggested by Brainly</span>
                <span className="flex flex-wrap gap-1">
                    {["web dev", "react", "databases"].map((t) => <span key={t} className="rounded-full border border-dashed border-lp-line px-2 py-0.5 text-[10.5px] text-lp-muted">+ {t}</span>)}
                </span>
            </span>
        </div>
    );
}

/* ── Search without AI ───────────────────────────────────── */

function SearchScene() {
    const rows: { m: Mark; t: string; s: string }[] = [
        { m: "TikTok", t: "Pasta in 60 seconds", s: "“…a splash of pasta water…”" },
        { m: "Instagram", t: "Silky tomato sauce", s: "“…the pasta finishes in the pan…”" },
        { m: "note", t: "Groceries for Sunday", s: "“…pasta, basil, parmesan…”" },
    ];
    return (
        <div className="absolute inset-4 grid content-start gap-2 min-[900px]:grid-cols-[1fr_1.4fr] min-[900px]:content-center min-[900px]:items-center min-[900px]:gap-5">
            <span className={`flex items-center gap-2 px-3 py-2.5 text-[12.5px] ${panel}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-none stroke-lp-muted stroke-2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>
                pasta<i className="h-[14px] w-px animate-lp-blink bg-lp-ink motion-reduce:animate-none" />
                <span className="ml-auto rounded-md bg-lp-field px-1.5 py-0.5 text-[10px] text-lp-muted">Search · 0 AI answers</span>
            </span>
            <span className="grid gap-1.5">
                {rows.map((r) => (
                    <span key={r.t} className="flex items-center gap-2 rounded-[10px] bg-white px-2.5 py-1.5 text-[11px] shadow-[0_0_0_1px_rgb(20_20_20/0.06)]">
                        <SmallMark m={r.m} className="size-3" />
                        <span className="font-medium whitespace-nowrap">{r.t}</span>
                        <span className="truncate text-lp-muted">{r.s}</span>
                    </span>
                ))}
            </span>
        </div>
    );
}

/* ── The section ─────────────────────────────────────────── */

const FEATURES = [
    { title: "Collections", text: "Group saves into boards like “Portfolio ideas” or “Trip to Lisbon”, and share any board with a public link.", Scene: CollectionsScene, span: "min-[900px]:col-span-3", h: "h-[250px]" },
    { title: "Knowledge graph", text: "See how your saves connect. The reel links to the walkthrough, your notes and the paper they all lead back to.", Scene: GraphScene, span: "min-[900px]:col-span-3", h: "h-[250px]" },
    { title: "Rediscover", text: "Brainly brings back things you saved and forgot. Tap “Got it” and you'll see it less often.", Scene: RediscoverScene, span: "min-[900px]:col-span-2", h: "h-[230px]" },
    { title: "No duplicates", text: "Saved the same reel twice? Brainly notices, even when the link looks different, and lets you merge them.", Scene: DuplicatesScene, span: "min-[900px]:col-span-2", h: "h-[230px]" },
    { title: "Tags and stars", text: "Your own tags plus a few Brainly suggests. Star what matters, archive what doesn't.", Scene: TagsScene, span: "min-[900px]:col-span-2", h: "h-[230px]" },
    { title: "Search without AI", text: "Need it fast? Search mode lists matching saves as you type and doesn't use your daily AI answers.", Scene: SearchScene, span: "min-[560px]:col-span-2 min-[900px]:col-span-6 min-[900px]:grid-cols-[1fr_1.9fr]", h: "h-[200px]" },
];

export function Organise() {
    return (
        <section className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <SectionHead eyebrow="Keep it tidy" title="A brain that also tidies up." />
                <Stagger className="grid gap-4 min-[560px]:grid-cols-2 min-[900px]:grid-cols-6 min-[900px]:gap-5">
                    {FEATURES.map(({ title, text, Scene, span, h }) => (
                        <SpotlightCard
                            key={title}
                            className={`grid min-w-0 content-start overflow-hidden rounded-2xl bg-lp-card shadow-[inset_0_0_0_1px_var(--color-lp-rule)] ${span}`}
                        >
                            <div aria-hidden="true" className={`relative overflow-hidden border-b border-lp-rule bg-lp-field ${h} ${title === "Search without AI" ? "min-[900px]:order-2 min-[900px]:h-auto min-[900px]:min-h-[170px] min-[900px]:border-b-0 min-[900px]:border-l" : ""}`}>
                                <Scene />
                            </div>
                            <div className="grid content-start gap-2 p-5 min-[560px]:p-6">
                                <h3 className="font-lp-display text-[1.4rem] leading-[1.1] font-normal tracking-[-0.02em]">{title}</h3>
                                <p className="text-[15px] leading-[1.6] text-lp-muted">{text}</p>
                            </div>
                        </SpotlightCard>
                    ))}
                </Stagger>
            </Wrap>
        </section>
    );
}
