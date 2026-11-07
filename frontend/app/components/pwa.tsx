"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Installing Brainly as an app. Chrome only puts "Install app" in its menu in some versions
 * (newer ones hide it under "Add to home screen"), so Brainly offers its own Install button
 * using the browser's install prompt where there is one, and instructions where there isn't.
 */

interface InstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
    installed = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault(); // keep it for our own button
        deferred = e as InstallPromptEvent;
        emit();
    });
    window.addEventListener("appinstalled", () => {
        deferred = null;
        installed = true;
        emit();
    });
}

export type InstallState = "installed" | "available" | "ios" | "manual";

function snapshot(): InstallState {
    if (installed) return "installed";
    if (deferred) return "available";
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return "ios";
    return "manual";
}

/** Whether Brainly can be installed right now, and how. */
export function useInstall(): { state: InstallState; install: () => Promise<boolean> } {
    const state = useSyncExternalStore(
        (cb) => {
            listeners.add(cb);
            return () => listeners.delete(cb);
        },
        snapshot,
        () => "manual" as InstallState
    );
    const install = async () => {
        if (!deferred) return false;
        const event = deferred;
        deferred = null;
        await event.prompt();
        const { outcome } = await event.userChoice;
        emit();
        return outcome === "accepted";
    };
    return { state, install };
}

/** Registers the service worker (needed by some Chrome versions to offer installing). */
export function PwaSetup() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }, []);
    return null;
}
