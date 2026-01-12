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
echo "Running server..."
exec /backend/server