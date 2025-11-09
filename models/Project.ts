import { BaseModel } from './base'

/**
 * Project model - Represents a project in the system
 * Extends BaseModel for consistent structure
 */
export interface Project extends BaseModel {
  name: string
  description: string
  created_by: string
  account_id: string
  team_id: string
  roadmap: {
    summary: string
    riskLevel: 'low' | 'medium' | 'high'
  }
}

