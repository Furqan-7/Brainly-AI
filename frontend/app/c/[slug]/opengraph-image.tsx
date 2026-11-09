import { fetchPublicCollection } from "../../lib/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../../lib/ogImage";

export const alt = "A shared Brainly AI collection";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Preview card for a shared collection, showing its name, description and owner. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const collection = await fetchPublicCollection(slug);
    if (!collection) {
        return renderOgImage({ eyebrow: "Shared collection", title: "A shared Brainly collection" });
    }
    return renderOgImage({
        eyebrow: "Shared collection",
        title: collection.name,
        subtitle: collection.description ?? undefined,
        footer: `Shared by ${collection.owner} · ${collection.count} ${collection.count === 1 ? "item" : "items"}`,
    });
}
