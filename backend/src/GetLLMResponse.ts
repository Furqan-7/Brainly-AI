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

        const completion =
            await client.chat.completions.create({
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

    } catch (error) {

        console.error(
            "Groq Error:",
            error
        );

        return "Failed to generate response";
    }
}