// API latency, measured from the client (includes HTTP, auth middleware, DB and any AI API calls).
//   GET /api/content            list memories (DB only)
//   GET /api/search  warm       questions searched before, so the query embedding comes from the cache
//   GET /api/search  cold       never-seen queries, so each one calls the Nomic embedding API
// Run after retrieval.mjs (that run warms the cache for the eval questions).
//   node benchmarks/latency.mjs [runs=30]
import { login, readJson, saveResult, stats, timed } from "./lib.mjs";

const RUNS = Number(process.argv[2] ?? 30);
const { questions } = await readJson("data/eval.json");
const { api } = await login();

async function measure(label, makePath) {
    // one untimed request first so connection setup and lazy init don't count
    await (await api(makePath(-1))).arrayBuffer();
    const samples = [];
    for (let i = 0; i < RUNS; i++) {
        const [res, ms] = await timed(async () => {
            const r = await api(makePath(i));
            await r.arrayBuffer(); // include the full body
            return r;
        });
        if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
        samples.push(ms);
    }
    const s = stats(samples);
    console.log(label.padEnd(28), JSON.stringify(s));
    return { ...s, samples: samples.map((x) => Number(x.toFixed(1))) };
}

const q = (i) => questions[(i + questions.length) % questions.length].q;
const nonce = Date.now().toString(36);

const result = {
    at: new Date().toISOString(),
    runs: RUNS,
    "GET /api/content": await measure("GET /api/content", () => "/api/content?limit=24"),
    "GET /api/search (warm)": await measure("GET /api/search (warm)", (i) => `/api/search?q=${encodeURIComponent(q(i))}`),
    // A unique word on each query makes the embedding cache miss, so every request embeds via Nomic
    "GET /api/search (cold)": await measure("GET /api/search (cold)", (i) => `/api/search?q=${encodeURIComponent(`${q(i)} v${nonce}${i + 1}`)}`),
};
await saveResult("latency", result);
