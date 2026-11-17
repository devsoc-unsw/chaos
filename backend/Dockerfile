# build project w/ cargo chef to speed up build times(idk saw it on yt)
FROM rust:latest AS chef

# Pinned buf, used to generate the SpiceDB gRPC bindings before compiling.
ARG BUF_VERSION=1.73.0
RUN apt-get update && apt-get install -y \
    libssl-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*
RUN curl -sSL "https://github.com/bufbuild/buf/releases/download/v${BUF_VERSION}/buf-Linux-$(uname -m)" \
    -o /usr/local/bin/buf && chmod +x /usr/local/bin/buf
RUN cargo install cargo-chef
WORKDIR /backend

FROM chef AS planner
COPY server/ ./server/
WORKDIR /backend/server
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY migrations/ ./migrations/
COPY spicedb/ ./spicedb/

WORKDIR /backend/server
COPY --from=planner /backend/server/recipe.json ./recipe.json

RUN cargo chef cook --release --recipe-path recipe.json

COPY server/ ./

# Generate the SpiceDB gRPC bindings. They are not committed (see
# backend/.gitignore), so this must run before any compilation that includes
# them, including the SQLx macro expansion below.
WORKDIR /backend
COPY buf.gen.yaml ./
RUN buf generate buf.build/authzed/api --include-imports --template buf.gen.yaml

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
