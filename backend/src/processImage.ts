import { extractTextFromImage } from "./extractTextFromImage";
import { geminiExtract } from "./ingest/gemini";

export async function processImage(file_path: string): Promise<string> {
    const ocrText = await extractTextFromImage(file_path);

    if (ocrText.length > 50) {
        return ocrText;
    }
    return await geminiExtract(file_path, "Describe this image in detail and extract all visible text.");
}
