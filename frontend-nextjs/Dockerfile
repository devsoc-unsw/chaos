# builder
FROM oven/bun:latest AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Build tools needed for native modules (lightningcss, @tailwindcss/oxide)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Needed for some reason
RUN bun add lightningcss-linux-arm64-gnu@1.30.2
RUN bun add @tailwindcss/oxide-linux-arm64-gnu@4.1.18

COPY . .

ARG NEXT_PUBLIC_APP_ROOT_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN bun run build

# runner
FROM oven/bun:latest

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 chaos
RUN useradd --system --uid 1001 --gid chaos nextjs

COPY --from=builder --chown=chaos:nodejs /app ./

USER nextjs

EXPOSE 3000
CMD ["bun", "start"]