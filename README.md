# 🧠 Brainly AI — Your Second Brain

> Stop losing knowledge across 10 different tabs. Brainly centralizes your tweets, YouTube links, research papers, and notes into a single intelligent knowledge base — and lets you query it with AI.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?style=flat&logo=pnpm&logoColor=white)

---

## 🚀 The Problem

We live in an era of digital fragmentation. Valuable knowledge — important tweets, YouTube tutorials, research papers, resumes, blog posts — is scattered across dozens of platforms with no single place to find it again.

Brainly solves this by acting as a **personal knowledge hub**: save anything, tag it, and retrieve it instantly through semantic AI search.

---

## ✨ Features

**Save anything**
- 🔗 Web pages (clean article text via Readability + Open Graph data — LinkedIn posts too)
- 🎬 **Instagram Reels** and **TikToks** — caption, author, thumbnail and an audio transcript (Whisper)
- ▶️ YouTube videos & Shorts — captions, or a Whisper transcript when captions are off; title, channel, duration
- 🐦 Tweets, 📄 PDFs (scanned PDFs are OCR'd), 🖼️ images (OCR / AI description), 📝 notes
- 🎙️ Voice notes — record in the browser or upload; transcribed automatically
- 📥 Import Notion / Google Docs exports (`.md`, `.txt`, `.html`, `.docx`, or a Notion `.zip`)
- 🧩 Browser extension (save page / link / selection, quick search) and an installable PWA with **Share → Brainly** on mobile

**Find it again**
- 🤖 **Ask AI** — answers grounded only in your content, streamed live, with clickable `[1]` citations
- 🎥 Sources open the original or **play reels, TikToks and YouTube inline** — search "project" and get your saved project reel
- 💬 Conversations with follow-ups ("show me more like that") and history
- 🔎 **Search mode** — instant ranked results without the LLM
- 🧭 Filters by type and date, from the UI or in plain words ("reels from last month")
- Hybrid retrieval: pgvector + Postgres full-text, HyDE, reciprocal rank fusion, Cohere rerank with relevance cutoffs; keyword fallback if the embedding API is down

**Organise**
- 🏷️ Tags (yours + AI auto-tags) and an AI summary for every memory
- ⭐ Star, 🗄️ archive, ✏️ edit (re-indexes), 📁 collections — share a collection publicly with a link
- ♻️ Duplicate detection on save and a find & merge page
- 🕸️ Knowledge graph of related memories
- 🔁 **Rediscover** — spaced-repetition review and throwbacks

**Platform**
- Background job queue in Postgres (`FOR UPDATE SKIP LOCKED`) with retries, backoff and visible failures + Retry
- httpOnly-cookie sessions, rate limiting, SSRF protection on every fetched URL, upload type/size limits, private file serving
- Local disk or S3 / Cloudflare R2 storage
- Free / premium plan limits (memories, daily AI answers, upload size)
- JSON request logs, Docker Compose, GitHub Actions CI, unit + integration tests

---

## 🏗️ Architecture

```
Brainly-AI/
├── backend/                 # Express API + background worker (TypeScript)
│   ├── src/
│   │   ├── index.ts         # app setup, middleware, error handling
│   │   ├── routes/          # auth, content, chat/search, collections, insights
│   │   ├── ingest/          # web, youtube, reel, tiktok, transcribe, imports, enrich…
│   │   ├── lib/             # auth cookies, SSRF-safe fetch, storage, plans, filters, LLM client
│   │   ├── worker.ts        # Postgres-backed job queue
│   │   ├── processMemory.ts # extract → chunk → embed → summarise/tag
│   │   ├── Retrieval.ts     # hybrid search, rerank, cutoffs
│   │   └── rag.ts           # retrieval + prompt building for answers
│   └── test/                # vitest unit + integration tests
├── frontend/                # Next.js app (dashboard, collections, graph, duplicates, public /c/[slug])
├── db/                      # Prisma schema, migrations, client (Neon or plain Postgres)
├── extension/               # Browser extension (Manifest V3): Chrome, Edge, Brave, Opera, Firefox, Safari
└── docker-compose.yml       # Postgres + pgvector, API, web
```

**Saving:** `POST /api/content` validates and stores the memory as `pending` → the worker extracts text (fetchers / OCR / Whisper), chunks it, embeds it (Nomic), adds a summary and tags (Groq) and marks it `ready`.

**Asking:** question → follow-up rewrite → HyDE → hybrid search (vector + keyword, filters) → dedupe → rerank + cutoff → neighbour expansion → streamed answer with citations.

---

## 🛠️ Tech Stack

| Layer       | Technology                                            |
|-------------|-------------------------------------------------------|
| Language    | TypeScript (end-to-end)                               |
| Backend     | Node.js, Express 5, Zod                               |
| Frontend    | Next.js 16, React 19, Tailwind CSS 4, Motion          |
| Database    | PostgreSQL + pgvector (Neon or self-hosted), Prisma 7 |
| AI          | Nomic embeddings, Groq (Qwen, gpt-oss, Whisper), Cohere rerank, Gemini vision |
| Auth        | JWT in httpOnly cookies, Google & GitHub OAuth        |
| Infra       | Docker Compose, GitHub Actions, S3/R2 (optional)      |

---

## ⚙️ Getting Started

### Option A — Docker (everything included)

```bash
cp backend/.env.example backend/.env   # add your AI API keys
docker compose up --build
```

Open http://localhost:3000. Migrations run automatically on start.

### Option B — Local development

Prerequisites: Node.js 22+, pnpm, PostgreSQL with the `pgvector` extension (or a Neon database). Optional: `yt-dlp` on your PATH for reel/TikTok/YouTube audio transcription.

```bash
pnpm install
cp backend/.env.example backend/.env       # fill it in
cp frontend/.env.example frontend/.env.local

pnpm --filter db build
pnpm --filter db exec prisma migrate deploy

pnpm dev        # frontend on :3000, backend on :3001
```

See `backend/.env.example` for every setting (storage, OAuth, worker, retrieval tuning).

### Deploying (e.g. Vercel + Render)

The web app proxies every API request through its own domain at `/backend`, so the login cookie is first-party and browsers don't block it.

- **Frontend (Vercel):** set `BACKEND_URL` to your API's URL (e.g. `https://brainly-api.onrender.com`).
- **Backend:** set `CLIENT_URL` to the web app's URL, `COOKIE_SAMESITE=lax`, and `TRUST_PROXY=2`.
- **Backend build command (Render):** `pnpm install --frozen-lockfile && pnpm build`. `pnpm build` applies pending database migrations when `DATABASE_URL` is set, so new tables reach production with each deploy.
- **Google sign-in:** set `GOOGLE_CALLBACK_URL` to `https://<your-web-app>/backend/auth/google/callback` and add that same URL to the authorized redirect URIs in Google Cloud Console.

### Tests

```bash
pnpm test                                    # unit tests
TEST_DATABASE_URL=postgresql://… pnpm test   # + integration tests against a migrated pgvector database
pnpm lint
```

### Browser extension

One extension works in every desktop browser. Build the packages first:

```bash
pnpm build:extension
```

This writes `extension/dist/chromium/` and `extension/dist/firefox/` (plus a `.zip` of each, ready to upload to the stores).

**Install it yourself (no store needed)**

| Browser | How |
| --- | --- |
| Chrome, Brave, Arc, Vivaldi | `chrome://extensions` → turn on **Developer mode** → **Load unpacked** → pick `extension/` (or `extension/dist/chromium/`) |
| Edge | `edge://extensions` → **Developer mode** → **Load unpacked** → same folder |
| Opera | `opera://extensions` → **Developer mode** → **Load unpacked** → same folder |
| Firefox | `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick `extension/dist/firefox/manifest.json` (removed when Firefox restarts; see below to install it for good) |
| Safari (Mac) | `xcrun safari-web-extension-converter extension/dist/chromium` (needs Xcode), run the app it creates, then enable it in Safari → Settings → Extensions |

Then:

1. A **Connect Brainly** tab opens (or click **Connect Brainly** in the extension). Sign in if asked; the extension connects by itself, with no token to copy. In Firefox and Safari, allow access to the Brainly site when asked.
2. Click the Brainly icon on any page to save it, or right-click a link or selected text. Brainly adds the title, summary and tags.

After pulling a new version, click **Reload** (↻) on the extension in the extensions page, or the browser keeps running the old one.

**Publish it so anyone can install it in one click**

| Store | Covers | Upload | Cost |
| --- | --- | --- | --- |
| [Chrome Web Store](https://chrome.google.com/webstore/devconsole) | Chrome, Brave, Arc, Vivaldi, Opera (with its "Install Chrome extensions" add-on) | `brainly-chromium-<version>.zip` | one-time $5 developer fee |
| [Microsoft Edge Add-ons](https://partner.microsoft.com/dashboard/microsoftedge) | Edge | `brainly-chromium-<version>.zip` | free |
| [Firefox Add-ons (AMO)](https://addons.mozilla.org/developers/) | Firefox desktop and Android | `brainly-firefox-<version>.zip` | free |
| [Opera Add-ons](https://addons.opera.com/developer/) | Opera | `brainly-chromium-<version>.zip` | free |
| App Store (Safari) | Safari on Mac, iPhone and iPad | the Xcode project from `safari-web-extension-converter` | Apple Developer Program, $99/year |

Bump `version` in `extension/manifest.json` before each upload. On phones without extensions, the installable web app's **Share → Brainly** does the same job (below).

The extension talks to `https://brainly-ai-frontend.vercel.app` by default (the API through its `/backend` proxy). For your own deployment, change the address in `extension/api.js` and `extension/manifest.json` (`host_permissions`, `content_scripts.matches`), or use the extension's **Settings → Advanced** with a token from `/extension`.

### Mobile share sheet

Open Brainly in Chrome on Android and choose **Install app**. Brainly then appears in the system **Share** menu. Sharing a reel, video, link or text to it saves it straight away (`/share`); Brainly names it from the page or video and adds a summary and tags. Adding a note is optional.

### Premium

Plan limits live in `backend/src/lib/plans.ts`. Set `User.isPremium = true` to upgrade a user (no payment provider is wired up yet).

---

## 📡 API Reference

All `/api/*` routes need a session cookie (web app) or `Authorization: Bearer <token>` (extension / API clients).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup`, `/signin`, `/logout` | Email/password auth (sets/clears the session cookie) |
| GET | `/auth/google`, `/auth/github` | OAuth sign-in (when configured) |
| GET | `/api/me` | Current user, plan and usage |
| POST | `/api/extension-token` | Long-lived token for the browser extension |
| POST | `/api/content` | Save a link / note / file (`type` is auto-detected for YouTube, Instagram, TikTok and X links) |
| POST | `/api/import` | Import Notion / Google Docs / Markdown files as notes |
| GET | `/api/content` | List memories — `view`, `types`, `q`, `tag`, `collectionId`, `cursor`, `limit` |
| GET | `/api/content/status?ids=` | Poll processing status |
| PATCH | `/api/content/:id` | Edit title, note, context, tags, starred, archived |
| DELETE | `/api/content/:id` | Delete a memory and its file |
| POST | `/api/content/:id/retry` | Retry a failed memory |
| POST | `/api/content/:id/review` | Spaced-repetition review result |
| GET | `/api/content/duplicates`, POST `/api/content/merge` | Find and merge duplicates |
| GET | `/api/files/:id` | Download an uploaded file |
| GET | `/api/tags` | Tags with counts |
| POST | `/api/chat/stream` | Ask AI, streamed as Server-Sent Events (`meta` → `token`… → `done`) |
| POST | `/api/chat` | Ask AI (single JSON response) |
| GET | `/api/search?q=` | Plain search, no LLM |
| GET/DELETE | `/api/conversations[/:id]` | Chat history |
| CRUD | `/api/collections[/:id]`, `/api/collections/:id/memories`, `/api/collections/:id/share` | Collections and sharing |
| GET | `/api/public/collections/:slug` | Public shared collection |
| GET | `/api/graph`, `/api/rediscover` | Knowledge graph, review digest |

---

## 🤔 Why I Built This

I personally struggled with knowledge management — bookmarks piled up, interesting threads got lost, and research was impossible to re-find. Brainly is a tool I actually want to use every day.

It also pushed me to think seriously about relational data modeling with Prisma, monorepo architecture with pnpm workspaces, shared TypeScript types, and JWT auth flows — not just follow tutorials, but make real engineering decisions.

---

## 👤 Author

**Bodarni Furqan**  
Full-Stack Engineer | TypeScript · Node.js · Next.js · PostgreSQL · Prisma  
[GitHub](https://github.com/Furqan-7) · [LinkedIn](https://linkedin.com/in/furqan-132378327) · [Twitter/X](https://x.com/B_Furqan07)

---

## 📄 License

MIT — feel free to use, fork, and build on this.
