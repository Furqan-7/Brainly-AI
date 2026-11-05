import { DM_Sans, Fraunces } from "next/font/google";

/** Headline serif for the landing page. */
export const fraunces = Fraunces({
    subsets: ["latin"],
    variable: "--font-fraunces",
    axes: ["opsz"],
    display: "swap",
});

/** Body and UI text for the landing page. */
export const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
    axes: ["opsz"],
    display: "swap",
});
