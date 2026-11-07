import { Logo } from "./ui";
import { CtaPair, HeroArt, HeroFade, HeroHeadline } from "./motion";

const icon = "size-[15px]";

/** First screen: the "Creation of Adam" composition with Brainly's pitch in the middle. */
export function Hero() {
    return (
        <header
            id="top"
            className="relative isolate grid min-h-svh grid-rows-[auto_1fr] overflow-hidden pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]"
        >
            {/* Robot reaching down from the top-right, Adam reclining bottom-left */}
            <HeroArt />

            <nav className="relative z-[2] pt-[30px] md:pl-[max(0px,calc(9vw-16px))]">
                <HeroFade delay={0}>
                    <Logo />
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
                    <p className="mt-1.5 flex items-center gap-3 font-lp-body text-[clamp(13px,1vw,17px)] text-lp-muted">
                        <span className="flex" aria-hidden="true">
                            {[
                                <svg key="reel" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={icon}><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M10.5 9.5v5l4-2.5z" fill="currentColor" /></svg>,
                                <svg key="pdf" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={icon}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h4" /></svg>,
                                <svg key="voice" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={icon}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>,
                            ].map((svg, i) => (
                                <span key={i} className={`grid size-7 place-items-center rounded-full bg-white text-lp-ink shadow-[0_0_0_2px_var(--color-lp-paper)] ${i ? "-ml-[9px]" : ""}`}>
                                    {svg}
                                </span>
                            ))}
                        </span>
                        Free to start · no card needed
                    </p>
                </HeroFade>
            </div>
        </header>
    );
}
