import { afterEach, describe, expect, it, vi } from "vitest";
import { ANSWER_FALLBACK_MODEL, ANSWER_MODEL, completeAnswer, groq, isModelGone, streamAnswer } from "../src/lib/llm";

const gone = Object.assign(new Error("The model `qwen/qwen3.6-27b` does not exist or you do not have access to it."), { status: 404, code: "model_not_found" });

async function* chunks(...parts: string[]) {
    for (const content of parts) yield { choices: [{ delta: { content } }] };
}

const collect = async (gen: AsyncGenerator<string>) => {
    let text = "";
    for await (const part of gen) text += part;
    return text;
};

afterEach(() => vi.restoreAllMocks());

describe("answer model", () => {
    it("recognises a removed model, but not an outage", () => {
        expect(isModelGone(gone)).toBe(true);
        expect(isModelGone(Object.assign(new Error("Service unavailable"), { status: 503 }))).toBe(false);
    });

    it("streams from the answer model, with thinking turned off", async () => {
        const create = vi.spyOn(groq.chat.completions, "create").mockResolvedValue(chunks("Build ", "this [1]") as any);
        expect(await collect(streamAnswer([{ role: "user", content: "q" }]))).toBe("Build this [1]");
        expect(create).toHaveBeenCalledOnce();
        expect(create.mock.calls[0][0]).toMatchObject({ model: ANSWER_MODEL, stream: true, reasoning_effort: "none" });
    });

    it("falls back when Groq says the model is gone", async () => {
        const create = vi.spyOn(groq.chat.completions, "create")
            .mockRejectedValueOnce(gone)
            .mockResolvedValueOnce(chunks("From the fallback") as any);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        expect(await collect(streamAnswer([{ role: "user", content: "q" }]))).toBe("From the fallback");
        // gpt-oss rejects reasoning_effort "none"
        expect(create.mock.calls[1][0]).toMatchObject({ model: ANSWER_FALLBACK_MODEL, reasoning_effort: "low" });
    });

    it("does not hide other errors behind the fallback", async () => {
        vi.spyOn(groq.chat.completions, "create").mockRejectedValue(Object.assign(new Error("Rate limited"), { status: 429 }));
        await expect(collect(streamAnswer([{ role: "user", content: "q" }]))).rejects.toThrow("Rate limited");
    });

    it("non-streaming answers fall back too", async () => {
        vi.spyOn(groq.chat.completions, "create")
            .mockRejectedValueOnce(gone)
            .mockResolvedValueOnce({ choices: [{ message: { content: "Whole answer" } }] } as any);
        vi.spyOn(console, "error").mockImplementation(() => undefined);
        expect(await completeAnswer([{ role: "user", content: "q" }])).toBe("Whole answer");
    });
});
