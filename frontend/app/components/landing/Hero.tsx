import Link from "next/link";
import { Logo } from "./ui";
import { CtaPair, HeroArt, HeroFade, HeroHeadline } from "./motion";
import { HeroSaves } from "./HeroSaves";
import { BrandLogo, type LogoName } from "./logos";

const SOURCES: [LogoName, string][] = [
    ["Instagram", "#E4405F"],
    ["YouTube", "#FF0000"],
    ["TikTok", "#000000"],
    ["X", "#000000"],
    ["LinkedIn", "#0A66C2"],
    ["Notion", "#000000"],
    ["GoogleDocs", "#4285F4"],
];

const navLink = "text-[15px] text-lp-muted transition-colors hover:text-lp-ink";

/** First screen: the "Creation of Adam" composition with Brainly's pitch in the middle. */
export function Hero() {
    return (
        <header
            id="top"
            className="relative isolate grid min-h-svh grid-rows-[auto_1fr] overflow-hidden pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]"
        >
            {/* Robot reaching down from the top-right, Adam reclining bottom-left */}
            <HeroArt />
            {/* saves floating up toward the robot's hand (wide screens only) */}
            <HeroSaves />

            <nav className="relative z-[2] pt-[30px] md:pl-[max(0px,calc(9vw-16px))]">
                <HeroFade delay={0} className="flex items-center gap-14">
                    <Logo />
                    <span className="hidden items-center gap-7 md:flex">
                        <a href="#how" className={navLink}>How it works</a>
                        <a href="#save" className={navLink}>What you can save</a>
                        <a href="#pricing" className={navLink}>Pricing</a>
                        <a href="#faq" className={navLink}>FAQ</a>
                        <Link href="/auth/signin" className="text-[15px] text-lp-ink underline decoration-lp-line underline-offset-4 transition-colors hover:decoration-lp-ink">Sign in</Link>
                    </span>
                </HeroFade>
            </nav>

            <div className="relative z-[2] grid content-center justify-items-center pt-[70px] pb-[74vw] text-center md:pt-10 md:pb-[120px]">
                <HeroFade delay={0.2}>
                    <p className="mb-[22px] rounded-md bg-lp-chip px-[0.7em] py-[0.55em] font-lp-body text-[clamp(13px,1.05vw,17px)] leading-none tracking-[0.02em] uppercase">
                        <span className="text-lp-shimmer animate-lp-shimmer motion-reduce:animate-none">Your second brain — now saves reels</span>
                    </p>
                </HeroFade>

                <HeroHeadline
                    text="Remember everything you save."
                    className="max-w-[9ch] font-lp-display text-[clamp(2.5rem,3.3vw,4.2rem)] leading-[0.98] font-normal tracking-[-0.03em] md:max-w-none md:leading-[1.04] md:whitespace-nowrap"
                />

                <HeroFade delay={0.75} className="grid justify-items-center">
                    <p className="mt-[26px] max-w-[46ch] font-lp-body text-[clamp(14px,1.12vw,20px)] leading-[1.38] tracking-[0.01em] text-balance text-lp-muted">
                        Save reels, videos, links, PDFs and notes from anywhere. Ask in plain words and Brainly brings back the exact one.
                    </p>
                </HeroFade>

                <HeroFade delay={0.95}>
                    <CtaPair
                        className="mt-[38px] mb-[22px]"
                        secondary={{ label: "See how it works", href: "#how" }}
                        primary={{ label: "Create your brain", href: "/auth/signup" }}
                    />
                </HeroFade>

                <HeroFade delay={1.1}>
                    <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-lp-body text-[clamp(13px,1vw,16px)] text-lp-muted">
                        <span className="flex items-center gap-3">
                            Saves from
                            <span className="flex items-center gap-3" aria-label="Instagram, YouTube, TikTok, X, LinkedIn, Notion and Google Docs">
                                {SOURCES.map(([name, color]) => <BrandLogo key={name} name={name} color={color} className="size-[17px]" />)}
                            </span>
                        </span>
                        <span aria-hidden="true" className="hidden h-4 w-px bg-lp-line min-[480px]:block" />
                        <span>Free to start · no card needed</span>
                    </p>
                </HeroFade>
            </div>
        </header>
    );
}
