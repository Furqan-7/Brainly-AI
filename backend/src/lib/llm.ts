import OpenAI from "openai";

// Groq exposes an OpenAI-compatible API; one client is shared by every LLM call.
export const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

export const ANSWER_MODEL = "qwen/qwen3.6-27b";
export const FAST_MODEL = "openai/gpt-oss-20b";
export const WHISPER_MODEL = "whisper-large-v3-turbo";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Small JSON-returning helper for structured tasks (summaries, tags, query rewriting). */
export async function completeJson<T>(prompt: string, fallback: T): Promise<T> {
    try {
        const completion = await groq.chat.completions.create({
            model: FAST_MODEL,
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_tokens: 400,
            reasoning_effort: "low",
        } as any);
        const content = completion.choices[0]?.message?.content ?? "";
        return { ...fallback, ...JSON.parse(content) };
    } catch (error) {
        console.error("completeJson error:", error);
        return fallback;
    }
}

/** Streams answer tokens; yields text deltas as they arrive. */
export async function* streamAnswer(messages: ChatMessage[]): AsyncGenerator<string> {
    const stream = await groq.chat.completions.create({
        model: ANSWER_MODEL,
        messages,
        max_tokens: 700,
        temperature: 0.3,
        stream: true,
        reasoning_effort: "none",
    } as any) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
    }
}
