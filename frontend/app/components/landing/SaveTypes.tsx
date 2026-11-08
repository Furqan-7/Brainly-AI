/**
 * "What you can save": the nine kinds of saves, each drawn as the card it becomes in your
 * library. A preview of the thing itself, the real logo of where it comes from, and what
 * Brainly keeps from inside it so it can be found later.
 */

import { SectionHead, Wrap } from "./ui";
import { Reveal, SpotlightCard, Stagger } from "./motion";
import { BrandLogo, type LogoName } from "./logos";

const BRAND: Partial<Record<LogoName, string>> = {
    Instagram: "#E4405F",
    YouTube: "#FF0000",
    TikTok: "#000000",
    X: "#000000",
    LinkedIn: "#0A66C2",
    Notion: "#000000",
    GoogleDocs: "#4285F4",
};

/* ── Generic marks for things that have no brand ─────────── */

const GLYPHS = {
    web: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
    pdf: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h4" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 17l-5-5-9 8" /></>,
    note: <><path d="M5 4h14v12l-4 4H5z" /><path d="M15 20v-4h4M8 9h8M8 13h5" /></>,
    voice: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
};

function Glyph({ name, color }: { name: keyof typeof GLYPHS; color: string }) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="size-[18px]">
            {GLYPHS[name]}
        </svg>
    );
}

function Play({ className = "" }: { className?: string }) {
    return <svg viewBox="0 0 10 10" aria-hidden="true" className={`fill-current ${className}`}><path d="M2.5 1.2l6.3 3.8-6.3 3.8z" /></svg>;
}

/* ── Previews: what each save looks like ─────────────────── */

const previews: Record<string, React.ReactNode> = {
    reel: (
        <div className="absolute inset-y-3 left-1/2 w-[92px] -translate-x-1/2 rounded-[10px] bg-[#23262e] p-2 text-[9px] leading-[1.15] font-bold text-white shadow-[0_14px_26px_-16px_rgb(0_0_0/0.6)]">
            5 projects that got me hired
            <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-semibold"><Play className="size-[7px]" />96K</span>
        </div>
    ),
    youtube: (
        <div className="absolute inset-x-5 top-1/2 grid aspect-video -translate-y-1/2 place-items-center rounded-[10px] bg-[#3b4a5a] shadow-[0_14px_26px_-16px_rgb(0_0_0/0.6)]">
            <span className="grid h-[26px] w-[38px] place-items-center rounded-[8px] bg-[#FF0000] text-white"><Play className="size-3" /></span>
            <span className="absolute bottom-2 left-2.5 text-[10px] font-medium text-white">System design interview</span>
            <span className="absolute right-2 bottom-2 rounded-[3px] bg-black/80 px-1 text-[9px] text-white">1:42:10</span>
        </div>
    ),
    tiktok: (
        <div className="absolute inset-y-3 left-1/2 w-[92px] -translate-x-1/2 overflow-hidden rounded-[10px] bg-[#d7b98f] p-2 text-[9px] leading-[1.15] font-bold text-[#2a2118] shadow-[0_14px_26px_-16px_rgb(0_0_0/0.6)]">
            pasta in 60 sec
            <span className="absolute right-1.5 bottom-6 grid gap-1.5">
                {[0, 1, 2].map((i) => <i key={i} className="block size-3.5 rounded-full bg-white/70" />)}
            </span>
            <span className="absolute bottom-2 left-2 text-[8px] font-semibold">@homecook</span>
        </div>
    ),
    web: (
        <div className="absolute inset-x-5 top-4 bottom-0 overflow-hidden rounded-t-[10px] bg-white shadow-[0_0_0_1px_rgb(20_20_20/0.06)]">
            <span className="flex items-center gap-1 border-b border-[#eee] px-2.5 py-1.5 text-[9px] text-[#888]">
                <i className="size-1.5 rounded-full bg-[#ddd]" /><i className="size-1.5 rounded-full bg-[#ddd]" /> notes.dev/read-a-paper
            </span>
            <span className="grid gap-1.5 p-3">
                <span className="font-lp-display text-[13px] leading-[1.15]">How to read a paper in three passes</span>
                {[95, 88, 92, 60].map((w) => <i key={w} className="block h-[3px] rounded-full bg-[#e8e4e0]" style={{ width: `${w}%` }} />)}
            </span>
        </div>
    ),
    x: (
        <div className="absolute inset-x-5 top-1/2 grid -translate-y-1/2 gap-1.5 rounded-[12px] bg-white p-3 shadow-[0_0_0_1px_rgb(20_20_20/0.06)]">
            <span className="flex items-center gap-1.5">
                <i className="size-5 rounded-full bg-[#c9bfb4]" />
                <span className="text-[10px] leading-tight"><b className="font-semibold">Dev Notes</b> <span className="text-[#888]">@devnotes</span></span>
            </span>
            <span className="text-[10.5px] leading-[1.4] text-[#222]">Most side projects don&apos;t die from bad code. They die because you forgot why you started.</span>
            <span className="text-[9.5px] text-[#1d9bf0]">#buildinpublic</span>
        </div>
    ),
    pdf: (
        <div className="absolute inset-x-0 top-4 bottom-0 flex justify-center">
            <div className="grid w-[132px] content-start gap-1.5 bg-white px-3 pt-3 shadow-[0_14px_26px_-16px_rgb(60_35_20/0.55)]">
                <span className="text-center font-lp-display text-[9px] leading-[1.2]">Attention Is All You Need</span>
                {[92, 85, 90].map((w) => <i key={w} className="block h-[2.5px] bg-[#e8e4e0]" style={{ width: `${w}%` }} />)}
                <i className="block h-[9px] w-full bg-[#f7d774]/80" />
                {[80, 92, 70].map((w) => <i key={w} className="block h-[2.5px] bg-[#e8e4e0]" style={{ width: `${w}%` }} />)}
            </div>
        </div>
    ),
    image: (
        <div className="absolute inset-x-6 top-1/2 aspect-[4/3] max-h-[124px] -translate-y-1/2 justify-self-center rounded-[8px] bg-white shadow-[0_0_0_1px_rgb(20_20_20/0.06)]">
            <svg viewBox="0 0 200 150" className="size-full" aria-hidden="true">
                <path d="M52 52v26h48v20M148 52v26h-48" className="fill-none stroke-[#3a3a3a] stroke-[1.6]" />
                {[[22, 22, 60], [118, 22, 60], [66, 98, 68]].map(([x, y, w]) => (
                    <rect key={x} x={x} y={y} width={w} height="30" rx="4" className="fill-white stroke-[#3a3a3a] stroke-[1.6]" />
                ))}
                <g className="fill-[#222] text-[12px]" textAnchor="middle">
                    <text x="52" y="42">API</text><text x="148" y="42">Worker</text><text x="100" y="118">Postgres</text>
                </g>
            </svg>
        </div>
    ),
    note: (
        <div className="absolute inset-x-5 top-4 bottom-0 grid content-start gap-1.5 rounded-t-[10px] bg-[#f7efd9] p-3 text-[10.5px] leading-[1.45] text-[#3a2f1a]">
            <b className="text-[11.5px] font-semibold"># Reading notes: transformers</b>
            <span>- each head = a different way of reading the sentence</span>
            <span>- diagram on p.3 is the clearest</span>
        </div>
    ),
    voice: (
        <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 items-center gap-2.5 rounded-full bg-white py-2 pr-4 pl-2 shadow-[0_0_0_1px_rgb(20_20_20/0.06)]">
            <span className="grid size-8 flex-none place-items-center rounded-full bg-[#7c5cbf] text-white"><Play className="ml-0.5 size-3" /></span>
            <span className="flex flex-1 items-center gap-[2px]">
                {[6, 12, 18, 10, 22, 14, 8, 16, 24, 12, 7, 15, 20, 9, 13, 6, 11, 17, 8, 5].map((h, i) => (
                    <i key={i} className={`block w-[2.5px] rounded-full ${i < 8 ? "bg-[#7c5cbf]" : "bg-[#7c5cbf]/30"}`} style={{ height: h }} />
                ))}
            </span>
            <span className="text-[10px] text-[#888] tabular-nums">0:42</span>
        </div>
    ),
};

