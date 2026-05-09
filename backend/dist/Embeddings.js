"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmbeddings = GetEmbeddings;
const axios_1 = __importDefault(require("axios"));
async function GetEmbeddings(content) {
    const Response = await axios_1.default.post("http://localhost:11434/api/embeddings", {
        headers: {
            "Content-Type": "application/json"
        },
        model: "nomic-embed-text",
        prompt: content,
    });
    return Response.data.embedding;
}
//# sourceMappingURL=Embeddings.js.map