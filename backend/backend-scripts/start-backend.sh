#!/bin/bash
set -e

echo "Running database migrations..."
cd /backend

if ! sqlx migrate run; then
  echo "Migrations failed! Aborting startup..."
  exit 1
fi

echo "Migrations run successfully! Starting server..."
exec /backend/server