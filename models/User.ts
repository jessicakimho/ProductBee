import { BaseModel } from './base'
import type { Specialization } from '@/lib/constants'

/**
 * Vacation date range
 */
export interface VacationDateRange {
  start: string // ISO date string
  end: string // ISO date string
}

/**
 * User model - Represents a user in the system
 * Extends BaseModel for consistent structure
 */
export interface User extends BaseModel {
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  account_id: string
  team_id?: string
  specialization?: Specialization | null // Only for engineers, null for other roles
  vacation_dates?: VacationDateRange[] // Array of vacation date ranges
  // Computed workload metrics (not stored in DB, calculated on-the-fly)
  current_ticket_count?: number
  current_story_point_count?: number
}

