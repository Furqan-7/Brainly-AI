// Shared helpers for the benchmark scripts: an API client with the session cookie, timing and stats.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = dirname(fileURLToPath(import.meta.url));
export const API = process.env.BENCH_API ?? "http://localhost:3001";
export const USER = {
    username: process.env.BENCH_USERNAME ?? "benchuser",
    email: process.env.BENCH_EMAIL ?? "bench@example.com",
    password: process.env.BENCH_PASSWORD ?? "bench-password-123",
};

export const readJson = async (rel) => JSON.parse(await readFile(join(HERE, rel), "utf8"));

export async function saveResult(name, data) {
    const file = join(HERE, "results", `${name}.json`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(data, null, 2) + "\n");
    return file;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Signs in (signing up first if needed) and returns a fetch wrapper that sends the session cookie. */
export async function login() {
    const post = (path, body) =>
        fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let res = await post("/signin", { email: USER.email, password: USER.password });
    if (res.status === 400) res = await post("/signup", USER);
    if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
    const cookie = res.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const { id } = await res.json();
    const api = (path, init = {}) =>
        fetch(`${API}${path}`, { ...init, headers: { "Content-Type": "application/json", Cookie: cookie, ...(init.headers ?? {}) } });
    return { api, userId: id };
}

/** Runs fn and returns [result, elapsed ms]. */
export async function timed(fn) {
    const t0 = performance.now();
    const out = await fn();
    return [out, performance.now() - t0];
}

const round = (n, d = 1) => (n === null || n === undefined || Number.isNaN(n) ? null : Number(n.toFixed(d)));

/** Nearest-rank percentile. */
function percentile(sorted, p) {
    if (!sorted.length) return null;
    const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[i];
}

export function stats(samples) {
    const s = [...samples].sort((a, b) => a - b);
    const n = s.length;
    const median = n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null;
    return {
        n,
        min: round(s[0]),
        median: round(median),
        mean: round(n ? s.reduce((a, b) => a + b, 0) / n : null),
        p90: round(percentile(s, 90)),
        p95: round(percentile(s, 95)),
        max: round(s[n - 1]),
    };
}

/** Maps memory ids in the benchmark account to corpus keys (titles are unique in the corpus). */
export async function memoryKeyMap(api) {
    const corpus = await readJson("data/corpus.json");
    const byTitle = new Map(corpus.map((c) => [c.title, c.key]));
    const res = await api("/api/content?limit=100");
    const body = await res.json();
    const items = body.memories ?? body.items ?? body.content ?? [];
    const map = new Map();
    for (const m of items) if (byTitle.has(m.title)) map.set(m.id, byTitle.get(m.title));
    return map;
}

/** hit@k and MRR for rows with a 1-based `rank` of the relevant item (0 = not retrieved). */
export function accuracy(list) {
    const n = list.length;
    const at = (k) => list.filter((r) => r.rank >= 1 && r.rank <= k).length;
    return {
        n,
        hitAt1: at(1), hitAt3: at(3), hitAt5: at(5),
        "hit@1": Number((at(1) / n).toFixed(3)),
        "hit@3": Number((at(3) / n).toFixed(3)),
        "hit@5": Number((at(5) / n).toFixed(3)),
        "MRR@10": Number((list.reduce((s, r) => s + (r.rank >= 1 && r.rank <= 10 ? 1 / r.rank : 0), 0) / n).toFixed(3)),
    };
}
