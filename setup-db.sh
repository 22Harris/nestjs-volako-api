#!/bin/bash
# Run this script as a user with PostgreSQL superuser access
# Usage: sudo -u postgres bash setup-db.sh
#   OR:  psql -U <admin_user> -f setup-db.sh

set -e

DBNAME="wallet_db"
DBUSER="postgres"
DBPASS="postgres"

echo "Setting up database..."

# Create DB if not exists
psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DBNAME'" | grep -q 1 || \
  psql -c "CREATE DATABASE $DBNAME;"

# Apply initial migration (if not already applied)
psql -d $DBNAME -f prisma/migrations/20260117151642_init/migration.sql 2>/dev/null || true

# Apply new migration
psql -d $DBNAME -f prisma/migrations/20260304000000_add_new_models/migration.sql

# Mark migrations as applied
psql -d $DBNAME << 'SQL'
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  (gen_random_uuid()::text, 'init', NOW(), '20260117151642_init', NULL, NULL, NOW(), 1),
  (gen_random_uuid()::text, 'new', NOW(), '20260304000000_add_new_models', NULL, NULL, NOW(), 1)
ON CONFLICT DO NOTHING;
SQL

echo "Database setup complete!"
echo "Now run: npx prisma generate && npm run seed"
