import fs from 'node:fs/promises';
const pdf = require("pdf-parse");

export async function GetPdfText(file_path: string) {
    const dataBuffer = await fs.readFile(file_path);
    const data = await pdf(dataBuffer);
    console.log(data.text);
}