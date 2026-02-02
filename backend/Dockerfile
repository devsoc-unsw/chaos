# build project w/ cargo chef to speed up build times(idk saw it on yt)
FROM rust:latest AS chef

RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
RUN cargo install cargo-chef
WORKDIR /backend

FROM chef AS planner
COPY server/ ./server/
WORKDIR /backend/server
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
WORKDIR /backend/server
COPY --from=planner /backend/server/recipe.json ./recipe.json

RUN cargo chef cook --release --recipe-path recipe.json

COPY server/ ./

# Build the server binary
WORKDIR /backend/server

ENV SQLX_OFFLINE=true

RUN cargo build --release

FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libc6 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 chaos
RUN useradd --system --uid 1001 --gid chaos rust

COPY --from=builder --chown=chaos:rust /backend/server/target/release/server /backend/server

USER rust

ENTRYPOINT ["/backend/server"]
EXPOSE 8080
