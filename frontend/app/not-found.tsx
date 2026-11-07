import Image from "next/image";
import Link from "next/link";
import { Logo } from "./components/landing/ui";

export default function NotFound() {
    return (
        <div className="grid min-h-svh w-full flex-1 bg-lp-dots px-6 py-8 text-on-surface sm:px-10">
            <Logo />
            <div className="mx-auto grid max-w-[1000px] items-center gap-10 py-12 md:grid-cols-[1fr_1.1fr]">
                <div className="grid gap-5">
                    <span className="rounded-md w-fit bg-surface-container-high px-2.5 py-1.5 text-[12px] leading-none tracking-[0.05em] uppercase">Error 404</span>
                    <h1 className="font-headline text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.02] font-normal tracking-[-0.03em]">This page slipped our mind.</h1>
                    <p className="max-w-[42ch] text-[16px] leading-[1.6] text-on-surface-variant">
                        The link may be old, or the page was moved. Everything you saved is safe.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/chat" className="rounded-xl bg-primary-container px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-black">Go to your brain</Link>
                        <Link href="/" className="rounded-xl px-5 py-3 text-sm font-medium shadow-[inset_0_0_0_1px_var(--color-outline-variant)] transition-colors hover:bg-surface-container-high">Home page</Link>
                    </div>
                </div>
                <div className="overflow-hidden rounded-[26px] border border-outline-variant bg-surface-container-lowest p-2">
                    <Image src="/art/arch-eye.webp" alt="Collage of a giant marble eye inside a concrete arch, with a person reading in front" width={489} height={365} className="h-auto w-full rounded-[20px]" priority />
                </div>
            </div>
        </div>
    );
}
