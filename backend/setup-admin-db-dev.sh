#!/bin/sh

# THIS SCRIPT ASSUMES THAT THE DB CONTAINER IS RUNNING.

# Please run ./setup-dev-env.sh first. Before running this script.
this_script_dir="$(dirname "$(realpath "$0")")"
repo_root="$(realpath "$this_script_dir/..")"
working_dir="$repo_root/backend/database-seeding"
cd "$working_dir"
echo "Working directory: $working_dir"

# IMPORTANT: Replace YOUR_GMAIL with your account gmail.
# Run the database seeding script to set up the admin account.
# Like e.g. cargo run -- --email peter@gmail.com. Replace YOUR_GMAIL with your account gmail.
cargo run -- --email "degussudarmawan12@gmail.com"

echo "\nAdmin account set up successfully!\n"
