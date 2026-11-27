import { safeGet } from "../lib/safeFetch";
import { persistBuffer } from "../lib/storage";
import { fetchReelPage } from "./reel";
import { fetchTikTokOembed } from "./tiktok";

/**
 * Instagram and TikTok thumbnails can't be shown straight from their CDNs: the links are signed
 * and expire within days, and Instagram's CDN sends `Cross-Origin-Resource-Policy: same-origin`,
 * which stops browsers from drawing them on any other site. So we keep our own copy and serve it.
 */
export const STORED_THUMBNAIL_TYPES = new Set(["reel", "tiktok"]);

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif", "image/heic": ".heic" };

/** Downloads an image and stores it; returns the stored file_path, or null if it isn't an image. */
export async function saveThumbnail(imageUrl: string | null | undefined): Promise<string | null> {
    if (!imageUrl) return null;
    try {
        const res = await safeGet<ArrayBuffer>(imageUrl, {
            responseType: "arraybuffer",
            maxContentLength: MAX_THUMBNAIL_BYTES,
            headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
        });
        const mime = String(res.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
        if (!mime.startsWith("image/")) return null;
        const data = Buffer.from(res.data);
        if (data.length === 0) return null;
        return await persistBuffer(data, EXT[mime] ?? ".jpg", mime, "thumbnails");
    } catch (error) {
        console.log("Could not save thumbnail " + (error instanceof Error ? error.message : error));
        return null;
    }
}

/** A thumbnail link fresh from the source, for when the one saved at ingest has expired. */
export async function freshThumbnailUrl(type: string, sourceUrl: string | null): Promise<string | null> {
    if (!sourceUrl) return null;
    if (type === "reel") return (await fetchReelPage(sourceUrl)).thumbnail;
    if (type === "tiktok") return (await fetchTikTokOembed(sourceUrl)).thumbnail;
    return null;
}
