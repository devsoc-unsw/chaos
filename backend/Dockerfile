# build project w/ cargo chef to speed up build times(idk saw it on yt)
FROM rust:latest AS chef

RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef --version 0.1.72
RUN cargo install sqlx-cli --version 0.7.3 --no-default-features --features native-tls,postgres --root /usr/local
WORKDIR /backend

FROM chef AS planner
COPY server/ ./server/
WORKDIR /backend/server
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
WORKDIR /backend/server
COPY --from=planner /backend/server/recipe.json ./recipe.json

RUN cargo chef cook --release --recipe-path recipe.json

COPY migrations/ ../migrations/
COPY server/ ./

# Use sqlx folders for compile time checking, need to generate these in the workflow
ENV SQLX_OFFLINE=true

# Build the application
WORKDIR /backend/server
RUN cargo build --release

# Build deploy-seeder
FROM chef AS seeder-builder
WORKDIR /backend


COPY server/ ./server/
COPY backend-deploy-utils/deploy-seeder/ ./backend-deploy-utils/deploy-seeder/

ENV SQLX_OFFLINE=true

WORKDIR /backend/backend-deploy-utils/deploy-seeder
RUN cargo build --release

FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libc6 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy sqlx-cli and migrations for running migrations on startup
COPY --from=chef /usr/local/bin/sqlx /usr/local/bin/sqlx
COPY --from=builder /backend/migrations /backend/migrations
COPY --from=builder /backend/server/target/release/server /backend/server
COPY --from=seeder-builder /backend/backend-deploy-utils/deploy-seeder/target/release/deploy-seeder /backend/deploy-seeder

# Setup backend start script
COPY backend-deploy-utils/startup-script/start-backend.sh /backend/start-backend.sh
RUN chmod +x /backend/start-backend.sh

ENTRYPOINT ["/backend/start-backend.sh"]
EXPOSE 8080
