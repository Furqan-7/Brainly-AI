import axios from "axios";

type TaskType = "search_document" | "search_query";

async function embed(texts: string[], taskType: TaskType): Promise<number[][]> {
    const response = await axios.post(
        "https://api-atlas.nomic.ai/v1/embedding/text",
        {
            model: "nomic-embed-text-v1.5",
            texts,
            task_type: taskType,
        },
        {
            headers: {
                "Authorization": `Bearer ${process.env.NOMIC_API_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        }
    );
    return response.data.embeddings;
}

export async function GetEmbeddings(content: string, taskType: TaskType = "search_document"): Promise<number[]> {
    return (await embed([content], taskType))[0];
}

/** Embeds many texts with as few API calls as possible. */
export async function GetEmbeddingsBatch(texts: string[], taskType: TaskType = "search_document"): Promise<number[][]> {
    const BATCH = 32;
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += BATCH) {
        out.push(...(await embed(texts.slice(i, i + BATCH), taskType)));
    }
    return out;
}
