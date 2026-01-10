# build project
FROM messense/rust-musl-cross:x86_64-musl as chef
RUN cargo install cargo-chef
WORKDIR /backend

FROM chef AS planner
COPY server/ ./server/
WORKDIR /backend/server
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /backend/server/recipe.json recipe.json
WORKDIR /backend/server
RUN cargo chef cook --release --target x86_64-unknown-linux-musl --recipe-path recipe.json
COPY migrations/ ./migrations/
COPY server/ ./server/

# build app server
WORKDIR /backend/server
RUN cargo install sqlx-cli --no-default-features --features native-tls,postgres
RUN cargo build --release --target x86_64-unknown-linux-musl

FROM debian-slim
COPY --from=builder /root/.cargo/bin/sqlx /usr/local/bin/sqlx
COPY --from=builder /backend/migrations /backend/migrations
COPY --from=builder /backend/target/x86_64-unknown-linux-musl/release/server /backend/server

# setup backend start script
COPY backend-scripts/start-backend.sh /backend/start-backend.sh
RUN chmod +x /backend/start-backend.sh

ENTRYPOINT ["/backend/start-backend.sh"]
EXPOSE 8080