#!/bin/bash
echo "WARNING - this will WIPE your local database"
echo "WARNING - this will WIPE your local changes to database/schema.rs"
echo "Are you sure you want to continue? (y/n)"
read answer
if [ "$answer" != "y" ]; then
    echo "Aborting"
    exit 1
fi

echo "Deleting images directory"
rm -rf images

cd server/src && diesel database reset

cd ../../seed_data && cargo run --bin seed_data

mv images ..
