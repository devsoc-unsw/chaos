FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Setup packages
RUN apt update && export DEBIAN_FRONTEND=noninteractive \
    && apt -y install --no-install-recommends libssl-dev pkgconf build-essential postgresql-client

# Note: Rust, Node.js, and Bun are installed via devcontainer.json features.
# sqlx-cli will be installed in post-create.sh to ensure it uses the correct cargo environment.
