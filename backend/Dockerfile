# build project w/ cargo chef to speed up build times(idk saw it on yt)
FROM rust:latest AS chef

RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef
RUN cargo install sqlx-cli --no-default-features --features native-tls,postgres --root /usr/local
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

# Run DB migrations script
WORKDIR /backend
COPY util/migrate.sh /backend/migrate.sh
RUN sh /backend/migrate.sh

# Build the server binary TODO: remove sqlx offline, connect docker to db, then run migration script, then run server build
WORKDIR /backend/server
RUN echo "DATABASE_URL=postgres://postgres:password@0.0.0.0:5432/chaos" >> .env
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

ENTRYPOINT ["/backend/server"]
EXPOSE 8080
