FROM lukemathwalker/cargo-chef:latest-rust-1.68.0 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release --bin server

FROM ubuntu
RUN apt update
RUN apt install -y wget libpq5
RUN wget https://mirrors.edge.kernel.org/ubuntu/pool/main/o/openssl/libssl1.1_1.1.0g-2ubuntu4_amd64.deb \
    && dpkg -i libssl1.1_1.1.0g-2ubuntu4_amd64.deb \
    && rm libssl1.1_1.1.0g-2ubuntu4_amd64.deb

COPY --from=builder /app/target/release/server /
CMD ["./server"]
