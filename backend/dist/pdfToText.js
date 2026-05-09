"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPdfText = GetPdfText;
const promises_1 = __importDefault(require("node:fs/promises"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
async function GetPdfText(file_path) {
    console.log("pdfToText file path:" + file_path);
    const dataBuffer = await promises_1.default.readFile(file_path);
    try {
        const data = await (0, pdf_parse_1.default)(dataBuffer);
        return data.text;
    }
    catch (error) {
        console.log("Failed to Parse Pdf " + error);
        return "";
    }
}
//# sourceMappingURL=pdfToText.js.map