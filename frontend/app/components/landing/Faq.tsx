/**
 * "Before you start": the common questions, each answered with a small picture of the real
 * thing (the private switch, the AI's actual "couldn't find it" reply, the phone's share menu,
 * the extension's right-click items, the files the importer reads). The wording in each picture
 * is copied from the app, the extension and the backend.
 */

import { Reveal } from "./motion";
import { Eyebrow, Wrap } from "./ui";
import { BrandLogo } from "./logos";

function Mark({ className = "" }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className={className}>
            <path d="M5.2 10.2c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
            <path d="M3.6 15c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
            <path d="M3.6 19.8c4.1-2.3 8.3 2.3 12.4 0s8.3-2.3 12.4 0" />
            <path d="M5.2 24.6c3.6-2 7.2 2 10.8 0s7.2-2 10.8 0" />
        </svg>
    );
}

const card = "rounded-[14px] bg-white shadow-[0_0_0_1px_rgb(20_20_20/0.07),0_18px_36px_-28px_rgb(40_25_15/0.5)]";

/* ── The pictures ────────────────────────────────────────── */

function Privacy() {
    return (
        <div className={`grid gap-2.5 p-3.5 ${card}`}>
            {[
                { name: "Portfolio ideas", pub: false },
                { name: "Trip to Lisbon", pub: true },
            ].map((c) => (
                <span key={c.name} className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="flex items-center gap-2 font-medium">
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-none stroke-lp-muted stroke-2" strokeLinecap="round" strokeLinejoin="round">
                            {c.pub ? <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></> : <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>}
                        </svg>
                        {c.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-lp-muted">
                        {c.pub ? "Public" : "Only you"}
                        <span className={`flex h-[16px] w-[28px] items-center rounded-full p-[2px] ${c.pub ? "justify-end bg-[#2f7d4f]" : "justify-start bg-lp-line"}`}><i className="size-3 rounded-full bg-white" /></span>
                    </span>
                </span>
            ))}
        </div>
    );
}

function Honest() {
    return (
        <div className={`grid gap-2.5 p-3.5 ${card}`}>
            <span className="max-w-[90%] justify-self-end rounded-[14px] rounded-br-md bg-lp-button px-3 py-2 text-[12px] text-white">what did I save about sourdough?</span>
            <span className="flex items-start gap-2 text-[12.5px] leading-[1.45]">
                <span className="grid size-5 flex-none place-items-center rounded-full bg-lp-chip text-lp-ink"><Mark className="size-3" /></span>
                I couldn&apos;t find that in your saved content.
            </span>
        </div>
    );
}

function PhoneShare() {
    const apps = [
        { name: "Messages", bg: "#34c759" },
        { name: "Mail", bg: "#3b82f6" },
        { name: "Brainly", bg: "#141414", brainly: true },
        { name: "Notes", bg: "#f5c84c" },
    ];
    return (
        <div className={`grid gap-3 p-3.5 ${card}`}>
            <span className="flex items-center gap-2 text-[11.5px]">
                <BrandLogo name="Instagram" color="#E4405F" className="size-3.5" />
                <span className="truncate text-lp-muted">instagram.com/reel/C8abc_12</span>
            </span>
            <span className="grid grid-cols-4 gap-2 text-center text-[10px]">
                {apps.map((a) => (
                    <span key={a.name} className="grid justify-items-center gap-1">
                        <span className={`grid size-10 place-items-center rounded-[11px] text-white ${a.brainly ? "shadow-[0_0_0_2px_white,0_0_0_4px_var(--color-lp-signal)]" : ""}`} style={{ background: a.bg }}>
                            {a.brainly && <Mark className="size-5" />}
                        </span>
                        <span className={a.brainly ? "font-semibold text-lp-ink" : "text-lp-muted"}>{a.name}</span>
                    </span>
                ))}
            </span>
        </div>
    );
}

function RightClick() {
    return (
        <div className={`grid gap-[2px] p-1.5 text-[12.5px] ${card}`}>
            {["Open link in new tab", "Copy link address"].map((t) => <span key={t} className="rounded-[7px] px-2.5 py-1.5 text-lp-muted">{t}</span>)}
            <i className="mx-2 my-1 h-px bg-lp-rule" />
            {["Save page to Brainly", "Save link to Brainly", "Save selection to Brainly"].map((t, i) => (
                <span key={t} className={`flex items-center gap-2 rounded-[7px] px-2.5 py-1.5 ${i === 1 ? "bg-lp-ink text-white" : ""}`}>
                    <Mark className="size-3.5" />
                    {t}
                </span>
            ))}
        </div>
    );
}

function Import() {
    const files = [
        { name: "Project ideas 1a2b….md", logo: "Notion" as const, color: "#000000" },
        { name: "Notion-export.zip", logo: "Notion" as const, color: "#000000" },
        { name: "Reading notes.docx", logo: "GoogleDocs" as const, color: "#4285F4" },
    ];
    return (
        <div className={`grid gap-2 border-2 border-dashed border-lp-line p-3.5 shadow-none ${card}`}>
            {files.map((f) => (
                <span key={f.name} className="flex items-center gap-2 rounded-[9px] bg-lp-paper px-2.5 py-2 text-[12px]">
                    <BrandLogo name={f.logo} color={f.color} className="size-3.5 flex-none" />
                    <span className="truncate">{f.name}</span>
                    <svg viewBox="0 0 12 12" aria-hidden="true" className="ml-auto size-3 flex-none fill-none stroke-[#2f7d4f] stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.2l2.3 2.3 4.7-5" /></svg>
                </span>
            ))}
            <span className="text-center text-[10.5px] text-lp-muted">.md · .txt · .html · .docx · Notion .zip</span>
        </div>
    );
}

/* ── The questions ───────────────────────────────────────── */

const FAQS = [
    {
        q: "Who can see what I save?",
        a: "Only you. Your files are served only to your signed-in account, and nothing is public unless you share a collection yourself. You can stop sharing at any time.",
        Visual: Privacy,
    },
    {
        q: "Does the AI make things up?",
        a: "Brainly answers only from what you saved and cites each source with a number you can click. If the answer isn't in your saves, it says so instead of guessing.",
        Visual: Honest,
    },
    {
        q: "Does it work on my phone?",
        a: "Yes. Install Brainly from your phone's browser and it shows up in the Share menu, so you can send a reel or a link to Brainly without copying anything.",
        Visual: PhoneShare,
    },
    {
        q: "Can I save from my browser?",
        a: "The Brainly extension saves the page you're on in one click. Right-click a link to save it, or select text to save it as a note.",
        Visual: RightClick,
    },
    {
        q: "Can I bring my notes from Notion or Google Docs?",
        a: "Export them and drop the files in. Brainly reads Markdown, text, HTML, Word documents and Notion's zip export.",
        Visual: Import,
    },
];

export function Faq() {
    return (
        <section id="faq" className="scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]">
            <Wrap className="grid gap-10 min-[960px]:grid-cols-[0.75fr_1.6fr] min-[960px]:gap-16">
                <Reveal className="grid content-start justify-items-start gap-[18px] min-[960px]:sticky min-[960px]:top-16 min-[960px]:self-start">
                    <Eyebrow>Questions</Eyebrow>
                    <h2 className="font-lp-display text-[clamp(2.1rem,3.9vw,3.7rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">Before you start.</h2>
                    <p className="max-w-[34ch] text-[16px] leading-[1.6] text-lp-muted">
                        The things people ask before they hand Brainly their saves. Open one to see how it works in the app.
                    </p>
                </Reveal>

                <Reveal className="border-t border-lp-rule">
                    {FAQS.map(({ q, a, Visual }, i) => (
                        <details key={q} open={i === 0} className="group border-b border-lp-rule">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-lp-display text-[1.3rem] leading-[1.3] transition-transform duration-300 hover:translate-x-1 [&::-webkit-details-marker]:hidden">
                                <span className="flex items-baseline gap-4">
                                    <span className="font-lp-body text-[12px] text-lp-muted tabular-nums">0{i + 1}</span>
                                    {q}
                                </span>
                                <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full font-lp-body text-lg leading-none text-lp-muted shadow-[inset_0_0_0_1px_var(--color-lp-line)] transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-lp-ink group-open:text-white">+</span>
                            </summary>
                            <div className="grid items-start gap-5 pb-7 min-[700px]:grid-cols-[1fr_260px] min-[700px]:gap-8 min-[700px]:pl-[34px]">
                                <p className="max-w-[56ch] text-base leading-[1.65] text-lp-muted">{a}</p>
                                <div aria-hidden="true" className="max-w-[300px]">
                                    <Visual />
                                </div>
                            </div>
                        </details>
                    ))}
                </Reveal>
            </Wrap>
        </section>
    );
}
