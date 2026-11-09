import type { Metadata } from "next";
import { SITE_NAME, fetchPublicCollection } from "../../lib/site";

/**
 * The collection page renders in the browser, but link-preview crawlers (X, LinkedIn, Slack…)
 * don't run JavaScript, so the collection's title and description are set here on the server.
 */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const collection = await fetchPublicCollection(slug);
    if (!collection) {
        return { title: `Shared collection · ${SITE_NAME}`, robots: { index: false } };
    }

    const title = `${collection.name} · ${SITE_NAME}`;
    const description =
        collection.description ||
        `${collection.count} ${collection.count === 1 ? "item" : "items"} shared by ${collection.owner} on ${SITE_NAME}.`;
    return {
        title,
        description,
        alternates: { canonical: `/c/${slug}` },
        openGraph: { title, description, url: `/c/${slug}`, siteName: SITE_NAME, type: "website" },
        twitter: { card: "summary_large_image", title, description },
    };
}

export default function PublicCollectionLayout({ children }: { children: React.ReactNode }) {
    return children;
}
