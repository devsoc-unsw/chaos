#!/bin/bash
set -e

echo "Running database migrations..."
cd /backend

sqlx database create
if ! sqlx migrate run; then
  echo "Migrations failed! Aborting startup..."
  exit 1
fi

echo "Migrations run successfully!"

# Run database seeding (this'll be idempotent so we're chill)
echo "Running database seeding..."
cd /backend
if /backend/deploy-seeder; then
  echo "Seeding completed successfully!"
else
  echo "Seeding failed! Aborting startup..."
  exit 1
fi

echo "Starting server..."
exec /backend/server