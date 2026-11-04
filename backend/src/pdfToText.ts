import fs from 'node:fs/promises';
// The package entry runs a debug self-test when it has no parent module (e.g. under
// test runners and some bundlers), so import the library file directly.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { geminiExtract } from "./ingest/gemini";

// Below this many characters per page we assume the PDF is scanned images, not real text
const MIN_CHARS_PER_PAGE = 40;

export async function GetPdfText(file_path: string): Promise<string> {
    const dataBuffer = await fs.readFile(file_path);
    let text = "";
    let pages = 1;
    try {
        const data = await pdfParse(dataBuffer);
        text = data.text.trim();
        pages = Math.max(1, data.numpages);
    } catch (error) {
        console.log("Failed to Parse Pdf " + error);
    }

    if (text.length / pages >= MIN_CHARS_PER_PAGE) return text;

    console.log("PDF looks scanned — running OCR via Gemini");
    const ocr = await geminiExtract(
        file_path,
        "This PDF is scanned. Transcribe all of its text faithfully, page by page, keeping headings and lists. Describe any important figures briefly."
    );
    return ocr || text;
}
