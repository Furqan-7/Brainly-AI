import Link from "next/link";
import { Wrap } from "./ui";

/* ── Footer ──────────────────────────────────────────────── */

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
                    <Link href="/privacy" className={link}>Privacy</Link>
                    <Link href="/terms" className={link}>Terms</Link>
                    <Link href="/auth/signin" className={link}>Sign in</Link>
                    <Link href="/auth/signup" className={link}>Create your brain</Link>
                </nav>
            </Wrap>
        </footer>
    );
}
