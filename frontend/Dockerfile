# Build from the repository root: docker build -f frontend/Dockerfile .
FROM node:22-slim
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --filter frontend

COPY frontend frontend
# Where /backend/* is proxied to (baked into the build's rewrites)
ARG BACKEND_URL=http://localhost:3001
ENV BACKEND_URL=$BACKEND_URL
RUN pnpm --filter frontend build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "start"]
