import Link from "next/link";
import { CtaPair, Eyebrow, SectionHead, Wrap } from "./ui";

const block = "scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]";
const h3 = "font-lp-display text-[1.45rem] leading-[1.04] font-normal tracking-[-0.025em]";
const lead = "max-w-[58ch] text-[17px] leading-[1.6] text-lp-muted";

/* ── The problem ─────────────────────────────────────────── */

const LOST = [
    { where: "Instagram", what: "The reel with five project ideas, somewhere in a \"Saved\" folder of 600 others." },
    { where: "Browser", what: "Forty open tabs and a bookmarks bar nobody has opened since March." },
    { where: "Downloads", what: "The paper you meant to finish, now called final_v2 (3).pdf." },
    { where: "Camera roll", what: "A screenshot of a diagram, between a receipt and a parking spot." },
];

export function Problem() {
    return (
        <section className={block}>
            <Wrap className="grid items-center gap-10 min-[900px]:grid-cols-[1.05fr_1fr] min-[900px]:gap-16">
                <h2 className="font-lp-display text-[clamp(2.1rem,3.9vw,3.7rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">
                    You saved it. <em className="text-lp-muted">You just can&apos;t find it.</em>
                </h2>
                <dl className="m-0 border-t border-lp-rule">
                    {LOST.map((item) => (
                        <div key={item.where} className="grid gap-1 border-b border-lp-rule py-[18px] min-[560px]:grid-cols-[9.5rem_1fr] min-[560px]:gap-[18px]">
                            <dt className="text-[13px] tracking-[0.04em] text-lp-ink uppercase">{item.where}</dt>
                            <dd className="m-0 min-w-0 text-base leading-[1.55] text-lp-muted">{item.what}</dd>
                        </div>
                    ))}
                </dl>
            </Wrap>
        </section>
    );
}

/* ── How it works (a real sequence, so it is numbered) ───── */

const STEPS = [
    {
        title: "Save from anywhere",
        text: "Paste a link, drop a file, record a voice note, or share straight from your phone or browser.",
        points: ["Browser extension, one click", "\"Share → Brainly\" on Android", "Import Notion and Google Docs"],
    },
    {
        title: "Brainly reads it",
        text: "In the background it pulls out what's inside, so a video is as searchable as an article.",
        points: ["Transcribes what's said in reels and videos", "Reads scanned PDFs and screenshots", "Writes a two-line summary and tags"],
    },
    {
        title: "Ask, and get it back",
        text: "Ask a question or just search. Every answer comes only from your saves and says where it came from.",
        points: ["Numbered sources you can click", "Watch reels and videos inline", "Follow-ups like \"more like that\""],
    },
];

