// Answer streaming benchmark for POST /api/chat/stream (Server-Sent Events: meta -> token* -> done).
// Per question, from the client:
//   metaMs    request -> `meta` event (retrieval done: HyDE, embeddings, hybrid search, Cohere rerank)
//   ttftMs    request -> first `token` event (time to first token)
//   totalMs   request -> `done` event (answer saved)
//   streamMs  first token -> last token; chars/s and token events/s over that window
// It also scores the full RAG pipeline: is the relevant note among the sources, at which rank,
// and does the answer cite it ([n])? Out-of-corpus questions should get "couldn't find".
//
// tokens/s: the SSE stream carries text, not token counts, so a calibration step streams a few
// similar answers straight from Groq with usage reporting on, measures characters per token for
// the answer model, and converts chars/s to tokens/s. Needs network access to api.groq.com and
// GROQ_API_KEY (skipped otherwise; chars/s is still reported).
//   node benchmarks/streaming.mjs [gapMs=20000] [resultName=streaming]
// Groq's free tier allows 8,000 tokens/min on the answer model and one answer uses ~2,000
// (prompt + max_tokens), so a short gap trips 429s and the SDK's retry backoff inflates latency.
import { accuracy, login, memoryKeyMap, readJson, saveResult, sleep, stats } from "./lib.mjs";

const GAP_MS = Number(process.argv[2] ?? 20000); // pause between questions to stay under Groq rate limits
const RESULT_NAME = process.argv[3] ?? "streaming";
const ANSWER_MODEL = process.env.ANSWER_MODEL ?? "qwen/qwen3.8-27b";
const { questions } = await readJson("data/eval.json");
const corpus = await readJson("data/corpus.json");
const { api } = await login();
const keyOf = await memoryKeyMap(api);

/** Sends one question and reads the SSE stream, timestamping each event. */
async function ask(question) {
    const t0 = performance.now();
    const res = await api("/api/chat/stream", { method: "POST", body: JSON.stringify({ question, filters: {} }) });
    if (!res.ok || !res.body) throw new Error(`chat failed: HTTP ${res.status} ${await res.text()}`);
    const out = { meta: null, done: null, error: null, tokens: [], metaMs: null, ttftMs: null, lastTokenMs: null, totalMs: null };
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const bytes of res.body) {
        buffer += decoder.decode(bytes, { stream: true });
        let cut;
        while ((cut = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, cut);
            buffer = buffer.slice(cut + 2);
            const now = performance.now() - t0;
            const event = /^event: (.*)$/m.exec(raw)?.[1];
            const data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] ?? "null");
            if (event === "meta") { out.meta = data; out.metaMs = now; }
            if (event === "token") { out.tokens.push(data.text); out.ttftMs ??= now; out.lastTokenMs = now; }
            if (event === "done") { out.done = data; out.totalMs = now; }
            if (event === "error") out.error = data;
        }
    }
    return out;
}

const NOT_FOUND = /couldn't find/i;
const rows = [];
for (const item of questions) {
    const r = await ask(item.q);
    const sources = (r.meta?.sources ?? []).map((s) => keyOf.get(s.memoryId) ?? `other:${s.memoryId}`);
    const answer = r.done?.answer ?? r.tokens.join("");
    const chars = r.tokens.join("").length;
    const streamMs = r.lastTokenMs - r.ttftMs;
    const rank = item.expected ? sources.indexOf(item.expected) + 1 : null;
    const cited = [...answer.matchAll(/\[(\d+)\]/g)].map((m) => sources[Number(m[1]) - 1]);
    const row = {
        id: item.id, kind: item.kind, q: item.q, expected: item.expected,
        metaMs: round(r.metaMs), ttftMs: round(r.ttftMs), totalMs: round(r.totalMs), streamMs: round(streamMs),
        chars, tokenEvents: r.tokens.length,
        charsPerSec: streamMs > 0 ? round((chars / streamMs) * 1000) : null,
        tokenEventsPerSec: streamMs > 0 ? round((r.tokens.length / streamMs) * 1000) : null,
        sources, rank,
        citesExpected: item.expected ? cited.includes(item.expected) : null,
        saidNotFound: NOT_FOUND.test(answer),
        error: r.error,
        answer,
    };
    rows.push(row);
    console.log(`${item.id} meta ${row.metaMs}ms ttft ${row.ttftMs}ms total ${row.totalMs}ms ${row.charsPerSec ?? "-"} ch/s rank ${rank ?? "-"} cited ${row.citesExpected ?? "-"} notFound ${row.saidNotFound}`);
    await sleep(GAP_MS);
}

