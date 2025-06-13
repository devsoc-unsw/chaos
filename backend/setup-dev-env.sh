#!/bin/sh

# Drop the caller into a new shell that has the required dependencies, namely
# postgres and sqlx, installed and running. This is required because the Rust
# backend can only be built and run if the database is also running, due to
# sqlx.

# Write .env file to temporary file.
tmp_env_file="$(mktemp)"
trap 'rm -rf "$tmp_env_file"' EXIT INT TERM
cat << 'EOF' > "$tmp_env_file"
DATABASE_URL="postgres://user:password@localhost:5432/chaos"
JWT_SECRET="test_secret"
GOOGLE_CLIENT_ID="test"
GOOGLE_CLIENT_SECRET="test"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback"
S3_BUCKET_NAME="chaos-storage"
S3_ACCESS_KEY="test_access_key"
S3_SECRET_KEY="test_secret_key"
S3_ENDPOINT="https://chaos-storage.s3.ap-southeast-1.amazonaws.com"
S3_REGION_NAME="ap-southeast-1"
EOF

# Check the user has all required tools installed.
for cmd in "which cargo" "which docker && docker info" "which docker-compose || docker compose"; do
	if ! eval "$cmd" 1>/dev/null 2>&1; then
		echo "The command '$cmd' failed, indicating you might not have that tool installed." >&2
		exit 1
	fi
done

# Create .env file.
env_file=.env

# The .env file already exists.
if [ -f "$env_file" ]; then
	# If existing env file differs from new one, save the existing env file to a backup file.
	if ! diff "$env_file" "$tmp_env_file" > /dev/null; then
		backup_env_file="$env_file"
		while [ -f "$backup_env_file" ]; do
			# Append `.backup` to backup filename until we find a filename that doesn't exist yet.
			backup_env_file="$backup_env_file.backup"
		done

		echo "Saving existing env file '$env_file' to backup env file '$backup_env_file'"
		mv "$env_file" "$backup_env_file"
	fi
fi

echo "Overwriting $env_file file"
cp "$tmp_env_file" "$env_file"

# Install sqlx if it isn't installed yet.
if ! which sqlx >/dev/null; then
	echo "Installing sqlx"
	cargo install sqlx-cli --no-default-features --features native-tls,postgres
else
	echo "sqlx already installed"
fi

# Run postgres database in the background.
this_script_dir="$(dirname "$(realpath "$0")")"
docker_compose_file_name="setup-test-database.yml"
docker_compose_file_path="$this_script_dir/$docker_compose_file_name"

echo 'Starting up postgres database in docker'
docker-compose -f "$docker_compose_file_path" up --detach || exit 1

# Ensure the docker container gets killed once this script exits.
trap 'echo "shutting down $docker_compose_file_path" && docker-compose -f "$docker_compose_file_path" down' EXIT INT TERM

# Wait for the database to be ready.
echo "Waiting for database to be ready"
sleep 3

# Setup sqlx.
echo "Setting up sqlx"
sqlx database create || exit 1
sqlx migrate run || exit 1

"$SHELL"
