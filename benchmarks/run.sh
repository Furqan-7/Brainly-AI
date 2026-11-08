#!/usr/bin/env bash
# Runs the whole benchmark against a running backend (pnpm --filter backend dev, or docker compose up).
#   DATABASE_URL=postgresql://... GROQ_API_KEY=... ./benchmarks/run.sh
# DATABASE_URL lets seed.mjs mark the bench user premium (the free plan allows 30 AI answers a day).
# GROQ_API_KEY is only used by streaming.mjs to calibrate tokens/s against Groq's own token counts.
set -euo pipefail
cd "$(dirname "$0")"
node seed.mjs
node retrieval.mjs          # first: searches each eval question with a cold embedding cache
node latency.mjs 30         # then: warm and cold search, list endpoint
node streaming.mjs 20000    # paced to stay under Groq's free-tier tokens/minute