/* ── The nine ────────────────────────────────────────────── */

type Kind = {
    name: string;
    logo: { brand: LogoName } | { glyph: keyof typeof GLYPHS; color: string };
    from?: LogoName[]; // extra logos, e.g. where notes can be imported from
    isNew?: boolean;
    preview: string;
    what: string;
    keeps: string[];
};

const KINDS: Kind[] = [
    { name: "Instagram reels", logo: { brand: "Instagram" }, isNew: true, preview: "reel", what: "The reel you'll want again in three weeks.", keeps: ["What's said", "Caption", "Creator"] },
    { name: "YouTube & Shorts", logo: { brand: "YouTube" }, preview: "youtube", what: "Lectures, tutorials and talks.", keeps: ["Captions or transcript", "Channel", "Length"] },
    { name: "TikTok", logo: { brand: "TikTok" }, isNew: true, preview: "tiktok", what: "Recipes, hacks and how-tos.", keeps: ["What's said", "Caption", "Creator"] },
    { name: "Web pages", logo: { glyph: "web", color: "#2f6fd6" }, from: ["LinkedIn"], preview: "web", what: "Articles, docs and LinkedIn posts.", keeps: ["Article text, no ads", "Preview image"] },
    { name: "Posts on X", logo: { brand: "X" }, preview: "x", what: "Threads worth rereading.", keeps: ["Post", "Author", "Hashtags"] },
    { name: "PDFs", logo: { glyph: "pdf", color: "#d4513b" }, preview: "pdf", what: "Papers, resumes and reports.", keeps: ["Every page", "Scanned pages too"] },
    { name: "Images", logo: { glyph: "image", color: "#4b8bd6" }, preview: "image", what: "Screenshots, diagrams and whiteboards.", keeps: ["Text in the picture", "What it shows"] },
    { name: "Notes", logo: { glyph: "note", color: "#b8892a" }, from: ["Notion", "GoogleDocs"], preview: "note", what: "Your own thoughts, in Markdown.", keeps: ["Markdown", "Import from Notion & Docs"] },
    { name: "Voice notes", logo: { glyph: "voice", color: "#7c5cbf" }, isNew: true, preview: "voice", what: "Ideas you say out loud.", keeps: ["Written transcript", "Record or upload"] },
];

