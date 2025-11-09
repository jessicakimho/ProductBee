-- Phase 11.5: User Stories & Personas
-- Migration: Add user_stories table and ticket_user_story join table

-- User Stories table
CREATE TABLE IF NOT EXISTS user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  goal TEXT NOT NULL,
  benefit TEXT NOT NULL,
  demographics JSONB, -- { age, location, technical_skill, etc. }
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stories_project_id ON user_stories(project_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_account_id ON user_stories(account_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_created_by ON user_stories(created_by);
CREATE INDEX IF NOT EXISTS idx_ticket_user_story_ticket_id ON ticket_user_story(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_user_story_user_story_id ON ticket_user_story(user_story_id);
CREATE INDEX IF NOT EXISTS idx_ticket_user_story_account_id ON ticket_user_story(account_id);

-- Enable real-time for user_stories table
ALTER PUBLICATION supabase_realtime ADD TABLE user_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_user_story;

-- Disable RLS (authorization handled in API layer)
ALTER TABLE user_stories DISABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_user_story DISABLE ROW LEVEL SECURITY;

