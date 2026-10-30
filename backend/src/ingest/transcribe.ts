import { execFile } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { toFile } from "openai";
import { groq, WHISPER_MODEL } from "../lib/llm";
import { assertPublicUrl, safeGet } from "../lib/safeFetch";
import { TMP_UPLOAD_DIR } from "../lib/storage";

const run = promisify(execFile);
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Groq Whisper upload limit
const YTDLP = process.env.YTDLP_PATH ?? "yt-dlp";

/** Speech-to-text for a local audio/video file via Groq Whisper. Returns "" on failure. */
export async function transcribeFile(filePath: string): Promise<string> {
    try {
        const { size } = await fsp.stat(filePath);
        if (size > MAX_AUDIO_BYTES) {
            console.warn("Audio too large to transcribe:", size);
            return "";
        }
        const result = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: WHISPER_MODEL,
            response_format: "json",
        });
        return result.text?.trim() ?? "";
    } catch (error) {
        console.error("Transcription error:", error instanceof Error ? error.message : error);
        return "";
    }
}

async function transcribeBuffer(buffer: Buffer, name: string): Promise<string> {
    try {
        const result = await groq.audio.transcriptions.create({
            file: await toFile(buffer, name),
            model: WHISPER_MODEL,
            response_format: "json",
        });
        return result.text?.trim() ?? "";
    } catch (error) {
        console.error("Transcription error:", error instanceof Error ? error.message : error);
        return "";
    }
}

let ytDlpAvailable: boolean | null = null;
async function hasYtDlp() {
    if (ytDlpAvailable === null) {
        ytDlpAvailable = await run(YTDLP, ["--version"]).then(() => true, () => false);
        if (!ytDlpAvailable) console.warn("yt-dlp not found — video transcription limited to direct media URLs");
    }
    return ytDlpAvailable;
}

/** Downloads the audio track of a video page (YouTube, Instagram, TikTok…) with yt-dlp. */
async function downloadAudio(pageUrl: string): Promise<string | null> {
    if (!(await hasYtDlp())) return null;
    try {
        await assertPublicUrl(pageUrl);
    } catch {
        return null;
    }
    await fsp.mkdir(TMP_UPLOAD_DIR, { recursive: true });
    const base = path.join(TMP_UPLOAD_DIR, `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    try {
        await run(YTDLP, [
            "-f", "ba[filesize<25M]/ba/b[filesize<25M]/b",
            "--max-filesize", "25M",
            "--no-playlist",
            "-o", `${base}.%(ext)s`,
            "--",
            pageUrl,
        ], { timeout: 120000 });
        const file = (await fsp.readdir(TMP_UPLOAD_DIR)).find((f) => f.startsWith(path.basename(base)));
        return file ? path.join(TMP_UPLOAD_DIR, file) : null;
    } catch (error) {
        console.error("yt-dlp error:", error instanceof Error ? error.message : error);
        return null;
    }
}

/**
 * Best-effort transcript of what's said in a video: yt-dlp on the page URL when available,
 * otherwise a direct media URL (e.g. Instagram's og:video) if we have one.
 */
export async function transcribeVideo(pageUrl: string, directMediaUrl?: string | null): Promise<string> {
    const audioPath = await downloadAudio(pageUrl);
    if (audioPath) {
        try {
            return await transcribeFile(audioPath);
        } finally {
            await fsp.rm(audioPath, { force: true });
        }
    }

    if (directMediaUrl) {
        try {
            const { data } = await safeGet<ArrayBuffer>(directMediaUrl, {
                responseType: "arraybuffer",
                maxContentLength: MAX_AUDIO_BYTES,
                timeout: 60000,
            });
            return await transcribeBuffer(Buffer.from(data), "video.mp4");
        } catch (error) {
            console.error("Media download error:", error instanceof Error ? error.message : error);
        }
    }
    return "";
}

/** Video duration in seconds via yt-dlp, or null when unavailable. */
export async function videoDuration(pageUrl: string): Promise<number | null> {
    if (!(await hasYtDlp())) return null;
    try {
        await assertPublicUrl(pageUrl);
        const { stdout } = await run(YTDLP, ["--print", "duration", "--no-playlist", "--skip-download", "--", pageUrl], { timeout: 30000 });
        const seconds = Number(stdout.trim());
        return Number.isFinite(seconds) ? seconds : null;
    } catch {
        return null;
    }
}
