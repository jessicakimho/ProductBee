-- ProductBee Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
--
-- MIGRATION NOTES:
-- If you have an existing database, you'll need to add account_id columns:
-- 1. ALTER TABLE users ADD COLUMN account_id TEXT;
-- 2. ALTER TABLE projects ADD COLUMN account_id TEXT;
-- 3. ALTER TABLE features ADD COLUMN account_id TEXT;
-- 4. ALTER TABLE feedback ADD COLUMN account_id TEXT;
-- 5. Update existing records with account_id values (based on your migration strategy)
-- 6. ALTER TABLE users ALTER COLUMN account_id SET NOT NULL;
-- 7. ALTER TABLE projects ALTER COLUMN account_id SET NOT NULL;
-- 8. ALTER TABLE features ALTER COLUMN account_id SET NOT NULL;
-- 9. ALTER TABLE feedback ALTER COLUMN account_id SET NOT NULL;
-- 10. Create indexes as shown below

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('pm', 'engineer', 'admin', 'viewer')) DEFAULT 'viewer',
  account_id TEXT NOT NULL,
  team_id TEXT,
  specialization TEXT CHECK (specialization IN ('Backend', 'Frontend', 'QA', 'DevOps')),
  vacation_dates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  roadmap JSONB NOT NULL, -- { summary: string, riskLevel: string }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features table
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('backlog', 'active', 'blocked', 'complete')) DEFAULT 'backlog',
  priority TEXT CHECK (priority IN ('P0', 'P1', 'P2')) NOT NULL,
  effort_estimate_weeks INTEGER NOT NULL,
  depends_on UUID[] DEFAULT '{}',
  -- Jira-style fields (Phase 6)
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter UUID REFERENCES users(id) ON DELETE SET NULL,
  story_points INTEGER,
  labels TEXT[] DEFAULT '{}',
  acceptance_criteria TEXT,
  ticket_type TEXT CHECK (ticket_type IN ('feature', 'bug', 'epic', 'story')) DEFAULT 'feature',
  -- Timeline fields (Phase 7)
  start_date DATE,
  end_date DATE,
  duration INTEGER, -- Duration in days
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  type TEXT CHECK (type IN ('comment', 'proposal')) NOT NULL,
  content TEXT NOT NULL,
  proposed_roadmap JSONB,
  ai_analysis TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_specialization ON users(specialization);
CREATE INDEX IF NOT EXISTS idx_users_vacation_dates ON users USING GIN (vacation_dates);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_features_project_id ON features(project_id);
CREATE INDEX IF NOT EXISTS idx_features_account_id ON features(account_id);
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON features(assigned_to);
CREATE INDEX IF NOT EXISTS idx_features_reporter ON features(reporter);
CREATE INDEX IF NOT EXISTS idx_features_ticket_type ON features(ticket_type);
CREATE INDEX IF NOT EXISTS idx_features_labels ON features USING GIN (labels);
CREATE INDEX IF NOT EXISTS idx_features_start_date ON features(start_date);
CREATE INDEX IF NOT EXISTS idx_features_end_date ON features(end_date);
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_feature_id ON feedback(feature_id);
CREATE INDEX IF NOT EXISTS idx_feedback_account_id ON feedback(account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Enable real-time for tables (requires Supabase Realtime to be enabled)
-- Note: You may need to enable Realtime in your Supabase project settings
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE features;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;

-- Row Level Security (RLS) Policies
-- Note: Since we're using Auth0, we'll disable RLS for now and handle authorization in the API layer
-- You can enable RLS later if you migrate to Supabase Auth or implement custom JWT verification

-- For now, disable RLS to allow API access (authorization handled in Next.js API routes)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE features DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- If you want to enable RLS later with Auth0 integration, you would need to:
-- 1. Create a function to verify Auth0 JWT tokens
-- 2. Create policies that check user roles from the users table
-- 3. Use service role key in API routes for authenticated operations

