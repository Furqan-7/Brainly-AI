"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmbeddings = GetEmbeddings;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
async function GetEmbeddings(content, taskType = "search_document") {
    const response = await axios_1.default.post("https://api-atlas.nomic.ai/v1/embedding/text", {
        model: "nomic-embed-text-v1.5",
        texts: [content],
        task_type: taskType,
    }, {
        headers: {
            "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
            "Content-Type": "application/json",
        },
    });
    return response.data.embeddings[0];
}
//# sourceMappingURL=Embeddings.js.map