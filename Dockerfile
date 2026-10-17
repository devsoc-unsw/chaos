FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install essential linux commands
RUN apt update && apt install -y --no-install-recommends \
    ca-certificates \
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
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# ubuntu:24.04 ships an `ubuntu` user at uid 1000. Rename it and, when
# provided, remap it to the host uid/gid so files created in the bind-mounted
# repo stay owned by the developer instead of root.
ARG USER_UID=1000
ARG USER_GID=1000
RUN usermod -l dev -d /home/dev -m ubuntu \
    && groupmod -n dev ubuntu \
    && if [ "$(id -u dev)" != "$USER_UID" ]; then usermod -u "$USER_UID" dev; fi \
    && if [ "$(id -g dev)" != "$USER_GID" ]; then \
         if getent group "$USER_GID" >/dev/null; then \
           usermod -g "$USER_GID" dev; \
         else \
           groupmod -g "$USER_GID" dev; \
         fi; \
       fi \
    && echo "dev ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/dev \
    && chmod 0440 /etc/sudoers.d/dev

USER dev
ENV HOME=/home/dev
ENV BUN_INSTALL=/home/dev/.bun
ENV PATH="${BUN_INSTALL}/bin:/home/dev/.cargo/bin:${PATH}"

RUN curl -fsSL https://bun.sh/install | bash
RUN rustup default stable
RUN cargo install sqlx-cli --no-default-features --features native-tls,postgres

# Set-up bashrc to have basic colours
RUN { \
    echo "alias ls='ls --color=auto'"; \
    echo "alias ll='ls -la --color=auto'"; \
    echo "alias grep='grep --color=auto'"; \
    echo "export PS1='\\[\\033[1;32m\\][dev-container]\\[\\033[0m\\] \\w \\$ '"; \
    echo "export BUN_INSTALL=\"\$HOME/.bun\""; \
    echo "export PATH=\"\$BUN_INSTALL/bin:\$HOME/.cargo/bin:\$PATH\""; \
} >> "$HOME/.bashrc"

RUN mkdir -p /home/dev/chaos
WORKDIR /home/dev/chaos
