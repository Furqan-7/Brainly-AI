import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { dmSans, fraunces } from "./components/landing/fonts";
import { PwaSetup } from "./components/pwa";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "./lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Link previews need absolute URLs; relative ones below (and the og/twitter images) resolve against this
  metadataBase: new URL(SITE_URL),
  title: "Brainly AI",
  description: "Save reels, videos, links, PDFs and notes from anywhere, and find them by asking in plain words.",
  applicationName: SITE_NAME,
  // Installable app; on Android, "Share → Brainly" from any app saves it straight away (/share)
  manifest: "/manifest.webmanifest",
  // The card shown when a link is pasted into X, LinkedIn, Slack, iMessage…
  // Images come from app/opengraph-image.tsx and app/twitter-image.tsx.
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#faf5f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaSetup />
        {children}
      </body>
    </html>
  );
}
