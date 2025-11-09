import { BaseModel } from './base'

/**
 * User Story demographics interface
 */
export interface UserStoryDemographics {
  age?: string
  location?: string
  technical_skill?: string
  [key: string]: any // Allow additional demographic fields
}

/**
 * UserStory model - Represents a user story/persona in a project
 * Extends BaseModel for consistent structure
 */
export interface UserStory extends BaseModel {
  project_id: string
  account_id: string
  name: string
  role: string
  goal: string
  benefit: string
  demographics?: UserStoryDemographics | null
  created_by: string
  updated_at?: string
}

