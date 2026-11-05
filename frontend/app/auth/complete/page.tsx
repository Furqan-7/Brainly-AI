"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeOAuth, errorMessage } from "@/app/services/api";
import { Logo } from "@/app/components/landing/ui";

/** Google/GitHub sign-in lands here with a short-lived code; we swap it for a session. */
export default function CompleteSignInPage() {
    const router = useRouter();
    const [error, setError] = useState("");

    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get("code");
        if (!code) {
            router.replace("/auth/signin");
            return;
        }
        // Remove the code from the address bar and history
        window.history.replaceState({}, "", "/auth/complete");
        completeOAuth(code)
            .then(() => router.replace("/chat"))
            .catch((e) => setError(errorMessage(e, "Sign-in didn't finish. Please try again.")));
    }, [router]);

    return (
        <div className="grid min-h-svh w-full flex-1 bg-lp-dots px-6 py-8 text-on-surface sm:px-10">
            <Logo />
            <div className="mx-auto grid max-w-[420px] content-center justify-items-center gap-5 text-center">
                {error ? (
                    <>
                        <h1 className="font-headline text-3xl font-normal">That didn&apos;t work.</h1>
                        <p className="text-on-surface-variant">{error}</p>
                        <Link href="/auth/signin" className="bg-primary-container px-5 py-3 text-sm font-medium text-white hover:bg-black">Back to sign in</Link>
                    </>
                ) : (
                    <>
                        <Loader2 className="size-6 animate-spin text-on-surface-variant" />
                        <p className="text-on-surface-variant">Signing you in…</p>
                    </>
                )}
            </div>
        </div>
    );
}
