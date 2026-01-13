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
COPY migrations/ ./migrations/
COPY server/ ./

# build the application
WORKDIR /backend/server
RUN cargo build --release

FROM debian:trixie-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libc6 \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# copy sqlx-cli and migrations for running migrations on startup
COPY --from=chef /usr/local/bin/sqlx /usr/local/bin/sqlx
COPY --from=builder /backend/server/migrations /backend/migrations
COPY --from=builder /backend/server/target/release/server /backend/server

# setup backend start script
COPY backend-scripts/start-backend.sh /backend/start-backend.sh
RUN chmod +x /backend/start-backend.sh

ENTRYPOINT ["/backend/start-backend.sh"]
EXPOSE 8080