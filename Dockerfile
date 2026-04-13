FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV BUN_INSTALL=/root/.bun
ENV PATH="${BUN_INSTALL}/bin:/root/.cargo/bin:${PATH}"

# Install essential linux commands
RUN apt update && apt install -y \
    sudo \
    curl \
    git \
    vim \
    unzip \
    ripgrep \
    rustup \
    build-essential \
    libssl-dev \
    pkg-config \
    postgresql-client

RUN curl -fsSL https://bun.sh/install | bash
RUN rustup default stable

RUN cargo install sqlx-cli --no-default-features --features native-tls,postgres

# Set-up bashrc to have basic colours
RUN { \
    echo "alias ls='ls --color=auto'"; \
    echo "alias ll='ls -la --color=auto'"; \
    echo "alias grep='grep --color=auto'"; \
    echo "export PS1='\\[\\033[1;32m\\][dev-container]\\[\\033[0m\\] \\w \\$ '"; \
    echo "export BUN_INSTALL=\"$HOME/.bun\""; \
    echo "export PATH=\"$BUN_INSTALL/bin:$HOME/.cargo/bin:$PATH\""; \
} >> ~/.bashrc

# Make Chaos folder
RUN mkdir -p /root/chaos
WORKDIR /root/chaos

