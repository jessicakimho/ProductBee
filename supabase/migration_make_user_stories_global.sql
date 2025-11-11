-- Migration: Make user_stories global (account-level) instead of project-scoped
-- This allows user stories to be used across all projects within an account

-- Step 1: Drop the foreign key constraint (we'll recreate it to allow NULL)
ALTER TABLE user_stories 
  DROP CONSTRAINT IF EXISTS user_stories_project_id_fkey;

-- Step 2: Make project_id nullable
ALTER TABLE user_stories 
  ALTER COLUMN project_id DROP NOT NULL;

-- Step 3: Recreate the foreign key constraint (allows NULL values)
ALTER TABLE user_stories 
  ADD CONSTRAINT user_stories_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE SET NULL;

-- Note: The index on project_id is kept for performance when filtering by project
-- Existing user stories will keep their project_id values for backward compatibility
-- New user stories can be created without a project_id (global to account)

