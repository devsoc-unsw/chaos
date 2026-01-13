#!/bin/bash
set -e

echo "Running database migrations..."
cd /backend

sqlx database create
if ! sqlx migrate run; then
  echo "Migrations failed! Aborting startup..."
  exit 1
fi

echo "Migrations run successfully! Starting server..."
echo "Checking server binary..."
test -f /backend/server && echo "Server binary exists" || echo "ERROR: Server binary not found!"
test -x /backend/server && echo "Server binary is executable" || echo "ERROR: Server binary not executable!"

# Check binary file info
echo "Binary file info:"
ls -lh /backend/server
file /backend/server 2>&1 || echo "file command not available"

# Try to check dynamic dependencies (if ldd available)
echo "Checking binary dependencies:"
ldd /backend/server 2>&1 || echo "ldd failed or not available"

echo "Running server..."
exec /backend/server