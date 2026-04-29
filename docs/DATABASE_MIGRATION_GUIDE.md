# Database Migration Guide

## Overview

This guide explains the complete process of creating and applying database migrations in the project.

**IMPORTANT**: This project uses **Schema Dump** instead of accumulated migrations. After applying changes, you must create a dump of the complete schema and delete old migrations.

## 📋 Post-Migration Checklist (Correct Workflow)

Whenever you create or modify the database, follow these steps:

### ✅ 1. Create Temporary Migration (if necessary)

```bash
# Create migration for your changes
npx supabase migration new add_my_feature

# Edit the created SQL file
# supabase/migrations/TIMESTAMP_add_my_feature.sql
```

### ✅ 2. Apply Changes Locally

```bash
# Apply the migration to local database
npx supabase db push

# OR apply a specific migration
npx supabase migration up
```

### ✅ 3. Generate TypeScript Types (MANDATORY)

```bash
# Generate types from local schema
npx supabase gen types typescript --local > src/types/supabase.ts

# OR from remote schema (production)
npx supabase gen types typescript --project-ref your-project-ref > src/types/supabase.ts
```

**Why is this important?**
- Keeps TypeScript types synchronized with database
- Prevents type errors in queries
- Improves IDE autocomplete
- Detects problems at compile time

### ✅ 4. Test Changes

```bash
# Run all tests
npm run test

# Verify TypeScript types
npm run type-check

# Build to ensure it compiles
npm run build
```

### ✅ 5. Create Complete Schema Dump (CRITICAL)

```bash
# Dump complete schema
npx supabase db dump --schema public --schema auth > supabase/schema.sql

# Verify that the file was created
cat supabase/schema.sql
```

**What does this do?**
- Creates a single SQL file with the ENTIRE current schema
- Includes all tables, indexes, RLS policies, functions, triggers
- Represents the complete database state
- **Replaces the need for multiple migrations**

### ✅ 6. Delete Old Migrations (MANDATORY)

```bash
# Delete ALL old migrations
rm supabase/migrations/*.sql

# OR move to backup if you want to keep history
mkdir -p supabase/migrations_backup
mv supabase/migrations/*.sql supabase/migrations_backup/
```

**Why delete?**
- ✅ Avoids confusion about the actual database state
- ✅ The schema.sql is the single source of truth
- ✅ Old migrations may have conflicts or be outdated
- ✅ Simplifies setup for new developers

### ✅ 7. Commit and Version

```bash
# Add schema dump and types
git add supabase/schema.sql
git add src/types/supabase.ts

# Remove old migrations from git
git rm supabase/migrations/*.sql

# Commit with descriptive message
git commit -m "feat(#123): add my_feature to database schema

- Added new tables: table_a, table_b
- Updated RLS policies for table_x
- Generated TypeScript types
- Replaced migrations with schema dump"

# Increment version
npm version minor  # For new features
npm version patch  # For small changes
npm version major  # For breaking changes
```

### ✅ 8. Apply to Production

```bash
# Via CLI
npx supabase db push --project-ref your-project-ref

# OR via Supabase Dashboard
# Settings > Database > SQL Editor
# Copy and paste content of supabase/schema.sql
# Execute the SQL
```

## 🚀 Automated Scripts

### PowerShell (Windows)

```powershell
# Apply locally
.\scripts\apply-migration.ps1 local

# Apply to production
.\scripts\apply-migration.ps1 remote
```

### Bash (Linux/Mac)

```bash
# Apply locally
./scripts/apply-migration.sh local

# Apply to production
./scripts/apply-migration.sh remote
```

## 📝 Creating New Migration

### 1. Create migration file

```bash
# npx supabase CLI automatically creates with timestamp
npx supabase migration new create_my_table

# This creates: supabase/migrations/20250427120000_create_my_table.sql
```

### 2. Write SQL

```sql
-- supabase/migrations/20250427120000_create_my_table.sql

-- Create table
CREATE TABLE IF NOT EXISTS public.my_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_my_table_user_id ON public.my_table(user_id);
CREATE INDEX idx_my_table_created_at ON public.my_table(created_at DESC);

-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own records"
    ON public.my_table
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records"
    ON public.my_table
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records"
    ON public.my_table
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records"
    ON public.my_table
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE public.my_table IS 'Stores user-specific data';
COMMENT ON COLUMN public.my_table.user_id IS 'Reference to auth.users';
```

### 3. Apply and test

```bash
# Apply locally
npx supabase db push

# Generate types
npx supabase gen types typescript --local > src/types/supabase.ts

# Test
npm run test
```

## 🔄 Migration Rollback

### Option 1: Create reverse migration

```bash
# Create new migration that undoes the previous one
npx supabase migration new rollback_my_table

# Write reverse SQL
DROP TABLE IF EXISTS public.my_table;
```

### Option 2: Reset local (CAUTION!)

```bash
# Complete reset of local database
npx supabase db reset

# This will:
# 1. Drop the database
# 2. Recreate from scratch
# 3. Apply all migrations
# 4. Run seeds
```

### Option 3: Restore backup (Production)

```bash
# Via Supabase Dashboard
# Settings > Database > Backups > Restore
```

## 🧪 Testing Migrations

### Manual Test

```sql
-- Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres

-- Verify table was created
\dt public.my_table

-- Verify RLS is active
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'my_table';

-- Verify policies
SELECT * FROM pg_policies 
WHERE tablename = 'my_table';
```

### Automated Test

```typescript
// tests/db/my-table.test.ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('my_table migration', () => {
  it('should create table with correct schema', async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Test insert
    const { data, error } = await supabase
      .from('my_table')
      .insert({ name: 'Test' })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name', 'Test');
  });

  it('should enforce RLS policies', async () => {
    // Test RLS is working
    // ...
  });
});
```

