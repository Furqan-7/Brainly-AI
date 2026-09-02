import OpenAI from "openai";
import { config } from "dotenv";

config();


const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export async function GetLLMResponse(
    prompt: string
) {

    try {

        const completion = await client.chat.completions.create({
            model: "qwen/qwen3.6-27b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 500,
            temperature: 0.3,
            reasoning_effort: "none", // disables thinking mode
        } as any);

        return completion
            .choices[0]
            .message.content;

    } catch (error) {

        console.error(
            "Groq Error:",
            error
        );

        return "Failed to generate response";
    }
}