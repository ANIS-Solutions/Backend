# this written for development only
FROM node:current-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  git curl \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g corepack@latest --force && \
  rm -f /usr/local/bin/yarn /usr/local/bin/pnpm && \
  corepack enable && \
  corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

COPY pnpm*.yaml ./
COPY package.json ./backend/

WORKDIR /app/backend
COPY . .
RUN pnpm install --frozen-lockfile 
EXPOSE 5000
CMD ["pnpm", "dev"]
