import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import os from "node:os";
import path from "node:path";
import { Response } from "express";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Where uploaded files live. Set S3_BUCKET (plus S3_REGION / S3_ENDPOINT / S3_ACCESS_KEY_ID /
 * S3_SECRET_ACCESS_KEY) to use S3 or any S3-compatible store such as Cloudflare R2;
 * otherwise files go to backend/uploads on local disk.
 *
 * Memories.file_path is "uploads/<name>" for local files and "s3:<key>" for S3 objects.
 */

const BACKEND_ROOT = path.resolve(__dirname, "../..");
const UPLOAD_DIR = path.join(BACKEND_ROOT, "uploads");
export const TMP_UPLOAD_DIR = path.join(os.tmpdir(), "brainly-uploads");

const bucket = process.env.S3_BUCKET;
const s3 = bucket
    ? new S3Client({
        region: process.env.S3_REGION ?? "auto",
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: Boolean(process.env.S3_ENDPOINT),
        credentials: process.env.S3_ACCESS_KEY_ID
            ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" }
            : undefined,
    })
    : null;

export async function ensureUploadDirs() {
    await fs.mkdir(TMP_UPLOAD_DIR, { recursive: true });
    if (!s3) await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

function storedName(originalName: string) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(originalName).toLowerCase()}`;
}

/** Moves a freshly uploaded temp file into permanent storage and returns its file_path. */
export async function persistUpload(tmpPath: string, originalName: string, mimeType: string): Promise<string> {
    const name = storedName(originalName);
    if (s3) {
        const key = `uploads/${name}`;
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: await fs.readFile(tmpPath), ContentType: mimeType }));
        await fs.rm(tmpPath, { force: true });
        return `s3:${key}`;
    }
    await fs.rename(tmpPath, path.join(UPLOAD_DIR, name)).catch(async () => {
        // rename fails across devices (tmp on another volume) — fall back to copy
        await fs.copyFile(tmpPath, path.join(UPLOAD_DIR, name));
        await fs.rm(tmpPath, { force: true });
    });
    return `uploads/${name}`;
}

function localPath(filePath: string) {
    const resolved = path.resolve(BACKEND_ROOT, filePath);
    if (!resolved.startsWith(UPLOAD_DIR + path.sep)) throw new Error("Invalid file path");
    return resolved;
}

/** Runs `fn` with a path on local disk, downloading the object first when it lives in S3. */
export async function withLocalFile<T>(filePath: string, fn: (localFile: string) => Promise<T>): Promise<T> {
    if (!filePath.startsWith("s3:")) return fn(localPath(filePath));

    const key = filePath.slice(3);
    const tmp = path.join(TMP_UPLOAD_DIR, `dl-${Date.now()}${path.extname(key)}`);
    const obj = await s3!.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    await fs.writeFile(tmp, Buffer.from(await obj.Body!.transformToByteArray()));
    try {
        return await fn(tmp);
    } finally {
        await fs.rm(tmp, { force: true });
    }
}

/** Opens a stored file for reading (streamed from disk or S3, never loaded whole into memory). */
export async function openStoredFile(filePath: string): Promise<Readable> {
    if (filePath.startsWith("s3:")) {
        const obj = await s3!.send(new GetObjectCommand({ Bucket: bucket, Key: filePath.slice(3) }));
        return obj.Body as Readable;
    }
    const local = localPath(filePath);
    await fs.access(local);
    return createReadStream(local);
}

export async function deleteStoredFile(filePath: string | null | undefined) {
    if (!filePath) return;
    try {
        if (filePath.startsWith("s3:")) {
            await s3?.send(new DeleteObjectCommand({ Bucket: bucket, Key: filePath.slice(3) }));
        } else {
            await fs.rm(localPath(filePath), { force: true });
        }
    } catch (error) {
        console.error("Failed to delete stored file", filePath, error);
    }
}

/** Sends the file to the client: streamed from disk, or a short-lived signed S3 URL. */
export async function sendStoredFile(res: Response, filePath: string) {
    if (filePath.startsWith("s3:")) {
        const url = await getSignedUrl(s3!, new GetObjectCommand({ Bucket: bucket, Key: filePath.slice(3) }), { expiresIn: 300 });
        return res.redirect(url);
    }
    return res.sendFile(localPath(filePath));
}
