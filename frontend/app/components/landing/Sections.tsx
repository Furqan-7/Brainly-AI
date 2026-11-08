import Link from "next/link";
import { Eyebrow, SectionHead, Wrap } from "./ui";
import { CtaPair, Reveal } from "./motion";

const block = "scroll-mt-6 border-t border-lp-rule py-20 min-[560px]:py-[120px]";

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
                <Reveal className="mx-auto max-w-[820px] border-t border-lp-rule">
                    {FAQS.map((item, i) => (
                        <details key={item.q} open={i === 0} className="group border-b border-lp-rule py-5">
                            <summary className="flex cursor-pointer disabled:cursor-not-allowed list-none justify-between gap-5 font-lp-display text-[1.3rem] leading-[1.3] transition-transform duration-300 hover:translate-x-1 [&::-webkit-details-marker]:hidden">
                                {item.q}
                                <span aria-hidden="true" className="grid size-7 flex-none place-items-center rounded-full font-lp-body text-lg leading-none text-lp-muted shadow-[inset_0_0_0_1px_var(--color-lp-line)] transition-transform duration-300 group-open:rotate-45">+</span>
                            </summary>
                            <p className="mt-3 max-w-[64ch] text-base leading-[1.6] text-lp-muted">{item.a}</p>
                        </details>
                    ))}
                </Reveal>
            </Wrap>
        </section>
    );
}

/* ── Closing call to action + footer ─────────────────────── */

export function Closing() {
    return (
        <section id="start" className="grid scroll-mt-6 justify-items-center border-t border-lp-rule pt-[130px] pb-[120px] text-center">
            <Reveal className="grid justify-items-center px-4">
                <Eyebrow>Free to start</Eyebrow>
                <h2 className="mt-[22px] max-w-[14ch] font-lp-display text-[clamp(2.4rem,4.2vw,4.2rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">
                    Your memory, with a search bar.
                </h2>
                <CtaPair
                    className="mt-[34px]"
                    secondary={{ label: "Try the demo", href: "#ask" }}
                    primary={{ label: "Create your brain", href: "/auth/signup" }}
                />
            </Reveal>
        </section>
    );
}

export function LandingFooter() {
    const link = "relative hover:text-lp-ink after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-lp-ink after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100";
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
