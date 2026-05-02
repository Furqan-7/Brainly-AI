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

- 📥 **Universal content ingestion** — Save links, notes, tweets, and documents in one place
- 🤖 **AI-powered querying** — Ask questions across your saved content in natural language
- 🏷️ **Tagging & organization** — Categorize your knowledge base your way
- 🔐 **JWT authentication** — Secure user sessions with token-based auth
- ⚡ **Fast, typed API** — Built end-to-end in TypeScript for reliability
- 🗃️ **Relational data model** — PostgreSQL with Prisma ORM for type-safe, schema-first storage

---

## 🏗️ Architecture

```
Brainly-AI/
├── backend/          # Node.js + Express REST API (TypeScript)
│   ├── src/
│   │   ├── routes/   # API route handlers
│   │   ├── middleware/ # JWT auth middleware
│   │   └── index.ts  # Server entry point
├── frontend/         # Next.js + TypeScript client
│   ├── app/          # App router pages
│   ├── components/
│   └── lib/          # API client layer
├── db/               # Prisma schema & migrations
│   └── schema.prisma # Data models (User, Content, Tag)
├── package.json      # pnpm workspace root
└── pnpm-workspace.yaml
```

**Monorepo** powered by pnpm workspaces — shared TypeScript types between frontend and backend, single install, unified scripts.

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Language    | TypeScript (end-to-end)             |
| Backend     | Node.js, Express.js                 |
| Frontend    | Next.js, Tailwind CSS               |
| Database    | PostgreSQL                          |
| ORM         | Prisma (type-safe, schema-first)    |
| Auth        | JWT (JSON Web Tokens)               |
| Package Mgr | pnpm workspaces (monorepo)          |
| API Testing | Postman                             |

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PostgreSQL (local or hosted — e.g. Neon, Supabase)

### Installation

```bash
# Clone the repo
git clone https://github.com/Furqan-7/Brainly-AI.git
cd Brainly-AI

# Install all workspace dependencies
pnpm install
```

### Environment Setup

Create a `.env` in `backend/`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/brainly
JWT_SECRET=your_secret_key
PORT=3001
```

### Database Setup

```bash
# Run Prisma migrations
cd backend
npx prisma migrate dev

# (Optional) Open Prisma Studio to inspect your DB
npx prisma studio
```

### Running the App

```bash
# Start backend
cd backend && pnpm dev

# Start frontend (new terminal)
cd frontend && pnpm dev
```

Backend runs on `http://localhost:3001`  
Frontend runs on `http://localhost:3000`

---

## 📡 API Reference

### Auth

| Method | Endpoint         | Description          |
|--------|------------------|----------------------|
| POST   | `/api/auth/signup` | Register a new user |
| POST   | `/api/auth/login`  | Login & get JWT     |

### Content

| Method | Endpoint          | Description                    | Auth |
|--------|-------------------|--------------------------------|------|
| POST   | `/api/content`    | Save a new piece of content    | ✅   |
| GET    | `/api/content`    | Get all your saved content     | ✅   |
| DELETE | `/api/content/:id`| Delete a content item          | ✅   |
| GET    | `/api/content/search?q=` | AI-powered semantic search | ✅ |

All protected routes require `Authorization: Bearer <token>` header.

---

## 🔭 Roadmap

- [ ] Browser extension for one-click saving
- [ ] Semantic vector search (pgvector embeddings)
- [ ] Sharing collections with other users
- [ ] Mobile-responsive UI
- [ ] Cloudflare Workers deployment for edge performance
- [ ] Import from Notion / Obsidian

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
