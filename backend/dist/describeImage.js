"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeImage = describeImage;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
async function describeImage(file_path) {
    const imageBase64 = fs_1.default.readFileSync(file_path).toString("base64");
    try {
        const response = await axios_1.default.post("http://localhost:11434/api/generate", {
            model: "llava",
            prompt: "Describe this image in detail. Extract any text you can see. What is this image about?",
            images: [imageBase64],
            stream: false,
        });
        return response.data.response;
    }
    catch (error) {
        console.log("error in describeImage" + error);
        return "";
    }
}
//# sourceMappingURL=describeImage.js.map