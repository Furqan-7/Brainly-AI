# Benchmarks

End-to-end benchmarks of the running backend, measured from an HTTP client against the real API:
real Postgres + pgvector, real Nomic embeddings, Groq answers and Cohere rerank.

| Script | What it measures |
|---|---|
| `seed.mjs` | Saves the 20-note corpus (`data/corpus.json`) via `POST /api/content` and waits for the worker (chunk, embed, summarise, tag) |
| `retrieval.mjs` | hit@1/3/5 and MRR of `GET /api/search` on `data/eval.json`, plus cold-cache search latency |
| `latency.mjs` | Median/p95/slowest of `GET /api/content`, `GET /api/search` with a warm and a cold query-embedding cache |
| `streaming.mjs` | `POST /api/chat/stream`: time to sources, time to first token, total, streaming rate; whether the RAG sources and citations point at the right note |
| `run.sh` | All of the above, in order |

**Eval set:** 30 questions. 13 *lexical* (share words with the note), 13 *paraphrase* (written to avoid
the note's distinctive words), 4 *out-of-corpus* (no answer in the notes). Each answerable question has
exactly one relevant note. The 20 notes cover very different topics, so this is an easy set; read the
accuracy numbers with that in mind.

## Running

```bash
pnpm --filter backend dev        # or docker compose up; needs NOMIC/GROQ/COHERE keys in backend/.env
```

```bash
DATABASE_URL=postgresql://... GROQ_API_KEY=... ./benchmarks/run.sh
```

Raw output lands in `results/*.json` (every sample and every answer is kept).

## Results (2026-11-08)

Setup: one cloud Linux container, Node 22, Postgres 16 + pgvector on localhost, AI APIs reached over the
internet through the container's HTTPS proxy. Answer model `qwen/qwen3.8-27b` (see note below).
All latencies are client-side and include HTTP and auth.

### API latency (`results/latency.json`, `results/retrieval.json`, 30 requests each)

| Endpoint | median | p95 | slowest |
|---|---|---|---|
| `GET /api/content` (list, DB only) | 4.9 ms | 8.1 ms | 11.1 ms |
| `GET /api/search`, query embedding cached | 4.6 ms | 5.7 ms | 6.8 ms |
| `GET /api/search`, uncached (calls Nomic) | 205.4 ms | 330.9 ms | 339.3 ms |
| `GET /api/search`, eval questions, first search | 241.1 ms | 533.1 ms | 571.6 ms |
| `POST /api/content` (save note, 20 requests) | 5.3 ms | 30.3 ms | 31.1 ms |

The worker had all 20 notes ready (chunked, embedded, 19/20 summarised) within 6 s; it is polled every 3 s, so this is approximate.

### Answer streaming (`results/streaming.json`: 30 questions, 20 s apart)

| | median | p90 | slowest |
|---|---|---|---|
| Time to sources (retrieval done) | 1,324 ms | 1,586 ms | 1,847 ms |
| Time to first token | 1,644 ms | 2,114 ms | 32,577 ms |
| Total (answer saved) | 1,873 ms | 3,503 ms | 32,848 ms |
| Streaming rate, chars/s | 2,071 | 2,753 | 3,040 (max) |
| Streaming rate, tokens/s (estimated) | 533 | 708 | 782 (max) |

- tokens/s = chars/s ÷ 3.89 chars per token, measured on the same model by streaming 5 answers straight
  from Groq with usage reporting on (Groq's own counts; it streamed ~1.0 token per SSE delta and
  512 tokens/s median when called directly).
- **Slow outliers:** 3 of 30 answers waited ~31 s before the first token, though retrieval finished in
  ~1.3 s. The cause is not confirmed: no 429s were logged in this paced run, and the OpenAI SDK
  retries silently. `results/streaming-burst-2.5s-gap.json` (same questions, 2.5 s apart) had 7 answers
  that took 4.7–32 s to start, median time to first token 1,334 ms, and Cohere 429s that fell back to the
  unreranked order. On this key the answer model is capped at 8,000 tokens/min, about 4 answers a
  minute.

### Retrieval accuracy (`results/retrieval.json`, `results/streaming.json`)

| | plain search `/api/search` | Ask AI sources (HyDE + hybrid + rerank) |
|---|---|---|
| hit@1, all 26 answerable | 26/26 | 26/26 |
| hit@1, 13 paraphrased | 13/13 | 13/13 |
| MRR@10 | 1.000 | 1.000 |
| Answer cites the relevant note | n/a | 26/26 |
| Out-of-corpus handled | 0/4 (returned 13–20 of the 20 notes) | 4/4 said "couldn't find" |

## Findings

- **`qwen/qwen3.6-27b` no longer exists on Groq** (`model_not_found`), so Ask AI fails with the
  default config. `ANSWER_MODEL` can now be set from the environment; these runs used `qwen/qwen3.8-27b`.
- **Plain search barely filters:** with `MAX_VECTOR_DISTANCE=0.6`, unrelated questions still return
  most of the library. Ask AI is fine because Cohere's rerank cutoff removes them.
- **Free-tier limits:** Groq's answer model allows 8,000 tokens/min on this key and Cohere returned 429s at about
  12 questions/min.
