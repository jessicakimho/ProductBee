import { BaseModel } from './base'
import type { TicketType } from '@/lib/constants'

/**
 * Feature model - Represents a feature/ticket in a project (Jira-style)
 * Extends BaseModel for consistent structure
 */
export interface Feature extends BaseModel {
  project_id: string
  account_id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  priority: 'critical' | 'high' | 'medium' | 'low'
  dependencies?: string[]
  estimated_effort_weeks?: number
  // Jira-style fields (Phase 6)
  assigned_to?: string | null // User ID
  reporter?: string | null // User ID
  story_points?: number | null
  labels?: string[]
  acceptance_criteria?: string | null
  ticket_type?: TicketType
  // Timeline fields (Phase 7)
  start_date?: string | null // ISO date string
  end_date?: string | null // ISO date string
  duration?: number | null // Duration in days
}

