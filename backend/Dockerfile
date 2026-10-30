# Build from the repository root: docker build -f backend/Dockerfile .
FROM node:22-slim

# yt-dlp lets the worker transcribe reels, TikToks and caption-less YouTube videos
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl python3 \
    && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY db/package.json db/
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --ignore-scripts --filter backend... --filter db

COPY db db
COPY backend backend
RUN pnpm --filter db build && pnpm --filter backend build

ENV NODE_ENV=production PORT=3001
EXPOSE 3001
# Apply pending migrations, then start the API (which also runs the background worker)
CMD ["sh", "-c", "pnpm --filter db exec prisma migrate deploy && node backend/dist/index.js"]
