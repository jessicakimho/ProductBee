-- Migration: Add account_id to all tables for account isolation
-- Run this SQL in your Supabase SQL Editor
-- This migration adds account_id columns and migrates existing data

-- Step 1: Add account_id column to users table (nullable first)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Step 2: Add account_id column to projects table (nullable first)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Step 3: Add account_id column to features table (nullable first)
ALTER TABLE features ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Step 4: Add account_id column to feedback table (nullable first)
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Step 5: Migrate existing data
-- For users: generate account_id from email domain or use a default
UPDATE users 
SET account_id = COALESCE(
  'auth0|' || SPLIT_PART(email, '@', 2),
  'default-account'
)
WHERE account_id IS NULL;

-- For projects: use the creator's accaount_id
UPDATE projects p
SET account_id = (
  SELECT u.account_id 
  FROM users u 
  WHERE u.id = p.created_by
)
WHERE account_id IS NULL;

-- For features: use the project's account_id
UPDATE features f
SET account_id = (
  SELECT p.account_id 
  FROM projects p 
  WHERE p.id = f.project_id
)
WHERE account_id IS NULL;

-- For feedback: use the project's account_id
UPDATE feedback fb
SET account_id = (
  SELECT p.account_id 
  FROM projects p 
  WHERE p.id = fb.project_id
)
WHERE account_id IS NULL;

-- Step 6: Set account_id to NOT NULL
ALTER TABLE users ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE features ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE feedback ALTER COLUMN account_id SET NOT NULL;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_features_account_id ON features(account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_account_id ON feedback(account_id);

-- Step 8: Verify migration
SELECT 
  'users' as table_name,
  COUNT(*) as total_rows,
  COUNT(account_id) as rows_with_account_id
FROM users
UNION ALL
SELECT 
  'projects' as table_name,
  COUNT(*) as total_rows,
  COUNT(account_id) as rows_with_account_id
FROM projects
UNION ALL
SELECT 
  'features' as table_name,
  COUNT(*) as total_rows,
  COUNT(account_id) as rows_with_account_id
FROM features
UNION ALL
SELECT 
  'feedback' as table_name,
  COUNT(*) as total_rows,
  COUNT(account_id) as rows_with_account_id
FROM feedback;

