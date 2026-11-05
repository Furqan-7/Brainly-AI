"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "../../services/api";

/** Signed-in visitors skip the marketing page and go straight to their brain. */
export function SessionRedirect() {
    const router = useRouter();
    useEffect(() => {
        getMe()
            .then(() => router.replace("/chat"))
            .catch(() => undefined); // not signed in: stay on the landing page
    }, [router]);
    return null;
}
