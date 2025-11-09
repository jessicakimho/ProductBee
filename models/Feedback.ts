import { BaseModel } from './base'

/**
 * Feedback model - Represents feedback on a feature
 * Extends BaseModel for consistent structure
 */
export interface Feedback extends BaseModel {
  project_id: string
  feature_id: string
  account_id: string
  type: 'comment' | 'timeline_proposal'
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'discussion'
  analysis?: {
    requires_timeline_change: boolean
    suggested_action: string
    affected_features: string[]
    reasoning: string
  }
}

