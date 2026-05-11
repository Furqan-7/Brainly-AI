import axios from "axios";
import { config } from "dotenv";
config();

console.log("Nomic APi Key " + process.env.NOMIC_API_KEY)

export async function GetEmbeddings(content: string) {
    const response = await axios.post(
        "https://api-atlas.nomic.ai/v1/embedding/text",
        {
            model: "nomic-embed-text-v1.5",
            texts: [content],
            task_type: "search_document",
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );
    console.log(response.data.embeddings[0]);
    return response.data.embeddings[0];
}