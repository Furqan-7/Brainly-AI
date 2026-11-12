import Link from "next/link";
import { LandingFooter } from "../landing/Sections";
import { Logo, Wrap } from "../landing/ui";

/** Where people send privacy requests and questions about these pages */
export const CONTACT_EMAIL = "brainlyai.me@gmail.com";
/** Shown at the top of both pages; change it whenever either page changes */
export const LAST_UPDATED = "13 November 2026";

export function Mail() {
    return (
        <a href={`mailto:${CONTACT_EMAIL}`} className="underline decoration-lp-line underline-offset-4 hover:decoration-lp-ink">
            {CONTACT_EMAIL}
        </a>
    );
}

/** One numbered section, linkable from the contents list (#id) */
export function Clause({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="grid scroll-mt-24 gap-3">
            <h2 className="font-lp-display text-[1.55rem] leading-tight font-normal tracking-[-0.015em]">{title}</h2>
            <div className="legal-body grid gap-3 text-[15.5px] leading-[1.7] text-lp-ink/85">{children}</div>
        </section>
    );
}

function Contents({ sections }: { sections: { id: string; title: string }[] }) {
    return (
        <ol className="m-0 grid list-none gap-2 p-0 text-[14px]">
            {sections.map((s) => (
                <li key={s.id}>
                    <a href={`#${s.id}`} className="text-lp-muted hover:text-lp-ink">{s.title}</a>
                </li>
            ))}
        </ol>
    );
}

/**
 * Privacy Policy and Terms of Service: plain-language pages in the landing page's style, with a
 * contents list and links between the two.
 */
export function LegalPage({
    eyebrow,
    title,
    intro,
    sections,
    other,
    children,
}: {
    eyebrow: string;
    title: string;
    intro: React.ReactNode;
    sections: { id: string; title: string }[];
    other: { href: string; label: string };
    children: React.ReactNode;
}) {
    return (
        <div data-landing className="min-h-screen w-full flex-1 bg-lp-dots font-lp-body text-base text-lp-ink [color-scheme:light]">
            <header className="border-b border-lp-rule">
                <Wrap className="flex items-center justify-between gap-4 py-5">
                    <Logo />
                    <Link href={other.href} className="text-[14px] text-lp-muted underline decoration-lp-line underline-offset-4 hover:text-lp-ink">
                        {other.label}
                    </Link>
                </Wrap>
            </header>

            <main>
                <Wrap className="grid gap-12 py-10 md:grid-cols-[220px_1fr] md:gap-16 md:py-20">
                    {/* Contents: a sticky list beside the text on wide screens, a collapsed menu on phones */}
                    <aside className="hidden md:sticky md:top-8 md:block md:self-start">
                        <p className="mb-3 text-[12px] tracking-[0.06em] text-lp-muted uppercase">On this page</p>
                        <Contents sections={sections} />
                    </aside>

                    <article className="grid max-w-[720px] min-w-0 gap-10">
                        <div className="grid gap-4">
                            <span className="w-fit rounded-md bg-lp-chip px-2.5 py-2 text-[13px] leading-none tracking-[0.04em] uppercase">{eyebrow}</span>
                            <h1 className="font-lp-display text-[clamp(2.3rem,5vw,3.6rem)] leading-[1.03] font-normal tracking-[-0.025em]">{title}</h1>
                            <p className="text-[14px] text-lp-muted">Last updated {LAST_UPDATED}</p>
                            <div className="text-[17px] leading-[1.65] text-lp-ink/85">{intro}</div>
                        </div>
                        <details className="rounded-xl border border-lp-line bg-lp-card px-4 py-3 md:hidden">
                            <summary className="cursor-pointer text-[14px] font-medium">On this page</summary>
                            <div className="pt-3">
                                <Contents sections={sections} />
                            </div>
                        </details>
                        {children}
                    </article>
                </Wrap>
            </main>

            <LandingFooter />
        </div>
    );
}
