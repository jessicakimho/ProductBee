# Database Migration Guide

## Account Isolation Migration

This guide explains how to migrate your existing database to support account isolation (Phase 4).

## Problem

After implementing Phase 4, the application requires an `account_id` column on all tables (users, projects, features, feedback). If you have an existing database without these columns, you'll see errors like:

```
Error: Failed to create user
Code: 42703
Message: column "account_id" does not exist
```

## Solution

Run the migration script to add `account_id` columns to all tables.

### Step 1: Backup Your Database

**Important:** Always backup your database before running migrations!

In Supabase:
1. Go to your project
2. Go to Database > Backups
3. Create a manual backup

### Step 2: Run the Migration

1. Open your Supabase project
2. Go to SQL Editor
3. Open the file: `supabase/migration_add_account_id.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" to execute the migration

### Step 3: Verify Migration

The migration script includes a verification query at the end that shows:
- Total rows in each table
- Rows with account_id populated

All rows should have account_id values after the migration.

### Step 4: Test the Application

1. Restart your Next.js development server
2. Try logging in again
3. Verify that users can be created successfully
4. Check that projects, features, and feedback are properly scoped by account_id

## Migration Details

The migration script:

1. **Adds `account_id` columns** to all tables (nullable initially)
2. **Migrates existing data**:
   - Users: Generates account_id from email domain
   - Projects: Uses creator's account_id
   - Features: Uses project's account_id
   - Feedback: Uses project's account_id
3. **Sets columns to NOT NULL** after data migration
4. **Creates indexes** for performance
5. **Verifies migration** with a summary query

## For New Databases

If you're setting up a new database, you don't need to run this migration. Just use the updated `supabase/schema.sql` which already includes `account_id` columns.

## Troubleshooting

### Error: "column account_id already exists"

This means the migration has already been run. You can skip this migration.

### Error: "violates not-null constraint"

This should not happen if you run the migration in order. If it does:
1. Check that all existing users have account_id values
2. Check that all projects have account_id values
3. Check that all features have account_id values
4. Check that all feedback has account_id values

### Error: "relation does not exist"

Make sure you've run the initial schema from `supabase/schema.sql` first.

## Rollback

If you need to rollback this migration:

```sql
-- Remove indexes
DROP INDEX IF EXISTS idx_users_account_id;
DROP INDEX IF EXISTS idx_projects_account_id;
DROP INDEX IF EXISTS idx_features_account_id;
DROP INDEX IF EXISTS idx_feedback_account_id;

-- Remove columns (WARNING: This will delete data if columns are NOT NULL)
ALTER TABLE feedback DROP COLUMN IF EXISTS account_id;
ALTER TABLE features DROP COLUMN IF EXISTS account_id;
ALTER TABLE projects DROP COLUMN IF EXISTS account_id;
ALTER TABLE users DROP COLUMN IF EXISTS account_id;
```

**Warning:** Rolling back will remove account isolation. Only do this if you understand the implications.

## Support

If you encounter issues with the migration, check:
1. The error message in the application logs
2. The Supabase SQL Editor for detailed error messages
3. The migration script comments for step-by-step instructions