export function HowItWorks() {
    return (
        <section id="how" className={block}>
            <Wrap>
                <SectionHead eyebrow="How it works" title="Save it once. Brainly does the reading." />
                <div className="grid border-t border-lp-ink min-[900px]:grid-cols-3">
                    {STEPS.map((step, i) => (
                        <div
                            key={step.title}
                            className={`grid min-w-0 content-start gap-3.5 border-b border-lp-rule py-6 min-[900px]:border-b-0 min-[900px]:pt-[26px] min-[900px]:pr-7 min-[900px]:pb-[30px] ${i ? "min-[900px]:border-l min-[900px]:pl-7" : ""}`}
                        >
                            <span className="text-xs tracking-[0.06em] text-lp-muted">STEP {i + 1}</span>
                            <h3 className={h3}>{step.title}</h3>
                            <p className="text-[15.5px] leading-[1.6] text-lp-muted">{step.text}</p>
                            <ul className="m-0 grid list-none gap-1.5 p-0 text-[14.5px]">
                                {step.points.map((p) => (
                                    <li key={p}><span className="text-lp-muted">→ </span>{p}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </Wrap>
        </section>
    );
}

/* ── What you can save ───────────────────────────────────── */

const TYPES: { name: string; isNew?: boolean; icon: React.ReactNode; what: string; keeps: string }[] = [
    { name: "Instagram reels", isNew: true, icon: <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M10 9.5v5l4-2.5z" /></>, what: "The reel you'll want again in three weeks.", keeps: "Keeps the caption, the creator and a transcript of what's said." },
    { name: "YouTube & Shorts", icon: <><rect x="2.5" y="6" width="19" height="12" rx="3" /><path d="M10 9.5v5l4-2.5z" /></>, what: "Lectures, tutorials and talks.", keeps: "Keeps captions (or a transcript), title, channel and length." },
    { name: "TikTok", isNew: true, icon: <><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 4c.5 2.5 2.2 4 5 4" /></>, what: "Recipes, hacks and how-tos.", keeps: "Keeps the caption, creator and a transcript." },
    { name: "Web pages", icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>, what: "Articles, docs and LinkedIn posts.", keeps: "Keeps the article text without ads or menus, plus the preview image." },
    { name: "Posts on X", icon: <path d="M4 4l16 16M20 4L4 20" />, what: "Threads worth rereading.", keeps: "Keeps the post, author and hashtags." },
    { name: "PDFs", icon: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h4" /></>, what: "Papers, resumes and reports.", keeps: "Reads every page, including scanned ones." },
    { name: "Images", icon: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 17l-5-5-9 8" /></>, what: "Screenshots, diagrams and whiteboards.", keeps: "Reads the text in the picture and describes the rest." },
    { name: "Notes", icon: <><path d="M5 4h14v12l-4 4H5z" /><path d="M15 20v-4h4M8 9h8M8 13h5" /></>, what: "Your own thoughts, in Markdown.", keeps: "Or bring them in from Notion and Google Docs." },
    { name: "Voice notes", isNew: true, icon: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>, what: "Ideas you say out loud.", keeps: "Record in the browser or upload. Brainly writes it down." },
];

export function SaveTypes() {
    return (
        <section id="save" className={block}>
            <Wrap>
                <SectionHead eyebrow="What you can save" title="Nine kinds of things, one memory.">
                    <p className={lead}>For each one, here is what Brainly keeps so you can find it later.</p>
                </SectionHead>
                <div className="grid border-t border-l border-lp-rule min-[560px]:grid-cols-2 min-[900px]:grid-cols-3">
                    {TYPES.map((t) => (
                        <div key={t.name} className="grid min-w-0 content-start gap-2.5 border-r border-b border-lp-rule bg-lp-paper/75 px-6 pt-6 pb-[26px]">
                            <span className="flex items-center gap-[9px] text-[15px] leading-[1.2] font-semibold">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-[18px] flex-none">
                                    {t.icon}
                                </svg>
                                {t.name}
                                {t.isNew && (
                                    <span className="ml-auto px-1.5 py-1 text-[10.5px] leading-none font-normal tracking-[0.06em] text-lp-signal uppercase shadow-[inset_0_0_0_1px_var(--color-lp-signal)]">
                                        New
                                    </span>
                                )}
                            </span>
                            <p className="text-[15px] text-lp-muted">{t.what}</p>
                            <span className="text-sm leading-[1.5] text-lp-ink">{t.keeps}</span>
                        </div>
                    ))}
                </div>
            </Wrap>
        </section>
    );
}

/* ── Keeping it tidy ─────────────────────────────────────── */

const FEATURES = [
    { title: "Collections", text: "Group saves into boards like \"Portfolio ideas\" or \"Trip to Lisbon\", and share any board with a public link." },
    { title: "Rediscover", text: "Brainly brings back things you saved and forgot. Tap \"Got it\" and you'll see it less often.", intervals: ["1 day", "2 days", "4 days", "8 days", "… up to 6 months"] },
    { title: "Knowledge graph", text: "See how your saves connect. A cooking reel sits next to the recipe note it reminded you of." },
    { title: "No duplicates", text: "Saving the same reel twice? Brainly notices, even when the link looks different, and lets you merge copies." },
    { title: "Tags and stars", text: "Your own tags plus a few Brainly suggests. Star what matters, archive what doesn't." },
    { title: "Search without AI", text: "Need it fast? Search mode lists matching saves instantly and doesn't use your daily AI answers." },
];

export function Organise() {
    return (
        <section className={block}>
            <Wrap>
                <SectionHead eyebrow="Keep it tidy" title="A brain that also tidies up." />
                <div className="grid gap-x-10 gap-y-12 min-[900px]:grid-cols-3">
                    {FEATURES.map((f) => (
                        <div key={f.title} className="grid min-w-0 content-start gap-2.5">
                            <h3 className={h3}>{f.title}</h3>
                            <p className="text-[15.5px] leading-[1.6] text-lp-muted">{f.text}</p>
                            {f.intervals && (
                                <div className="mt-1 flex flex-wrap gap-1.5 text-[11.5px]" aria-label="Review intervals">
                                    {f.intervals.map((d) => (
                                        <span key={d} className="px-[7px] py-1 shadow-[inset_0_0_0_1px_var(--color-lp-line)]">{d}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Wrap>
        </section>
    );
}

/* ── FAQ ─────────────────────────────────────────────────── */

const FAQS = [
    { q: "Who can see what I save?", a: "Only you. Your files are served only to your signed-in account, and nothing is public unless you share a collection yourself. You can stop sharing at any time." },
    { q: "Does the AI make things up?", a: "Brainly answers only from what you saved and cites each source with a number you can click. If the answer isn't in your saves, it says so instead of guessing." },
    { q: "Does it work on my phone?", a: "Yes. Install Brainly from your phone's browser and it shows up in the Share menu, so you can send a reel or a link to Brainly without copying anything." },
    { q: "Can I save from my browser?", a: "The Brainly extension saves the page you're on in one click. Right-click a link to save it, or select text to save it as a note." },
    { q: "Can I bring my notes from Notion or Google Docs?", a: "Export them and drop the files in. Brainly reads Markdown, text, HTML, Word documents and Notion's zip export." },
];

export function Faq() {
    return (
        <section id="faq" className={block}>
            <Wrap>
                <SectionHead center eyebrow="Questions" title="Before you start." />
                <div className="mx-auto max-w-[820px] border-t border-lp-rule">
                    {FAQS.map((item, i) => (
                        <details key={item.q} open={i === 0} className="group border-b border-lp-rule py-5">
                            <summary className="flex cursor-pointer list-none justify-between gap-5 font-lp-display text-[1.3rem] leading-[1.3] [&::-webkit-details-marker]:hidden">
                                {item.q}
                                <span aria-hidden="true" className="font-lp-body text-lg text-lp-muted group-open:hidden">+</span>
                                <span aria-hidden="true" className="hidden font-lp-body text-lg text-lp-muted group-open:inline">–</span>
                            </summary>
                            <p className="mt-3 max-w-[64ch] text-base leading-[1.6] text-lp-muted">{item.a}</p>
                        </details>
                    ))}
                </div>
            </Wrap>
        </section>
    );
}

/* ── Closing call to action + footer ─────────────────────── */

export function Closing() {
    return (
        <section id="start" className="grid scroll-mt-6 justify-items-center border-t border-lp-rule pt-[130px] pb-[120px] text-center">
            <Wrap className="grid justify-items-center">
                <Eyebrow>Free to start</Eyebrow>
                <h2 className="mt-[22px] max-w-[14ch] font-lp-display text-[clamp(2.4rem,4.2vw,4.2rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">
                    Your memory, with a search bar.
                </h2>
                <CtaPair
                    className="mt-[34px]"
                    secondary={{ label: "Try the demo", href: "#ask" }}
                    primary={{ label: "Create your brain", href: "/auth/signup" }}
                />
            </Wrap>
        </section>
    );
}

export function LandingFooter() {
    const link = "hover:text-lp-ink";
    return (
        <footer className="border-t border-lp-rule">
            <Wrap className="flex flex-wrap items-center justify-between gap-4 py-[26px] text-[13px] text-lp-muted">
                <span>© {new Date().getFullYear()} Brainly AI</span>
                <nav aria-label="Footer" className="flex flex-wrap gap-5">
                    <a href="#how" className={link}>How it works</a>
                    <a href="#pricing" className={link}>Pricing</a>
                    <a href="#faq" className={link}>FAQ</a>
                    <Link href="/about" className={link}>About</Link>
                    <Link href="/auth/signin" className={link}>Sign in</Link>
                    <Link href="/auth/signup" className={link}>Create your brain</Link>
                </nav>
            </Wrap>
        </footer>
    );
}
