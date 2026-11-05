import type { Metadata } from "next";
import { dmSans, fraunces } from "./components/landing/fonts";
import { Hero } from "./components/landing/Hero";
import { AskDemo } from "./components/landing/AskDemo";
import { Pricing } from "./components/landing/Pricing";
import { Closing, Faq, HowItWorks, LandingFooter, Organise, Problem, SaveTypes } from "./components/landing/Sections";
import { SessionRedirect } from "./components/landing/SessionRedirect";

export const metadata: Metadata = {
  title: "Brainly AI — Remember everything you save",
  description:
    "Save reels, videos, links, PDFs and notes from anywhere. Ask in plain words and Brainly brings back the exact one.",
};

export default function Home() {
  return (
    <div
      data-landing
      className={`${fraunces.variable} ${dmSans.variable} min-h-screen w-full flex-1 bg-lp-dots font-lp-body text-base text-lp-ink [color-scheme:light] selection:bg-lp-ink selection:text-lp-paper`}
    >
      <SessionRedirect />
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
