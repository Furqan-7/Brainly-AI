import type { Metadata } from "next";
import { Hero } from "./components/landing/Hero";
import { AskDemo } from "./components/landing/AskDemo";
import { Pricing } from "./components/landing/Pricing";
import { LandingFooter } from "./components/landing/Sections";
import { Faq } from "./components/landing/Faq";
import { Closing } from "./components/landing/Closing";
import { Organise } from "./components/landing/Organise";
import { SaveTypes } from "./components/landing/SaveTypes";
import { HowItWorks } from "./components/landing/HowItWorks";
import { Problem } from "./components/landing/Problem";
import { SessionRedirect } from "./components/landing/SessionRedirect";
import { ScrollProgress, SmoothScroll } from "./components/landing/motion";
import { SITE_DESCRIPTION, SITE_TITLE } from "./lib/site";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div
      data-landing
      className={`min-h-screen w-full flex-1 bg-lp-dots font-lp-body text-base text-lp-ink [color-scheme:light] selection:bg-lp-ink selection:text-lp-paper`}
    >
      <SessionRedirect />
      <SmoothScroll />
      <ScrollProgress />
      <Hero />
      <main>
        <Problem />
        <AskDemo />
        <HowItWorks />
        <SaveTypes />
        <Organise />
        <Pricing />
        <Faq />
        <Closing />
      </main>
      <LandingFooter />
    </div>
  );
}
