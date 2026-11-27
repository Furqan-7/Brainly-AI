import { beforeEach, describe, expect, it, vi } from "vitest";

const safeGet = vi.fn();
const persistBuffer = vi.fn();
vi.mock("../src/lib/safeFetch", () => ({ safeGet: (...args: unknown[]) => safeGet(...args) }));
vi.mock("../src/lib/storage", () => ({ persistBuffer: (...args: unknown[]) => persistBuffer(...args) }));

const { saveThumbnail } = await import("../src/ingest/thumbnail");

describe("saveThumbnail", () => {
    beforeEach(() => {
        safeGet.mockReset();
        persistBuffer.mockReset().mockResolvedValue("uploads/thumb.jpg");
    });

    it("stores the downloaded image under the thumbnails prefix", async () => {
        safeGet.mockResolvedValue({ headers: { "content-type": "image/jpeg" }, data: new Uint8Array([1, 2, 3]).buffer });
        await expect(saveThumbnail("https://scontent.cdninstagram.com/v/t51/abc.jpg?oe=1")).resolves.toBe("uploads/thumb.jpg");
        expect(persistBuffer).toHaveBeenCalledWith(expect.any(Buffer), ".jpg", "image/jpeg", "thumbnails");
    });

    it("skips responses that aren't images", async () => {
        safeGet.mockResolvedValue({ headers: { "content-type": "text/html" }, data: new Uint8Array([60]).buffer });
        await expect(saveThumbnail("https://example.com/login")).resolves.toBeNull();
        expect(persistBuffer).not.toHaveBeenCalled();
    });

    it("returns null when the link has expired or there is none", async () => {
        safeGet.mockRejectedValue(new Error("Request failed with status code 403"));
        await expect(saveThumbnail("https://scontent.cdninstagram.com/expired.jpg")).resolves.toBeNull();
        await expect(saveThumbnail(null)).resolves.toBeNull();
    });
});
