// Retrieval accuracy of plain search (GET /api/search: vector + full-text, RRF, cutoffs; no LLM)
// on the eval set. Each answerable question has exactly one relevant note.
// Also records each request's latency: this is the first time each question is searched, so the
// query embedding is not cached yet (cold path, includes the Nomic API call).
//   node benchmarks/retrieval.mjs
import { accuracy, login, memoryKeyMap, readJson, saveResult, stats, timed } from "./lib.mjs";

const { questions } = await readJson("data/eval.json");
const { api } = await login();
const keyOf = await memoryKeyMap(api);
if (keyOf.size === 0) throw new Error("no benchmark notes found: run seed.mjs first");

const rows = [];
for (const item of questions) {
    const [res, ms] = await timed(() => api(`/api/search?q=${encodeURIComponent(item.q)}`));
    const body = await res.json();
    if (!res.ok) throw new Error(`search failed (${res.status}): ${JSON.stringify(body)}`);
    const ranked = body.results.map((r) => keyOf.get(r.memoryId) ?? `other:${r.memoryId}`);
    const rank = item.expected ? ranked.indexOf(item.expected) + 1 : null; // 1-based, 0 = not found
    rows.push({ id: item.id, kind: item.kind, q: item.q, expected: item.expected, rank, returned: ranked.length, top3: ranked.slice(0, 3), ms: Number(ms.toFixed(1)) });
    console.log(`${item.id} ${String(rank ?? "-").padStart(2)} ${ms.toFixed(0).padStart(5)}ms  ${item.q}  -> ${ranked.slice(0, 3).join(", ")}`);
}


const answerable = rows.filter((r) => r.expected);
const none = rows.filter((r) => !r.expected);
const result = {
    at: new Date().toISOString(),
    endpoint: "GET /api/search",
    corpusSize: keyOf.size,
    overall: accuracy(answerable),
    lexical: accuracy(answerable.filter((r) => r.kind === "lexical")),
    paraphrase: accuracy(answerable.filter((r) => r.kind === "paraphrase")),
    outOfCorpus: { n: none.length, returnedNothing: none.filter((r) => r.returned === 0).length, resultsReturned: none.map((r) => r.returned) },
    coldSearchLatencyMs: stats(rows.map((r) => r.ms)),
    rows,
};
console.log(JSON.stringify({ ...result, rows: undefined }, null, 2));
await saveResult("retrieval", result);