function round(n) { return n === null || n === undefined || Number.isNaN(n) ? null : Number(n.toFixed(1)); }

/** Streams a few grounded answers straight from Groq with usage on, to measure chars per token. */
async function calibrate() {
    if (!process.env.GROQ_API_KEY) return { skipped: "GROQ_API_KEY not set" };
    const samples = [];
    for (const doc of corpus.slice(0, 5)) {
        await sleep(GAP_MS);
        const t0 = performance.now();
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: ANSWER_MODEL, stream: true, stream_options: { include_usage: true },
                max_tokens: 700, temperature: 0.3, reasoning_effort: "none",
                messages: [
                    { role: "system", content: `Answer using ONLY this saved note and cite it as [1].\n\n[1] NOTE: "${doc.title}"\n${doc.note}` },
                    { role: "user", content: `Summarise the key advice in "${doc.title}".` },
                ],
            }),
        });
        if (!res.ok) return { skipped: `Groq HTTP ${res.status}` };
        let text = "", deltas = 0, usage = null, first = null, last = null, buf = "";
        const dec = new TextDecoder();
        for await (const bytes of res.body) {
            buf += dec.decode(bytes, { stream: true });
            let i;
            while ((i = buf.indexOf("\n")) !== -1) {
                const line = buf.slice(0, i).trim();
                buf = buf.slice(i + 1);
                if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
                const chunk = JSON.parse(line.slice(6));
                const d = chunk.choices?.[0]?.delta?.content;
                if (d) { text += d; deltas++; first ??= performance.now() - t0; last = performance.now() - t0; }
                if (chunk.usage || chunk.x_groq?.usage) usage = chunk.usage ?? chunk.x_groq.usage;
            }
        }
        if (!usage) return { skipped: "Groq returned no usage" };
        samples.push({ chars: text.length, deltas, completionTokens: usage.completion_tokens, streamMs: round(last - first), ttftMs: round(first) });
    }
    const sum = (k) => samples.reduce((s, x) => s + x[k], 0);
    return {
        model: ANSWER_MODEL,
        samples,
        charsPerToken: Number((sum("chars") / sum("completionTokens")).toFixed(3)),
        tokensPerDelta: Number((sum("completionTokens") / sum("deltas")).toFixed(3)),
        directGroqTokensPerSec: stats(samples.map((x) => (x.completionTokens / x.streamMs) * 1000)),
    };
}

const calibration = await calibrate();
const answered = rows.filter((r) => r.ttftMs !== null && r.chars > 0);
const streamed = answered.filter((r) => r.streamMs > 0 && r.tokenEvents > 1);
const cpt = calibration.charsPerToken;
const answerable = rows.filter((r) => r.expected);
const none = rows.filter((r) => !r.expected);

const result = {
    at: new Date().toISOString(),
    endpoint: "POST /api/chat/stream",
    answerModel: ANSWER_MODEL,
    gapBetweenQuestionsMs: GAP_MS,
    questions: rows.length,
    errors: rows.filter((r) => r.error).length,
    timeToSourcesMs: stats(answered.map((r) => r.metaMs)),
    timeToFirstTokenMs: stats(answered.map((r) => r.ttftMs)),
    totalMs: stats(answered.map((r) => r.totalMs)),
    streamCharsPerSec: stats(streamed.map((r) => r.charsPerSec)),
    streamTokenEventsPerSec: stats(streamed.map((r) => r.tokenEventsPerSec)),
    streamTokensPerSecEstimated: cpt ? stats(streamed.map((r) => r.charsPerSec / cpt)) : null,
    answerChars: stats(streamed.map((r) => r.chars)),
    ragSources: {
        overall: accuracy(answerable),
        lexical: accuracy(answerable.filter((r) => r.kind === "lexical")),
        paraphrase: accuracy(answerable.filter((r) => r.kind === "paraphrase")),
        answerCitesRelevantNote: answerable.filter((r) => r.citesExpected).length,
        answerable: answerable.length,
        outOfCorpusSaidNotFound: none.filter((r) => r.saidNotFound).length,
        outOfCorpus: none.length,
        answerableSaidNotFound: answerable.filter((r) => r.saidNotFound).length,
    },
    calibration,
    rows,
};
console.log(JSON.stringify({ ...result, rows: undefined }, null, 2));
await saveResult(RESULT_NAME, result);
