# Database Setup Checklist

This document outlines what needs to be done for the database setup, including current gaps and future requirements.

## ✅ Already Completed

- [x] Basic schema created (`supabase/schema.sql`)
- [x] Core tables: users, projects, features, feedback
- [x] Indexes for performance
- [x] Foreign key relationships
- [x] Real-time publication setup (SQL commands included)

## ⚠️ Immediate Actions Needed

### 1. Add `updated_at` Timestamp Field

**Issue:** Models define `updated_at` but schema doesn't have it.

**Action Required:**
```sql
-- Add updated_at to all tables
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE features ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE feedback ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Fix Feedback Status Constraint

**Issue:** Model includes `'discussion'` status but schema only allows `'pending', 'approved', 'rejected'`.

**Action Required:**
```sql
-- Drop existing constraint and recreate with 'discussion' status
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'discussion'));
```

### 3. Verify Real-time Setup

**Action Required:**
1. Go to Supabase Dashboard → Database → Replication
2. Verify these tables have replication enabled:
   - `projects`
   - `features`
   - `feedback`
3. If not enabled, enable them manually in the UI

**Note:** The SQL script includes `ALTER PUBLICATION` commands, but you may need to enable Realtime in project settings first.

## 📋 Future Phase Requirements

### Phase 4: Account Isolation

**Fields to Add:**
```sql
-- Add account_id to all tables for multi-tenant isolation
ALTER TABLE users ADD COLUMN account_id UUID;
ALTER TABLE projects ADD COLUMN account_id UUID;
ALTER TABLE features ADD COLUMN account_id UUID;
ALTER TABLE feedback ADD COLUMN account_id UUID;

-- Create accounts table (optional, if you want a separate accounts table)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign keys
ALTER TABLE users ADD CONSTRAINT fk_users_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE projects ADD CONSTRAINT fk_projects_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE features ADD CONSTRAINT fk_features_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE feedback ADD CONSTRAINT fk_feedback_account 
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_account_id ON users(account_id);
CREATE INDEX IF NOT EXISTS idx_projects_account_id ON projects(account_id);
CREATE INDEX IF NOT EXISTS idx_features_account_id ON features(account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_account_id ON feedback(account_id);
```

### Phase 5: User Roles & Team Management

**Fields to Add:**
```sql
-- Extend users table with profile fields
ALTER TABLE users ADD COLUMN specialization TEXT 
    CHECK (specialization IN ('Backend', 'Frontend', 'QA', 'DevOps', NULL));
ALTER TABLE users ADD COLUMN vacation_dates JSONB DEFAULT '[]'; 
    -- Array of {start: date, end: date} objects
ALTER TABLE users ADD COLUMN current_ticket_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN current_story_point_count INTEGER DEFAULT 0;
```

### Phase 6: Jira-Style Ticket Model

**Fields to Add:**
```sql
-- Extend features table with Jira-style fields
ALTER TABLE features ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE features ADD COLUMN reporter UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE features ADD COLUMN story_points INTEGER;
ALTER TABLE features ADD COLUMN labels TEXT[] DEFAULT '{}';
ALTER TABLE features ADD COLUMN acceptance_criteria TEXT;
ALTER TABLE features ADD COLUMN ticket_type TEXT 
    CHECK (ticket_type IN ('feature', 'bug', 'epic', 'story')) DEFAULT 'feature';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON features(assigned_to);
CREATE INDEX IF NOT EXISTS idx_features_reporter ON features(reporter);
CREATE INDEX IF NOT EXISTS idx_features_ticket_type ON features(ticket_type);
```

### Phase 7: Gantt Chart & Timeline View

**Fields to Add:**
```sql
-- Add timeline fields to features table
ALTER TABLE features ADD COLUMN start_date DATE;
ALTER TABLE features ADD COLUMN end_date DATE;
ALTER TABLE features ADD COLUMN duration_days INTEGER;

-- Add indexes for timeline queries
CREATE INDEX IF NOT EXISTS idx_features_start_date ON features(start_date);
CREATE INDEX IF NOT EXISTS idx_features_end_date ON features(end_date);
```

## 🔧 Setup Steps

### Step 1: Initial Schema Setup
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire `supabase/schema.sql` file
3. Run the SQL script
4. Verify all tables were created successfully

### Step 2: Apply Immediate Fixes
1. Run the `updated_at` migration (see section 1 above)
2. Run the feedback status fix (see section 2 above)
3. Verify changes in the Table Editor

### Step 3: Enable Real-time
1. Go to Database → Replication
2. Enable replication for: `projects`, `features`, `feedback`
3. Test real-time updates in the application

### Step 4: Verify Environment Variables
Ensure `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 5: Test Database Connection
1. Run `npm run dev`
2. Try creating a project
3. Check Supabase Dashboard → Table Editor to verify data was inserted
4. Test real-time updates by opening multiple browser tabs

## 🚨 Important Notes

### Row Level Security (RLS)
- Currently **disabled** (as per schema)
- Authorization is handled in Next.js API routes via Auth0
- If you want to enable RLS later, you'll need to:
  1. Create a function to verify Auth0 JWT tokens
  2. Create policies that check user roles
  3. Use service role key in API routes

### Data Types
- All IDs use UUID format
- JSONB is used for flexible data (roadmap, proposed_roadmap, vacation_dates)
- Arrays are used for dependencies and labels (UUID[] and TEXT[])

### Constraints
- Foreign keys use `ON DELETE CASCADE` for automatic cleanup
- CHECK constraints enforce valid enum values
- Unique constraints on `users.auth0_id` and `users.email`

## 📝 Migration Script

You can create a migration script that includes all immediate fixes:

```sql
-- Migration: Add updated_at and fix feedback status
-- Run this after initial schema setup

-- 1. Add updated_at columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE features ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_features_updated_at ON features;
CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_updated_at ON feedback;
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Fix feedback status constraint
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'discussion'));
```

## ✅ Verification Checklist

After setup, verify:
- [ ] All tables exist in Supabase Dashboard
- [ ] Foreign key relationships are correct
- [ ] Indexes are created
- [ ] Real-time is enabled for projects, features, feedback
- [ ] `updated_at` columns exist and have triggers
- [ ] Feedback status constraint includes 'discussion'
- [ ] Can insert test data via API
- [ ] Real-time updates work in the application

