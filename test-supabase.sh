#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Khora Game Database Migration Test ===${NC}"
echo -e "${YELLOW}This script will run the Supabase migrations in order.${NC}"
echo

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo -e "${RED}Error: PostgreSQL client (psql) is not installed.${NC}"
  echo "Please install it with your package manager (e.g. brew install postgresql)."
  exit 1
fi

# Database connection details (adjust as needed for your environment)
DB_HOST="localhost"
DB_PORT="54322"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Test the connection
echo -e "${BLUE}Testing database connection...${NC}"
if ! psql "${DB_URL}" -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${RED}Error: Cannot connect to the database.${NC}"
  echo "Make sure Supabase is running with: supabase start"
  exit 1
fi
echo -e "${GREEN}Database connection successful.${NC}"

# Migration files in order
MIGRATIONS=(
  "src/db/migrations/01_core_game_tables.sql"
  "src/db/migrations/01_core_game_security.sql"
  "src/db/migrations/02_game_resource_tables.sql"
  "src/db/migrations/02_resources_game_security.sql"
  "src/db/migrations/03_game_progress_tables.sql"
  "src/db/migrations/03_game_progress_security.sql"
)

# Run migrations
for migration in "${MIGRATIONS[@]}"; do
  echo -e "${BLUE}Running migration: ${migration}${NC}"
  
  if [ ! -f "$migration" ]; then
    echo -e "${YELLOW}Warning: Migration file not found: ${migration}${NC}"
    continue
  fi
  
  # Run the migration
  psql "${DB_URL}" -f "$migration" && {
    echo -e "${GREEN}Successfully applied migration: ${migration}${NC}"
  } || {
    echo -e "${RED}Failed to apply migration: ${migration}${NC}"
    exit 1
  }
  
  echo
done

echo -e "${GREEN}All migrations completed successfully!${NC}"
echo -e "${YELLOW}You can now test the application by starting the development server:${NC}"
echo "npm run dev"
echo
echo -e "${YELLOW}Then visit: http://localhost:3000/test-supabase${NC}" 