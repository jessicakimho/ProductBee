-- ProductBee Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
--
-- This schema includes all tables, indexes, and real-time configuration
-- for the ProductBee application.

-- ============================================================================
-- TABLES
-- ============================================================================

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

-- Features table (tickets)
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
  -- Jira-style fields
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter UUID REFERENCES users(id) ON DELETE SET NULL,
  story_points INTEGER,
  labels TEXT[] DEFAULT '{}',
  acceptance_criteria TEXT,
  ticket_type TEXT CHECK (ticket_type IN ('feature', 'bug', 'epic', 'story')) DEFAULT 'feature',
  -- Timeline fields
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

-- Pending changes table (for drag-and-drop status change proposals)
CREATE TABLE IF NOT EXISTS pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  account_id TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stories table (global, account-scoped, optionally project-linked)
CREATE TABLE IF NOT EXISTS user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL, -- Nullable for global user stories
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  goal TEXT NOT NULL,
  benefit TEXT NOT NULL,
  demographics JSONB,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket-User Story join table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS ticket_user_story (
  ticket_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  user_story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (ticket_id, user_story_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_users_specialization ON users(specialization);
CREATE INDEX IF NOT EXISTS idx_users_vacation_dates ON users USING GIN (vacation_dates);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);

-- Features indexes
CREATE INDEX IF NOT EXISTS idx_features_project_id ON features(project_id);
CREATE INDEX IF NOT EXISTS idx_features_account_id ON features(account_id);
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON features(assigned_to);
CREATE INDEX IF NOT EXISTS idx_features_reporter ON features(reporter);
CREATE INDEX IF NOT EXISTS idx_features_ticket_type ON features(ticket_type);
CREATE INDEX IF NOT EXISTS idx_features_labels ON features USING GIN (labels);
CREATE INDEX IF NOT EXISTS idx_features_start_date ON features(start_date);
CREATE INDEX IF NOT EXISTS idx_features_end_date ON features(end_date);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_project_id ON feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_feedback_feature_id ON feedback(feature_id);
CREATE INDEX IF NOT EXISTS idx_feedback_account_id ON feedback(account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);

-- Pending changes indexes
CREATE INDEX IF NOT EXISTS idx_pending_changes_feature_id ON pending_changes(feature_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_account_id ON pending_changes(account_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_proposed_by ON pending_changes(proposed_by);
CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON pending_changes(status);
CREATE INDEX IF NOT EXISTS idx_pending_changes_created_at ON pending_changes(created_at);

-- User stories indexes
CREATE INDEX IF NOT EXISTS idx_user_stories_project_id ON user_stories(project_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_account_id ON user_stories(account_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_created_by ON user_stories(created_by);

-- Ticket-User Story join table indexes
CREATE INDEX IF NOT EXISTS idx_ticket_user_story_ticket_id ON ticket_user_story(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_user_story_user_story_id ON ticket_user_story(user_story_id);
CREATE INDEX IF NOT EXISTS idx_ticket_user_story_account_id ON ticket_user_story(account_id);

-- ============================================================================
-- REAL-TIME CONFIGURATION
-- ============================================================================

-- Enable real-time for tables (requires Supabase Realtime to be enabled)
-- Note: You may need to enable Realtime in your Supabase project settings
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE features;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE pending_changes;
ALTER PUBLICATION supabase_realtime ADD TABLE user_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_user_story;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS is disabled because authorization is handled in the Next.js API layer.
-- This approach provides:
-- 1. Centralized authorization logic in API routes
-- 2. Account isolation via account_id filtering
-- 3. Role-based permissions via permission helpers
-- 4. No need for complex JWT verification in Supabase
--
-- All database queries filter by account_id (enforced in API routes).
-- Permission checks are handled in Next.js middleware and API routes.
-- Auth0 session management provides secure authentication.
-- API layer provides defense-in-depth authorization.

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE features DISABLE ROW LEVEL SECURITY;
ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_user_story DISABLE ROW LEVEL SECURITY;
