#!/bin/sh

# Drop the caller into a new shell that has the required dependencies, namely
# postgres and sqlx, installed and running. This is required because the Rust
# backend can only be built and run if the database is also running, due to
# sqlx.

# Create .env file.
env_file=.env
if [ -f "$env_file" ]; then
	while true; do
		printf "You already have a $env_file file, are you sure you want to continue, as this will override your $env_file file? [yn] "
		read -r answer
		case "$answer" in
			y)
				# Continue with execution.
				break
				;;
			n)
				echo "Aborting"
				exit 0
				;;
			*)
				# Try again.
				echo "Invalid answer. Please type either 'y' for yes, or 'n' for no."
				continue
				;;
		esac
	done
fi

echo "Overwriting $env_file file"

cat << 'EOF' > "$env_file"
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
docker-compose -f "$docker_compose_file_path" up --detach

# Ensure the docker container gets killed once this script exits.
trap 'echo "shutting down $docker_compose_file_path" && docker-compose -f "$docker_compose_file_path" down' EXIT

# Wait for the database to be ready.
echo "Waiting for database to be ready"
sleep 3

# Setup sqlx.
echo "Setting up sqlx"
sqlx database create
sqlx migrate run

"$SHELL"
