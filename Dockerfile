FROM node:22-bookworm-slim AS deps

RUN npm install -g pnpm@latest

WORKDIR /app/anis-backend

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

FROM node:22-bookworm-slim AS builder

RUN npm install -g pnpm@latest

WORKDIR /app/anis-backend

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

COPY --from=shared-builder /app/anis-shared /app/anis-shared

RUN pnpm build

FROM node:22-bookworm-slim AS runner
RUN groupadd --system appgroup && \
  useradd  --system --gid appgroup --shell /bin/false appuser

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/anis-backend

COPY --from=builder --chown=appuser:appgroup /app/anis-backend/dist ./dist

COPY --from=deps   --chown=appuser:appgroup /app/anis-backend/node_modules ./node_modules

COPY --chown=appuser:appgroup package.json ./

COPY --chown=appuser:appgroup public ./public

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=20s \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]