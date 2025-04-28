# Khora Game Database Setup

This document provides instructions for setting up the database and managing migrations for the Khora game application.

## Setting Up Supabase

### Prerequisites

- Supabase project created at [supabase.com](https://supabase.com)
- Supabase CLI installed globally: `npm install -g supabase`
- Node.js and npm

### Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/khora-game.git
cd khora-game
```

2. **Set up environment variables**

Create a `.env.local` file in the root directory with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. **Initialize Supabase locally**

```bash
supabase init
```

This creates a `supabase` directory in your project with the necessary configuration files.

## Database Migrations

The database schema and security policies are managed through migrations in the `supabase/migrations` directory.

### Migration Structure

The migrations are organized as follows:

1. **20240422000001_core_game_tables.sql**: Core game tables (profiles, games, participants, player state)
2. **20240422000002_core_game_security.sql**: RLS policies for core game tables
3. **20240422000003_resources_game_security.sql**: RLS policies for resource tables (cities, cards, tokens)
4. **20240422000004_game_progress_security.sql**: RLS policies for progress tables (achievements, logs)

### Running Migrations

To apply migrations to your Supabase project:

```bash
supabase db push
```

To create a new migration:

```bash
supabase migration new your_migration_name
```

This will create a new timestamped migration file in the `supabase/migrations` directory.

## Row-Level Security (RLS) Policies

RLS policies have been implemented for all tables to ensure data security. Key security principles include:

- Users can only access their own profile data
- Game data is restricted to participants or public games
- Game resources are restricted to game participants 
- Reference data (like card definitions) is available to all authenticated users

For detailed documentation on the database schema and security policies, see [database_schema.md](./database_schema.md).

## Testing Security Policies

To test the RLS policies, you can use the provided test suite:

```bash
npm test -- src/tests/security_policies.test.ts
```

Before running the tests:
1. Make sure to update the test user credentials in the test file
2. Create test users in your Supabase Auth dashboard
3. Ensure your Supabase project has the correct RLS policies applied

The tests verify that:
- Unauthenticated users cannot modify data
- Regular users can only access and modify their own data
- Hosts have special privileges within their games
- Data isolation between games is maintained

## Common Issues and Troubleshooting

### RLS Policy Conflicts

If you encounter policy conflicts (multiple policies applying to the same operation), you may need to drop and recreate policies:

```sql
DROP POLICY IF EXISTS "Policy name" ON table_name;
CREATE POLICY "Policy name" ON table_name ...
```

### Testing RLS Policies Manually

You can test RLS policies directly in the Supabase dashboard:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Use the "Impersonate a user" feature with different user IDs
4. Run queries to test access control

### Migration Failures

If migrations fail, check for:
- Syntax errors in SQL files
- Conflicting table or policy names
- Dependencies between tables (foreign keys) 