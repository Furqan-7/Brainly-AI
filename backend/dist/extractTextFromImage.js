"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromImage = extractTextFromImage;
const tesseract_js_1 = __importDefault(require("tesseract.js"));
async function extractTextFromImage(file_path) {
    try {
        const { data: { text } } = await tesseract_js_1.default.recognize(file_path, "eng");
        return text.trim();
    }
    catch (error) {
        console.log("error in extractTextFromImage" + error);
        return "";
    }
}
//# sourceMappingURL=extractTextFromImage.js.map