#!/bin/sh

# Create .env file.
rm .env
echo 'DATABASE_URL="postgres://user:password@localhost:5432/chaos"' >> .env
echo 'JWT_SECRET="test_secret"' >> .env
echo 'GOOGLE_CLIENT_ID="test"' >> .env
echo 'GOOGLE_CLIENT_SECRET="test"' >> .env
echo 'GOOGLE_REDIRECT_URI="http://localhost:3000/auth/callback"' >> .env

# Install sqlx if it isn't installed yet.
if [ !which sqlx; ]; then
	echo "Installing sqlx"
	cargo install sqlx-cli --no-default-features --features native-tls,postgres
fi

# Run postgres database.
echo 'Starting up postgres database in docker'
docker-compose -f setup-test-database.yml up

# Wait for the database to be ready.
sleep 2

# Setup sqlx database.
echo 'Setting up sqlx'
sqlx database create
sqlx migrate run
