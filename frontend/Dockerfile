# Build from the repository root: docker build -f frontend/Dockerfile .
FROM node:22-slim
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend frontend
# The API URL is baked into the client bundle at build time
ARG NEXT_PUBLIC_API=http://localhost:3001
ENV NEXT_PUBLIC_API=$NEXT_PUBLIC_API
RUN pnpm --filter frontend build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "start"]
