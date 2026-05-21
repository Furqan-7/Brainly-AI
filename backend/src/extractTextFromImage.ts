import Tesseract from "tesseract.js";

export async function extractTextFromImage(file_path: string): Promise<string> {
    try {
        const { data: { text } } = await Tesseract.recognize(file_path, "eng");
        return text.trim();
    } catch (error) {
        console.log("error in extractTextFromImage" + error);
        return "";
    }

}