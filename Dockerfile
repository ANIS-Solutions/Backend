FROM node:20.1.0-alpine

RUN corepack enable
WORKDIR /app

RUN apk add --no-cache bash
COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

COPY . .

EXPOSE 5000
CMD ["pnpm", "dev"]
# docker build -t my-bk1 .
# docker run -it --rm -p 5000:5000 -v $(pwd):/app my-bk1
