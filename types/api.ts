/**
 * API request and response types
 */

import type { Project } from '@/models/Project'
import type { Feature } from '@/models/Feature'
import type { Feedback } from '@/models/Feedback'
import type { User } from '@/models/User'

// API Response wrapper
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

// Project API Types (using API response format with _id and camelCase)
export interface CreateProjectRequest {
  projectName: string
  projectDescription: string
}

export interface ProjectResponse {
  _id: string
  id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: string
  }
  createdAt: string
  createdBy?: {
    _id?: string
    name: string
    email: string
  } | null
  created_by?: string
  team_id?: string
}

export interface FeatureResponse {
  _id: string
  id: string
  projectId: string
  title: string
  description: string
  status: string
  priority: string
  effortEstimateWeeks: number
  dependsOn: string[]
  createdAt: string
}

export interface CreateProjectResponse {
  project: ProjectResponse
  features: FeatureResponse[]
}

export interface GetProjectsResponse {
  projects: ProjectResponse[]
}

export interface GetProjectResponse {
  project: ProjectResponse
  features: FeatureResponse[]
  feedbackByFeature: Record<string, FeedbackResponse[]>
}

// Alias for consistency
export type ProjectDetailResponse = GetProjectResponse

// Feature API Types
export interface UpdateFeatureRequest {
  status?: string
  priority?: string
  title?: string
  description?: string
  effortEstimateWeeks?: number
  dependsOn?: string[]
}

export interface UpdateFeatureResponse {
  feature: FeatureResponse
}

// Feedback API Types
export interface CreateFeedbackRequest {
  projectId: string
  featureId: string
  type: 'comment' | 'timeline_proposal'
  content: string
  proposedRoadmap?: any
}

export interface FeedbackResponse {
  _id: string
  id: string
  projectId: string
  featureId: string
  userId: {
    _id?: string
    name: string
    email: string
  } | null
  type: string
  content: string
  proposedRoadmap?: any
  aiAnalysis?: string
  status: string
  createdAt: string
}

export interface CreateFeedbackResponse {
  feedback: FeedbackResponse
}

export interface ApproveFeedbackRequest {
  feedbackId: string
}

export interface ApproveFeedbackResponse {
  message: string
  feedback: FeedbackResponse
}

export interface RejectFeedbackRequest {
  feedbackId: string
}

export interface RejectFeedbackResponse {
  message: string
  feedback: FeedbackResponse
}

// Roadmap API Types
export interface GenerateRoadmapRequest {
  projectName: string
  projectDescription: string
}

export interface GenerateRoadmapResponse {
  project: ProjectResponse
  features: FeatureResponse[]
}

// User API Types
export interface UserResponse {
  user: User
}

export interface UserProfileResponse {
  _id: string
  id: string
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  account_id: string
  team_id?: string
  specialization?: string | null
  vacationDates?: Array<{ start: string; end: string }>
  currentTicketCount?: number
  currentStoryPointCount?: number
  createdAt: string
}

export interface GetUserProfileResponse {
  profile: UserProfileResponse
}

export interface UpdateUserProfileRequest {
  role?: 'admin' | 'pm' | 'engineer' | 'viewer'
  specialization?: string | null
  vacationDates?: Array<{ start: string; end: string }> | null
}

export interface UpdateUserProfileResponse {
  profile: UserProfileResponse
}

export interface TeamMemberResponse {
  _id: string
  id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  specialization?: string | null
  vacationDates?: Array<{ start: string; end: string }>
  currentTicketCount: number
  currentStoryPointCount: number
  isOnVacation: boolean
  createdAt: string
}

export interface GetTeamMembersResponse {
  members: TeamMemberResponse[]
}
