#!/bin/sh

# THIS SCRIPT ASSUMES THAT THE DB CONTAINER IS RUNNING.
# Please run ./setup-dev-env.sh first. Before running this script.
#
# Usage: ./setup-admin-db-dev.sh <email>
# Example: ./setup-admin-db-dev.sh peter@gmail.com

if [ $# -ne 1 ] || [ -z "$1" ]; then
  echo "Usage: $0 <email>" >&2
  echo "Example: $0 peter@gmail.com" >&2
  exit 1
fi

email="$1"

this_script_dir="$(dirname "$(realpath "$0")")"
repo_root="$(realpath "$this_script_dir/..")"

echo "Dropping the database..."
sqlx db drop -f || exit 1
echo "Creating the database..."
sqlx db create || exit 1
echo "Running the migrations..."
sqlx migrate run || exit 1

working_dir="$repo_root/backend/database-seeding"
cd "$working_dir" || exit 1
echo "Working directory: $working_dir"

echo "\nDatabase reset successfully!\n"

cargo run -- --email "$email"

echo "\nAdmin account set up successfully!\n"