function KindLogo({ logo }: { logo: Kind["logo"] }) {
    return (
        <span className="grid size-8 flex-none place-items-center rounded-[9px] bg-white shadow-[0_0_0_1px_rgb(20_20_20/0.07)]">
            {"brand" in logo ? <BrandLogo name={logo.brand} color={BRAND[logo.brand]} className="size-[17px]" /> : <Glyph name={logo.glyph} color={logo.color} />}
        </span>
    );
}

/** The row of real logos above the grid. */
const STRIP: LogoName[] = ["Instagram", "YouTube", "TikTok", "X", "LinkedIn", "Notion", "GoogleDocs"];

export function SaveTypes() {
    return (
        <section id="save" className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap>
                <SectionHead eyebrow="What you can save" title="Nine kinds of things, one memory.">
                    <p className="max-w-[58ch] text-[17px] leading-[1.6] text-lp-muted">
                        Each one becomes a card in your library, with what Brainly kept from inside it so you can find it by what it said.
                    </p>
                </SectionHead>

                <Reveal className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                    <span className="text-[13px] tracking-[0.04em] text-lp-muted uppercase">Saves from</span>
                    {STRIP.map((n) => (
                        <span key={n} className="flex items-center gap-2 text-[14px] text-lp-ink">
                            <BrandLogo name={n} color={BRAND[n]} className="size-[18px]" />
                            {n === "GoogleDocs" ? "Google Docs" : n}
                        </span>
                    ))}
                    <span className="text-[14px] text-lp-muted">+ any web page, PDF, photo or voice note</span>
                </Reveal>

                {/* phones: a row you swipe through; wider screens: a grid */}
                <Stagger className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] min-[560px]:mx-0 min-[560px]:grid min-[560px]:grid-cols-2 min-[560px]:gap-4 min-[560px]:overflow-visible min-[560px]:px-0 min-[560px]:pb-0 min-[900px]:grid-cols-3 min-[900px]:gap-5">
                    {KINDS.map((k) => (
                        <SpotlightCard
                            key={k.name}
                            className="grid w-[82%] min-w-0 flex-none snap-start content-start overflow-hidden rounded-2xl min-[560px]:w-auto bg-lp-card shadow-[inset_0_0_0_1px_var(--color-lp-rule)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_var(--color-lp-line),0_24px_40px_-28px_rgba(60,35,20,0.45)]"
                        >
                            <div aria-hidden="true" className="relative h-[160px] overflow-hidden border-b border-lp-rule bg-lp-field min-[560px]:h-[168px]">
                                <div className="absolute inset-0 origin-center transition-transform duration-500 group-hover/card:scale-[1.04]">
                                    {previews[k.preview]}
                                </div>
                            </div>
                            <div className="grid min-w-0 content-start gap-2.5 p-4 min-[560px]:p-5">
                                <span className="flex items-center gap-2.5">
                                    <KindLogo logo={k.logo} />
                                    <strong className="text-[15px] leading-[1.2] font-semibold">{k.name}</strong>
                                    {k.isNew && (
                                        <span className="ml-auto rounded-md px-1.5 py-1 text-[10px] leading-none tracking-[0.06em] text-lp-signal uppercase shadow-[inset_0_0_0_1px_var(--color-lp-signal)]">New</span>
                                    )}
                                </span>
                                <p className="text-[14.5px] leading-[1.5] text-lp-muted">
                                    {k.what}
                                    {k.from && (
                                        <span className="ml-1.5 inline-flex translate-y-[3px] gap-1.5" aria-label={`Also from ${k.from.join(" and ")}`}>
                                            {k.from.map((f) => <BrandLogo key={f} name={f} color={BRAND[f]} className="size-[15px]" />)}
                                        </span>
                                    )}
                                </p>
                                <span className="flex flex-wrap gap-1.5">
                                    <span className="sr-only">Brainly keeps:</span>
                                    {k.keeps.map((x) => (
                                        <span key={x} className="flex items-center gap-1 rounded-full bg-white px-2 py-[3px] text-[11.5px] text-lp-ink shadow-[inset_0_0_0_1px_var(--color-lp-rule)]">
                                            <svg viewBox="0 0 12 12" aria-hidden="true" className="size-2.5 fill-none stroke-[#2f7d4f] stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>
                                            {x}
                                        </span>
                                    ))}
                                </span>
                            </div>
                        </SpotlightCard>
                    ))}
                </Stagger>
            </Wrap>
        </section>
    );
}
