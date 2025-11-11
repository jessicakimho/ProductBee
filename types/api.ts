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
  // Jira-style fields (Phase 6)
  assignedTo?: string | null
  reporter?: string | null
  storyPoints?: number | null
  labels?: string[]
  acceptanceCriteria?: string | null
  ticketType?: 'feature' | 'bug' | 'epic' | 'story'
  // Timeline fields (Phase 7)
  startDate?: string | null
  endDate?: string | null
  duration?: number | null
  isOnCriticalPath?: boolean
  slackDays?: number
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
  // Timeline data (Phase 7)
  timeline?: {
    dependencyChains: Array<{
      featureId: string
      chain: string[]
      depth: number
    }>
    criticalPath: {
      path: string[]
      totalDuration: number
      startDate: string
      endDate: string
    } | null
    milestones: Array<{
      date: string
      features: string[]
      description: string
    }>
    overlaps: Array<{
      feature1: string
      feature2: string
      overlapDays: number
    }>
  }
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
  // Jira-style fields (Phase 6)
  assignedTo?: string | null
  reporter?: string | null
  storyPoints?: number | null
  labels?: string[]
  acceptanceCriteria?: string | null
  ticketType?: 'feature' | 'bug' | 'epic' | 'story'
}

export interface CreateFeatureRequest {
  projectId: string
  title: string
  description: string
  priority: string
  effortEstimateWeeks: number
  dependsOn?: string[]
  // Jira-style fields (Phase 6)
  assignedTo?: string | null
  storyPoints?: number | null
  labels?: string[]
  acceptanceCriteria?: string | null
  ticketType?: 'feature' | 'bug' | 'epic' | 'story'
}

export interface CreateFeatureResponse {
  feature: FeatureResponse
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

// Assignment Suggestion API Types (Phase 9)
export interface SuggestAssigneeRequest {
  taskTitle: string
  taskDescription: string
  taskLabels?: string[]
  taskType?: 'feature' | 'bug' | 'epic' | 'story'
  projectId?: string
  featureId?: string // Optional: if provided, uses feature context instead of taskTitle/taskDescription
}

export interface AssignmentRecommendation {
  engineerId: string
  engineerName: string
  reasoning: string
  confidenceScore: number
  matchFactors: {
    specializationMatch: boolean
    workloadSuitable: boolean
    pastExperience: boolean
  }
}

export interface AssignmentSuggestion {
  requiredSpecialization: 'Backend' | 'Frontend' | 'QA' | 'DevOps' | 'General' | null
  recommendations: AssignmentRecommendation[]
}

export interface SuggestAssigneeResponse {
  suggestion: AssignmentSuggestion
}

// Pending Change API Types (Phase 12)
export interface ProposeStatusChangeRequest {
  newStatus: 'not_started' | 'in_progress' | 'blocked' | 'complete'
}

export interface PendingChangeResponse {
  _id: string
  id: string
  featureId: string
  proposedBy: {
    _id: string
    name: string
    email: string
  }
  fromStatus: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  toStatus: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt: string
}

export interface ProposeStatusChangeResponse {
  pendingChange: PendingChangeResponse
}

export interface ApproveStatusChangeRequest {
  pendingChangeId: string
}

export interface ApproveStatusChangeResponse {
  message: string
  pendingChange: PendingChangeResponse
  feature: FeatureResponse
}

export interface RejectStatusChangeRequest {
  pendingChangeId: string
  reason?: string
}

export interface RejectStatusChangeResponse {
  message: string
  pendingChange: PendingChangeResponse
}

export interface GetPendingChangesResponse {
  pendingChanges: PendingChangeResponse[]
}

// User Story API Types (Phase 11.5)
export interface UserStoryResponse {
  _id: string
  id: string
  projectId?: string | null // Optional: user stories are now global (account-level)
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
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt?: string
  linkedTicketIds?: string[]
}

export interface CreateUserStoryRequest {
  projectId?: string // Optional: user stories are now global (account-level)
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
}

export interface CreateUserStoryResponse {
  userStory: UserStoryResponse
}

export interface UpdateUserStoryRequest {
  name?: string
  role?: string
  goal?: string
  benefit?: string
  demographics?: {
    age?: string
    location?: string
    technical_skill?: string
    [key: string]: any
  } | null
}

export interface UpdateUserStoryResponse {
  userStory: UserStoryResponse
}

export interface GetUserStoriesResponse {
  userStories: UserStoryResponse[]
}

export interface AssignUserStoryToTicketRequest {
  userStoryId: string
}

export interface AssignUserStoryToTicketResponse {
  message: string
  ticketId: string
  userStoryId: string
}

export interface UnassignUserStoryFromTicketRequest {
  userStoryId: string
}

export interface UnassignUserStoryFromTicketResponse {
  message: string
  ticketId: string
  userStoryId: string
}

export interface CheckTicketAlignmentRequest {
  projectId: string
  ticketId: string
}

export interface TicketAlignmentResponse {
  alignmentScore: number // 0-100
  suggestions: string[]
  matchedUserStories: Array<{
    userStoryId: string
    userStoryName: string
    relevanceScore: number
    reasons: string[]
  }>
  aiAnalysis: string
}
