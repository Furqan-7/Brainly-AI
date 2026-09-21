"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeImage = describeImage;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function describeImage(file_path) {
    const imageBase64 = fs_1.default.readFileSync(file_path).toString("base64");
    try {
        const response = await axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [
                {
                    parts: [
                        {
                            text: "Describe this image in detail and extract all visible text."
                        },
                        {
                            inline_data: {
                                mime_type: "image/png",
                                data: imageBase64
                            }
                        }
                    ]
                }
            ]
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data.candidates[0].content.parts[0].text;
    }
    catch (error) {
        console.log("Error in describeImage" + error);
        return "";
    }
}
//# sourceMappingURL=describeImage.js.map