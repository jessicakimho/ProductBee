/**
 * Database-specific types
 * These types represent the actual database schema (snake_case)
 */

export interface DatabaseUser {
  id: string
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  account_id: string
  team_id?: string
  specialization?: 'Backend' | 'Frontend' | 'QA' | 'DevOps' | null
  vacation_dates?: Array<{ start: string; end: string }> | null
  created_at: string
}

export interface DatabaseProject {
  id: string
  name: string
  description: string
  created_by: string
  account_id: string
  team_id: string
  roadmap: {
    summary: string
    riskLevel: 'low' | 'medium' | 'high'
  }
  created_at: string
}

export interface DatabaseFeature {
  id: string
  project_id: string
  account_id: string
  title: string
  description: string
  status: 'backlog' | 'active' | 'blocked' | 'complete'
  priority: 'P0' | 'P1' | 'P2'
  effort_estimate_weeks: number
  depends_on: string[]
  created_at: string
}

export interface DatabaseFeedback {
  id: string
  project_id: string
  feature_id: string
  user_id: string
  account_id: string
  type: 'comment' | 'proposal'
  content: string
  proposed_roadmap?: any
  ai_analysis?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface DatabaseUserStory {
  id: string
  project_id: string
  account_id: string
  name: string
  role: string
  goal: string
  benefit: string
  demographics?: {
    age?: string
    location?: string
    technical_skill?: string
    [key: string]: any
  } | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface DatabaseTicketUserStory {
  ticket_id: string
  user_story_id: string
  account_id: string
  created_at: string
}
