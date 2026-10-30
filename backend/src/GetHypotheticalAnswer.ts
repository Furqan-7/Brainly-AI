// GetHypotheticalAnswer.ts
import { groq, FAST_MODEL } from "./lib/llm";

export async function GetHypotheticalAnswer(question: string): Promise<string> {
    try {
        const completion = await groq.chat.completions.create({
            model: FAST_MODEL,
            messages: [
                {
                    role: "user",
                    content: `Write a short, plausible-sounding paragraph that could answer this question. It doesn't need to be factually correct — it's used only to improve semantic search.\n\nQuestion: ${question}`,
                },
            ],
            max_tokens: 150,
            reasoning_effort: "low", // gpt-oss-20b requires low/medium/high, not "none"
        });
        return completion.choices[0].message.content ?? question;
    } catch (error) {
        console.error("HyDE Error:", error);
        return question; // fallback: just use the raw question if HyDE fails
    }
}
