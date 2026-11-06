"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, isAuthError } from "../services/api";
import type { Me } from "../types/memory";

/**
 * Loads the signed-in user from the session cookie. With `required`, redirects to the
 * sign-in page when there is no valid session.
 */
export function useAuth({ required = true }: { required?: boolean } = {}) {
    const router = useRouter();
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setMe(await getMe());
        } catch (err) {
            setMe(null);
            if (required && isAuthError(err)) router.replace("/auth/signin");
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
                if (required && isAuthError(err)) router.replace("/auth/signin");
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [required, router]);

    return { me, loading, refresh };
}
