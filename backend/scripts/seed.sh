echo "WARNING - this will WIPE your local database"
echo "WARNING - this will WIPE your local changes to database/schema.rs"
echo "Are you sure you want to continue? (y/n)"
read answer
if [ "$answer" != "y" ]; then
    echo "Aborting"
    exit 1
fi

diesel database reset
git restore src/database/schema.rs

SEED=true cargo run
