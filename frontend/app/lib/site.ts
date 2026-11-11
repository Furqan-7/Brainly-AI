/**
 * Public address of the web app. Link previews (X, LinkedIn, iMessage, Slack…) need absolute
 * URLs for the page and its preview image, so every metadata URL is built from this.
 * Set NEXT_PUBLIC_SITE_URL for your own deployment; on Vercel the production domain is picked up.
 */
export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://brainlyai.me")
).replace(/\/+$/, "");

/** The Express API, called directly from the server (the browser goes through the /backend proxy). */
export const BACKEND_URL = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API ?? "http://localhost:3001").replace(/\/+$/, "");

export const SITE_NAME = "Brainly AI";
export const SITE_TITLE = "Brainly AI — Remember everything you save";
export const SITE_DESCRIPTION =
    "Save reels, videos, links, PDFs and notes from anywhere. Ask in plain words and Brainly brings back the exact one.";

export type PublicCollectionSummary = { name: string; description: string | null; owner: string; count: number };

/** Server-side lookup of a shared collection, for its link preview. Null when missing or the API is down. */
export async function fetchPublicCollection(slug: string): Promise<PublicCollectionSummary | null> {
    try {
        const res = await fetch(`${BACKEND_URL}/api/public/collections/${encodeURIComponent(slug)}`, {
            next: { revalidate: 300 },
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        const { collection } = await res.json();
        if (!collection) return null;
        return {
            name: collection.name,
            description: collection.description ?? null,
            owner: collection.owner,
            count: Array.isArray(collection.memories) ? collection.memories.length : 0,
        };
    } catch {
        return null;
    }
}
