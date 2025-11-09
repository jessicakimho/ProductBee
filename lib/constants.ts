/**
 * Constants - Centralized constants for the application
 * Used across the backend for type safety and consistency
 */

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  PM: 'pm',
  ENGINEER: 'engineer',
  VIEWER: 'viewer',
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

// User Specializations
export const SPECIALIZATIONS = {
  BACKEND: 'Backend',
  FRONTEND: 'Frontend',
  QA: 'QA',
  DEVOPS: 'DevOps',
} as const

export type Specialization = typeof SPECIALIZATIONS[keyof typeof SPECIALIZATIONS]

// Feature Status
export const FEATURE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETE: 'complete',
} as const

// Note: Database uses different status values ('backlog', 'active', 'blocked', 'complete')
// This is a mapping for the API layer
export const DB_FEATURE_STATUS = {
  BACKLOG: 'backlog',
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  COMPLETE: 'complete',
} as const

export type FeatureStatus = typeof FEATURE_STATUS[keyof typeof FEATURE_STATUS]
export type DbFeatureStatus = typeof DB_FEATURE_STATUS[keyof typeof DB_FEATURE_STATUS]

// Priority Levels
export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const

// Note: Database uses P0, P1, P2 format
export const DB_PRIORITY_LEVELS = {
  P0: 'P0',
  P1: 'P1',
  P2: 'P2',
} as const

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS]
export type DbPriorityLevel = typeof DB_PRIORITY_LEVELS[keyof typeof DB_PRIORITY_LEVELS]

// Feedback Status
export const FEEDBACK_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISCUSSION: 'discussion',
} as const

export type FeedbackStatus = typeof FEEDBACK_STATUS[keyof typeof FEEDBACK_STATUS]

// Feedback Type
export const FEEDBACK_TYPE = {
  COMMENT: 'comment',
  TIMELINE_PROPOSAL: 'timeline_proposal',
} as const

// Note: Database uses 'proposal' instead of 'timeline_proposal'
export const DB_FEEDBACK_TYPE = {
  COMMENT: 'comment',
  PROPOSAL: 'proposal',
} as const

export type FeedbackType = typeof FEEDBACK_TYPE[keyof typeof FEEDBACK_TYPE]
export type DbFeedbackType = typeof DB_FEEDBACK_TYPE[keyof typeof DB_FEEDBACK_TYPE]

// Risk Levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS]

// API Response Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

