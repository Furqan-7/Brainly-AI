import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXT: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".heic": "image/heic",
    ".pdf": "application/pdf",
};

export function mimeFromPath(filePath: string): string {
    return MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/** Asks Gemini to read a file (image or PDF) and return text. Returns "" on failure. */
export async function geminiExtract(filePath: string, prompt: string): Promise<string> {
    if (!process.env.GEMINI_API_KEY) return "";
    try {
        const data = (await fs.readFile(filePath)).toString("base64");
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
            { contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeFromPath(filePath), data } }] }] },
            { headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY }, timeout: 120000 }
        );
        return response.data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("\n").trim() ?? "";
    } catch (error) {
        console.error("Gemini extract error:", error instanceof Error ? error.message : error);
        return "";
    }
}
