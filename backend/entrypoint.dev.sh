#!/bin/sh
set -e

# Create migrations directory if it doesn't exist
mkdir -p /app/api/migrations
touch /app/api/migrations/__init__.py

# Create migrations non-interactively if they don't exist
echo "Creating migrations if needed..."
python manage.py makemigrations api --noinput

# Show migrations that will be applied
echo "Current migration status:"
python manage.py showmigrations

# Apply migrations
echo "Applying migrations..."
python manage.py migrate --noinput

# Seed product data
echo "Seeding product data..."
python manage.py seed_products --count 10

# Start the main process
exec "$@" 