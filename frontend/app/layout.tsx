import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { dmSans, fraunces } from "./components/landing/fonts";
import { PwaSetup } from "./components/pwa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brainly AI",
  description: "Save reels, videos, links, PDFs and notes from anywhere, and find them by asking in plain words.",
  // Installable app; on Android, "Share → Brainly" from any app saves it straight away (/share)
  manifest: "/manifest.webmanifest",
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
