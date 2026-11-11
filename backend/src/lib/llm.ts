import OpenAI from "openai";

// Groq exposes an OpenAI-compatible API; one client is shared by every LLM call.
export const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

/**
 * Groq retires models from time to time (qwen3.6-27b was removed, which broke every answer).
 * Both can be changed without a deploy through env vars, and a removed model falls back.
 */
export const ANSWER_MODEL = process.env.GROQ_ANSWER_MODEL || "qwen/qwen3.8-27b";
export const ANSWER_FALLBACK_MODEL = process.env.GROQ_ANSWER_FALLBACK_MODEL || "openai/gpt-oss-120b";
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

/** Settings per model: Qwen turns its thinking off with "none"; gpt-oss only accepts low, medium or high. */
function answerOptions(model: string) {
    return { model, max_tokens: 700, temperature: 0.3, reasoning_effort: model.startsWith("openai/gpt-oss") ? "low" : "none" };
}

/** True when Groq says the model doesn't exist (renamed or retired), as opposed to a passing outage */
export function isModelGone(error: unknown): boolean {
    const e = error as { status?: number; code?: string; message?: string } | null;
    return e?.status === 404 || e?.code === "model_not_found" || /does not exist|decommissioned|model_not_found/i.test(e?.message ?? "");
}

/** The answer model, then the fallback if Groq says the first one is gone */
const answerModels = () => [...new Set([ANSWER_MODEL, ANSWER_FALLBACK_MODEL])];

/** Streams answer tokens; yields text deltas as they arrive. */
export async function* streamAnswer(messages: ChatMessage[]): AsyncGenerator<string> {
    const models = answerModels();
    for (const [i, model] of models.entries()) {
        let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
        try {
            stream = await groq.chat.completions.create({ ...answerOptions(model), messages, stream: true } as any) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
        } catch (error) {
            if (i < models.length - 1 && isModelGone(error)) {
                console.error(`Answer model ${model} is unavailable, falling back to ${models[i + 1]}:`, (error as Error).message);
                continue;
            }
            throw error;
        }
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) yield delta;
        }
        return;
    }
}

/** The whole answer in one response (browser extension, API clients), with the same fallback */
export async function completeAnswer(messages: ChatMessage[]): Promise<string> {
    const models = answerModels();
    for (const [i, model] of models.entries()) {
        try {
            const completion = await groq.chat.completions.create({ ...answerOptions(model), messages } as any);
            return (completion as OpenAI.Chat.Completions.ChatCompletion).choices[0]?.message?.content ?? "";
        } catch (error) {
            if (i < models.length - 1 && isModelGone(error)) {
                console.error(`Answer model ${model} is unavailable, falling back to ${models[i + 1]}:`, (error as Error).message);
                continue;
            }
            throw error;
        }
    }
    return "";
}
