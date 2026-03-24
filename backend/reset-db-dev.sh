#!/bin/sh

# THIS SCRIPT ASSUMES THAT THE DB CONTAINER IS RUNNING.

# Drop the database, create it, and run the migrations.
echo "Dropping the database..."
sqlx db drop -f || exit 1
echo "Creating the database..."
sqlx db create || exit 1
echo "Running the migrations..."
sqlx migrate run || exit 1

echo "\nDatabase reset successfully!\n"