#!/bin/bash
set -e

echo "Starting post-create setup..."

# Create backend/.env
echo "Creating backend/.env..."
cat << 'EOF' > backend/.env
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

# Install sqlx-cli if not present
if ! command -V sqlx &> /dev/null; then
    echo "Installing sqlx-cli..."
    cargo install sqlx-cli --no-default-features --features native-tls,postgres
fi

# Wait for Postgres
echo "Waiting for Postgres..."
until PGPASSWORD=password psql -h "db" -U "postgres" -d "chaos" -c '\q' 2>/dev/null; do
  echo "Waiting for postgres at db:5432..."
  sleep 2
done

# Setup DB
echo "Setting up database..."
cd backend

# Create database if not exists
sqlx database create || true
sqlx migrate run

echo "Setup complete!"
