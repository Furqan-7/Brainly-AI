import fs from 'node:fs/promises';
import pdfParse from "pdf-parse"

export async function GetPdfText(file_path: string): Promise<string> {
    console.log("pdfToText file path:" + file_path);
    const dataBuffer = await fs.readFile(file_path);
    try {
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.log("Failed to Parse Pdf " + error);
        return "";
    }
}