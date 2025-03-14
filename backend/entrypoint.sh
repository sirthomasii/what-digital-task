#!/bin/sh
set -e

# Ensure migrations directory exists
mkdir -p /app/api/migrations
touch /app/api/migrations/__init__.py

# Show current migration status
echo "Current migration status:"
python manage.py showmigrations

# Apply any pending migrations
echo "Applying pending migrations..."
python manage.py migrate --noinput

# Seed products if table is empty
echo "Seeding products..."
python manage.py seed_products

# Start the main process
exec "$@" 