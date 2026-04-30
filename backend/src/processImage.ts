import { string } from "zod";
import { extractTextFromImage } from "./extractTextFromImage";
import { describeImage } from "./describeImage";

export async function processImage(file_path: string): Promise<string> {
    const ocrText = await extractTextFromImage(file_path);

    if (ocrText.length > 50) {
        return ocrText;
    }
    else {
        return await describeImage(file_path);
    }
}