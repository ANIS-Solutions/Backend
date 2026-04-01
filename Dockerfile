FROM node:current-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends git curl \
  && rm -rf /var/lib/apt/lists/*
# RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@latest --activate
RUN npm install -g pnpm@latest
WORKDIR /app

# COPY pnpm-workspace.yaml* ./
# COPY package* ./

# COPY anis-shared ./anis-shared

# COPY anis-backend ./anis-backend


# WORKDIR /app/anis-backend
# RUN pnpm install

# EXPOSE 5000
# CMD ["pnpm", "dev"]
COPY anis-shared ./anis-shared
WORKDIR /app/anis-shared
RUN pnpm install

WORKDIR /app
COPY anis-backend ./anis-backend

WORKDIR /app/anis-backend

RUN pnpm install

EXPOSE 5000
CMD ["pnpm", "dev"]