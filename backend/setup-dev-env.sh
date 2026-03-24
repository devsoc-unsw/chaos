#!/bin/sh

# Drop the caller into a new shell that has the required dependencies, namely
# postgres and sqlx, installed and running. This is required because the Rust
# backend can only be built and run if the database is also running, due to
# sqlx.

# Write .env file to temporary file.
tmp_env_file="$(mktemp)"
trap 'rm -rf "$tmp_env_file"' EXIT INT TERM
cat << 'EOF' > "$tmp_env_file"
DATABASE_URL="postgres://postgres:password@localhost:5432/chaos"
JWT_SECRET="test_secret"
GOOGLE_CLIENT_ID="test"
GOOGLE_CLIENT_SECRET="test"
GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback"
S3_BUCKET_NAME="chaos-storage"
S3_ACCESS_KEY="test_access_key"
S3_SECRET_KEY="test_secret_key"
S3_ENDPOINT="https://chaos-storage.s3.ap-southeast-1.amazonaws.com"
S3_REGION_NAME="ap-southeast-1"
DEV_ENV="dev"
SMTP_USERNAME="test_username"
SMTP_PASSWORD="test_password"
SMTP_HOST="smtp.example.com"
EOF

# Check the user has all required tools installed.
for cmd in "which cargo" "which docker && docker info"; do
	if ! eval "$cmd" 1>/dev/null 2>&1; then
		echo "The command '$cmd' failed, indicating you might not have that tool installed." >&2
		exit 1
	fi
done

# Check if docker is available on the machine. Please install docker if don't have it.
if docker compose version >/dev/null 2>&1; then
	compose_cmd="docker compose"
elif which docker-compose >/dev/null 2>&1; then
	compose_cmd="docker-compose"
else
	echo "Neither 'docker compose' nor 'docker-compose' is available. Please install Docker and try again." >&2
	exit 1
fi

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
repo_root="$(realpath "$this_script_dir/..")"
docker_compose_file_path="$repo_root/docker-compose.local.yml"

echo 'Starting up postgres db container in docker-compose.local.yml'
# Run the db container only using docker compose.
$compose_cmd -f "$docker_compose_file_path" up --detach db || exit 1

echo "Waiting for db container to be ready"
# Wait for 30 seconds for the db container to be ready.
max_attempts=30
attempt=1

while [ "$attempt" -le "$max_attempts" ]; do
	if PGPASSWORD=password psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1" >/dev/null 2>&1; then
		break
	fi
	echo "Database not ready yet (attempt $attempt/$max_attempts), retrying..."
	sleep 2
	attempt=$((attempt + 1))
done

if [ "$attempt" -gt "$max_attempts" ]; then
	echo "Database did not become ready in time." >&2
	exit 1
fi

# Setup sqlx.
echo "Setting up sqlx"
sqlx database create || exit 1
sqlx migrate run || exit 1

echo "\nDev environment setup complete! Only the db container is running. You can start the BE and FE containers now.\n"
echo "Don't forget to run ./setup-admin-db-dev.sh to set up the admin account. \n"

"$SHELL"