## 📊 Checking Status

### See applied migrations

```bash
# List all migrations
npx supabase migration list

# See status
npx supabase db status
```

### See current schema

```bash
# Dump complete schema
npx supabase db dump --schema public > schema.sql

# See only table structure
npx supabase db dump --schema public --data-only=false
```

## ⚠️ Best Practices

### ✅ DO

1. **Always test locally first**
   ```bash
   npx supabase db push  # Local
   npm run test      # Test
   npm run build     # Ensure it compiles
   ```

2. **Always generate TypeScript types**
   ```bash
   # MANDATORY after any database change
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

3. **Always create schema dump**
   ```bash
   # After applying changes, create complete dump
   npx supabase db dump --schema public --schema auth > supabase/schema.sql
   ```

4. **Always delete old migrations**
   ```bash
   # Keep only schema.sql as source of truth
   rm supabase/migrations/*.sql
   ```

5. **Add comments in SQL**
   ```sql
   COMMENT ON TABLE my_table IS 'Purpose of this table';
   COMMENT ON COLUMN my_table.user_id IS 'Reference to auth.users';
   ```

6. **Create indexes for frequent queries**
   ```sql
   CREATE INDEX idx_user_id ON my_table(user_id);
   CREATE INDEX idx_created_at ON my_table(created_at DESC);
   ```

7. **Always enable RLS**
   ```sql
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view their own records"
     ON my_table FOR SELECT
     USING (auth.uid() = user_id);
   ```

8. **Version schema.sql and types**
   ```bash
   git add supabase/schema.sql src/types/supabase.ts
   git commit -m "feat(#123): add my_table to schema"
   ```

### ❌ DON'T

1. **Never commit old migrations**
   - Always delete after creating schema dump
   - The schema.sql is the single source of truth

2. **Never commit without generating types**
   ```bash
   # ALWAYS generate types after database changes
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

3. **Never apply to production without testing locally**
   ```bash
   # ALWAYS test local first
   npx supabase db push  # Local
   npm run test      # Test
   npm run build     # Build
   # Only then apply to production
   ```

4. **Never keep multiple migrations**
   - Use single schema dump
   - Delete migrations after creating dump
   - Avoids confusion and conflicts

5. **Never use `CASCADE` without understanding the impact**
   ```sql
   -- Be careful with this:
   DROP TABLE my_table CASCADE;  -- May drop other tables!
   ```

6. **Never drop tables in production without backup**
   - Always backup first via Supabase Dashboard
   - Settings > Database > Backups

## 🔍 Troubleshooting

### Error: "Migration already applied"

```bash
# See migration history
npx supabase migration list

# If necessary, mark as applied manually
# (Be careful! Only do this if you're sure)
```

### Error: "Permission denied"

```bash
# Check if you're using the correct user
# npx supabase uses 'postgres' as superuser

# Connect as superuser
psql postgresql://postgres:postgres@localhost:54322/postgres
```

### Error: "Types out of sync"

```bash
# Regenerate types
npx supabase gen types typescript --local > src/types/supabase.ts

# Verify file was created
cat src/types/supabase.ts
```

### Local database won't start

```bash
# Stop everything
npx supabase stop

# Clean volumes
npx supabase db reset

# Start again
npx supabase start
```

## 📚 Resources

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Quick Summary

```bash
# 1. Create temporary migration (if necessary)
npx supabase migration new my_feature

# 2. Write SQL
# Edit: supabase/migrations/TIMESTAMP_my_feature.sql

# 3. Apply locally
npx supabase db push

# 4. Generate types (MANDATORY)
npx supabase gen types typescript --local > src/types/supabase.ts

# 5. Test
npm run test
npm run build

# 6. Create schema dump (CRITICAL)
npx supabase db dump --schema public --schema auth > supabase/schema.sql

# 7. Delete old migrations (MANDATORY)
rm supabase/migrations/*.sql

# 8. Commit
git add supabase/schema.sql src/types/supabase.ts
git rm supabase/migrations/*.sql
git commit -m "feat(#123): add my_feature to database schema"
npm version minor

# 9. Apply to production
npx supabase db push --project-ref your-project-ref
```

Always in this order! ✅

## 🆕 New Developer Setup

With the schema dump workflow, a new developer only needs:

```bash
# 1. Clone the repository
git clone repo-url

# 2. Install dependencies
npm install

# 3. Start Supabase local
npx supabase start

# 4. Apply complete schema (single file)
npx supabase db reset

# 5. Done! Database is in correct state
```

## 💡 Philosophy: Schema Dump vs Migrations

### ❌ Problem with Accumulated Migrations

- Dozens of migration files
- Hard to know the actual database state
- Migrations may conflict or be out of order
- Slow setup for new developers
- Confusing and hard to maintain history

### ✅ Solution: Single Schema Dump

- **One SQL file** with the complete database state
- **Total clarity** about current schema
- **Fast setup** for new developers
- **Fewer errors** from conflicting migrations
- **Easy maintenance** of schema

### How It Works

1. You create a temporary migration for your changes
2. Apply locally and test
3. Make a dump of the complete schema
4. **Delete all old migrations**
5. The `schema.sql` becomes the single source of truth

### Advantages

✅ **Simplicity**: One file instead of dozens
✅ **Clarity**: See exactly the current database state
✅ **Fewer errors**: No risk of conflicting migrations
✅ **Fast setup**: New devs apply one file only
✅ **Easy maintenance**: No need to manage migration history
✅ **Types always updated**: Workflow forces type generation
