"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, isAuthError } from "../services/api";
import type { Me } from "../types/memory";

/**
 * Loads the signed-in user from the session cookie. With `required`, redirects to the
 * sign-in page when there is no valid session.
 */
/** Sign-in page that returns here afterwards (e.g. a link shared to Brainly while signed out). */
function signInUrl(): string {
    const here = window.location.pathname + window.location.search;
    return here === "/" || here.startsWith("/auth") ? "/auth/signin" : `/auth/signin?next=${encodeURIComponent(here)}`;
}

/** Where to go after signing in: a same-site path from ?next=, or the app. */
export function afterSignIn(): string {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith("/") && !next.startsWith("//") ? next : "/chat";
}

export function useAuth({ required = true }: { required?: boolean } = {}) {
    const router = useRouter();
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setMe(await getMe());
        } catch (err) {
            setMe(null);
            if (required && isAuthError(err)) router.replace(signInUrl());
        } finally {
            setLoading(false);
        }
    }, [required, router]);

    useEffect(() => {
        let cancelled = false;
        getMe()
            .then((data) => !cancelled && setMe(data))
            .catch((err) => {
                if (cancelled) return;
                setMe(null);
                if (required && isAuthError(err)) router.replace(signInUrl());
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [required, router]);

    return { me, loading, refresh };
}
