"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLLMResponse = GetLLMResponse;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const client = new openai_1.default({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});
async function GetLLMResponse(prompt) {
    try {
        const completion = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        return completion
            .choices[0]
            .message.content;
    }
    catch (error) {
        console.error("Groq Error:", error);
        return "Failed to generate response";
    }
}
//# sourceMappingURL=GetLLMResponse.js.map