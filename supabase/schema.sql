-- ProductBee Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('pm', 'engineer', 'admin', 'viewer')) DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  roadmap JSONB NOT NULL, -- { summary: string, riskLevel: string }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features table
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('backlog', 'active', 'blocked', 'complete')) DEFAULT 'backlog',
  priority TEXT CHECK (priority IN ('P0', 'P1', 'P2')) NOT NULL,
  effort_estimate_weeks INTEGER NOT NULL,
  depends_on UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('comment', 'proposal')) NOT NULL,
  content TEXT NOT NULL,
  proposed_roadmap JSONB,
  ai_analysis TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_features_project_id ON features(project_id);
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_feature_id ON feedback(feature_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Enable real-time for tables (optional - only if you want real-time features)
-- This checks if the publication exists and if tables are already added
DO $$
BEGIN
  -- Check if supabase_realtime publication exists
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Add tables to realtime publication if not already added
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'features'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE features;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'feedback'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
    END IF;
  END IF;
END $$;

-- Row Level Security (RLS) Policies
-- Note: Since we're using Auth0, we'll disable RLS for now and handle authorization in the API layer
-- You can enable RLS later if you migrate to Supabase Auth or implement custom JWT verification
-- For now, disable RLS to allow API access (authorization handled in Next.js API routes)

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE features DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;

-- Note: If you want to enable RLS later with Auth0 integration, you would need to:
-- 1. Create a function to verify Auth0 JWT tokens
-- 2. Create policies that check user roles from the users table
-- 3. Use service role key in API routes for authenticated operations

