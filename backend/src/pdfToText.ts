import fs from 'node:fs/promises';
import * as pdfParse from "pdf-parse";

export async function GetPdfText(file_path: string): Promise<string> {
    console.log("pdfToText file path:" + file_path);
    const dataBuffer = await fs.readFile(file_path);
    //@ts-ignore
    const data = await pdfParse.default(dataBuffer);
    return data.text;
}