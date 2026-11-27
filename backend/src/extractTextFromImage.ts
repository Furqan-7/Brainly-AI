import { createWorker } from "tesseract.js";
import { log } from "./lib/logger";

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

// Generous: the first call also downloads the English language data (~10MB)
const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS ?? 60_000);

/**
 * One shared Tesseract worker (started on first use, jobs queue on it), created with an
 * errorHandler: without one, Tesseract rethrows a failure, such as its language data failing to
 * download, inside its message handler, where no try/catch reaches it, and the server crashes.
 */
let shared: Promise<OcrWorker> | null = null;

function getWorker(): Promise<OcrWorker> {
    if (!shared) {
        const starting = createWorker("eng", undefined, {
            errorHandler: (error: unknown) => log("warn", "ocr worker error", { error: String(error) }),
        });
        shared = starting;
        starting.catch(() => {
            if (shared === starting) shared = null; // try again next time
        });
    }
    return shared;
}

function timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(`OCR took longer than ${ms}ms`)), ms).unref());
}

/** OCR an image. Returns "" when it can't (the caller then asks the AI to describe the image). */
export async function extractTextFromImage(file_path: string): Promise<string> {
    const pending = getWorker();
    try {
        const run = pending.then((worker) => worker.recognize(file_path));
        const { data: { text } } = await Promise.race([run, timeout(OCR_TIMEOUT_MS)]);
        return text.trim();
    } catch (error) {
        log("warn", "ocr failed", { error: String(error) });
        // A worker that hangs or breaks is replaced on the next call; shut it down if it ever starts
        if (shared === pending) {
            shared = null;
            pending.then((worker) => worker.terminate()).catch(() => undefined);
        }
        return "";
    }
}
