-- Migration: Add user specialization and vacation dates
-- Run this SQL in your Supabase SQL Editor
--
-- This migration adds:
-- 1. specialization field (TEXT, nullable) - for engineer specializations (Backend, Frontend, QA, DevOps)
-- 2. vacation_dates field (JSONB, nullable) - array of vacation date ranges
--
-- Note: current_ticket_count and current_story_point_count are computed fields
-- and are not stored in the database. They are calculated on-the-fly in the API.

-- Add specialization column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS specialization TEXT CHECK (specialization IN ('Backend', 'Frontend', 'QA', 'DevOps'));

-- Add vacation_dates column (JSONB array of {start: string, end: string})
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vacation_dates JSONB DEFAULT '[]'::jsonb;

-- Add index on specialization for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_specialization ON users(specialization);

-- Add index on vacation_dates for faster queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_users_vacation_dates ON users USING GIN (vacation_dates);

-- Add comment to explain the fields
COMMENT ON COLUMN users.specialization IS 'Engineer specialization: Backend, Frontend, QA, or DevOps. Only applicable for engineers.';
COMMENT ON COLUMN users.vacation_dates IS 'Array of vacation date ranges in format: [{"start": "2024-01-01", "end": "2024-01-07"}]';

