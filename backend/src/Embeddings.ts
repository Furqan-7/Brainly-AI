import { Ollama } from "ollama";
import axios from "axios";

export async function GetEmbeddings(content: string) {
    const Response = await axios.post("http://localhost:11434/api/embeddings", {
        headers: {
            "Content-Type": "application/json"
        },
        model: "nomic-embed-text",
        prompt: content,
    });
    return Response.data.embedding;
}