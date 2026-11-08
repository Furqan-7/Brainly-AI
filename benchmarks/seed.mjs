// Saves the benchmark corpus through the real API (POST /api/content) and waits until the
// background worker has chunked, embedded (Nomic) and summarised (Groq) every note.
//   node benchmarks/seed.mjs
import { execFileSync } from "node:child_process";
import { login, memoryKeyMap, readJson, saveResult, sleep, timed, stats } from "./lib.mjs";

const corpus = await readJson("data/corpus.json");
const { api, userId } = await login();

// The free plan allows 30 AI answers a day; the eval asks more than that, so make the bench user premium.
if (process.env.DATABASE_URL) {
    try {
        execFileSync("psql", [process.env.DATABASE_URL, "-qc", `UPDATE "User" SET "isPremium" = true WHERE id = ${Number(userId)}`]);
    } catch (e) {
        console.warn("could not mark bench user premium (chat quota may run out):", e.message);
    }
}

const existing = await memoryKeyMap(api);
const have = new Set(existing.values());
const todo = corpus.filter((c) => !have.has(c.key));
console.log(`user ${userId}: ${have.size} notes already saved, saving ${todo.length}`);

const saveMs = [];
const ids = [];
for (const doc of todo) {
    const [res, ms] = await timed(() =>
        api("/api/content", { method: "POST", body: JSON.stringify({ type: "note", title: doc.title, note: doc.note, allowDuplicate: true }) })
    );
    const body = await res.json();
    if (!res.ok) throw new Error(`save failed for ${doc.key}: ${res.status} ${JSON.stringify(body)}`);
    saveMs.push(ms);
    ids.push(body.id);
}

// Poll until the worker is done (ready or failed)
const started = Date.now();
let statuses = [];
while (ids.length) {
    const res = await api(`/api/content/status?ids=${ids.join(",")}`);
    statuses = (await res.json()).memories ?? [];
    const pending = statuses.filter((m) => m.status !== "ready" && m.status !== "failed");
    process.stdout.write(`\rprocessing: ${statuses.length - pending.length}/${ids.length} done`);
    if (!pending.length) break;
    if (Date.now() - started > 5 * 60_000) throw new Error("timed out waiting for the worker");
    await sleep(3000);
}
const ingestSeconds = (Date.now() - started) / 1000;
console.log();

const failed = statuses.filter((m) => m.status === "failed");
if (failed.length) console.warn("failed memories:", failed);

const result = {
    at: new Date().toISOString(),
    saved: todo.length,
    failed: failed.length,
    saveRequestMs: stats(saveMs),
    workerSecondsUntilAllReady: ids.length ? Number(ingestSeconds.toFixed(1)) : null,
};
console.log(result);
await saveResult("seed", result);
