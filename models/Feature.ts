import { BaseModel } from './base'

/**
 * Feature model - Represents a feature in a project
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
}

