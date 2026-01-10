# ---------- Build stage ----------
FROM node:20-slim AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

RUN npm install lightningcss-linux-arm64-gnu@1.30.2
RUN npm install @tailwindcss/oxide-linux-arm64-gnu@4.1.18

# No need for npm rebuild if we have build tools - npm ci will handle it
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]