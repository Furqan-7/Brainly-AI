import axios from "axios";
import { config } from "dotenv";
config();



export async function GetEmbeddings(content: string, taskType: "search_document" | "search_query" = "search_document") {
    const response = await axios.post(
        "https://api-atlas.nomic.ai/v1/embedding/text",
        {
            model: "nomic-embed-text-v1.5",
            texts: [content],
            task_type: taskType,
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data.embeddings[0];
}