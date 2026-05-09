"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = processImage;
const extractTextFromImage_1 = require("./extractTextFromImage");
const describeImage_1 = require("./describeImage");
async function processImage(file_path) {
    const ocrText = await (0, extractTextFromImage_1.extractTextFromImage)(file_path);
    if (ocrText.length > 50) {
        return ocrText;
    }
    else {
        return await (0, describeImage_1.describeImage)(file_path);
    }
}
//# sourceMappingURL=processImage.js.map