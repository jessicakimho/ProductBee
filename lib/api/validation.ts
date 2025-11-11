import { APIErrors } from './errors'
import { 
  PRIORITY_LEVELS, 
  DB_PRIORITY_LEVELS,
  FEATURE_STATUS,
  DB_FEATURE_STATUS,
  FEEDBACK_TYPE,
  DB_FEEDBACK_TYPE,
  SPECIALIZATIONS,
  TICKET_TYPES,
  ROLES,
  PENDING_CHANGE_STATUS,
  USER_STORY_FIELDS,
} from '@/lib/constants'

/**
 * UUID validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Validate UUID format
 */
export function validateUUID(id: string, fieldName: string = 'ID'): void {
  if (!id || !UUID_REGEX.test(id)) {
    throw APIErrors.badRequest(`Invalid ${fieldName} format`)
  }
}

/**
 * Validate required fields in an object
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter((field) => !data[field] && data[field] !== 0)
  if (missing.length > 0) {
    throw APIErrors.badRequest(`Missing required fields: ${missing.join(', ')}`)
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw APIErrors.badRequest('Invalid email format')
  }
}

/**
 * Validate role
 */
export function validateRole(role: string): void {
  const validRoles = Object.values(ROLES) as string[]
  if (!validRoles.includes(role)) {
    throw APIErrors.badRequest(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
  }
}

/**
 * Validate specialization
 */
export function validateSpecialization(specialization: string | null | undefined): void {
  if (specialization === null || specialization === undefined) {
    return // null/undefined is valid (not all users have specialization)
  }
  const validSpecializations = Object.values(SPECIALIZATIONS) as string[]
  if (!validSpecializations.includes(specialization)) {
    throw APIErrors.badRequest(`Invalid specialization. Must be one of: ${validSpecializations.join(', ')}`)
  }
}

/**
 * Validate vacation dates array
 */
export function validateVacationDates(vacationDates: any): void {
  if (vacationDates === null || vacationDates === undefined) {
    return // null/undefined is valid
  }
  if (!Array.isArray(vacationDates)) {
    throw APIErrors.badRequest('vacationDates must be an array')
  }
  for (const dateRange of vacationDates) {
    if (typeof dateRange !== 'object' || dateRange === null) {
      throw APIErrors.badRequest('Each vacation date range must be an object')
    }
    if (!dateRange.start || !dateRange.end) {
      throw APIErrors.badRequest('Each vacation date range must have start and end dates')
    }
    // Validate date format (ISO date string)
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw APIErrors.badRequest('Invalid date format. Dates must be valid ISO date strings')
    }
    if (startDate > endDate) {
      throw APIErrors.badRequest('Start date must be before or equal to end date')
    }
  }
}

/**
 * Validate feature status (database format)
 */
export function validateFeatureStatus(status: string): void {
  const validStatuses = Object.values(DB_FEATURE_STATUS)
  if (!validStatuses.includes(status as any)) {
    throw APIErrors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }
}

/**
 * Validate priority (API format - what frontend sends)
 */
export function validatePriority(priority: string): void {
  const validPriorities = Object.values(PRIORITY_LEVELS)
  if (!validPriorities.includes(priority as any)) {
    throw APIErrors.badRequest(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`)
  }
}

/**
 * Validate feature status (API format - what frontend sends)
 */
export function validateFeatureStatusApi(status: string): void {
  const validStatuses = Object.values(FEATURE_STATUS)
  if (!validStatuses.includes(status as any)) {
    throw APIErrors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }
}

/**
 * Convert API priority to DB priority using constants
 */
export function priorityToDb(apiPriority: string): string {
  const mapping: Record<string, string> = {
    [PRIORITY_LEVELS.CRITICAL]: DB_PRIORITY_LEVELS.P0,
    [PRIORITY_LEVELS.HIGH]: DB_PRIORITY_LEVELS.P1,
    [PRIORITY_LEVELS.MEDIUM]: DB_PRIORITY_LEVELS.P2,
    [PRIORITY_LEVELS.LOW]: DB_PRIORITY_LEVELS.P2,
  }
  return mapping[apiPriority] || DB_PRIORITY_LEVELS.P2
}

/**
 * Convert DB priority to API priority using constants
 */
export function priorityToApi(dbPriority: string): 'critical' | 'high' | 'medium' | 'low' {
  const mapping: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
    [DB_PRIORITY_LEVELS.P0]: PRIORITY_LEVELS.CRITICAL,
    [DB_PRIORITY_LEVELS.P1]: PRIORITY_LEVELS.HIGH,
    [DB_PRIORITY_LEVELS.P2]: PRIORITY_LEVELS.MEDIUM,
  }
  return mapping[dbPriority] || PRIORITY_LEVELS.MEDIUM
}

/**
 * Convert API status to DB status using constants
 */
export function statusToDb(apiStatus: string): string {
  const mapping: Record<string, string> = {
    [FEATURE_STATUS.NOT_STARTED]: DB_FEATURE_STATUS.BACKLOG,
    [FEATURE_STATUS.IN_PROGRESS]: DB_FEATURE_STATUS.ACTIVE,
    [FEATURE_STATUS.BLOCKED]: DB_FEATURE_STATUS.BLOCKED,
    [FEATURE_STATUS.COMPLETE]: DB_FEATURE_STATUS.COMPLETE,
  }
  return mapping[apiStatus] || DB_FEATURE_STATUS.BACKLOG
}

/**
 * Convert DB status to API status using constants
 */
export function statusToApi(dbStatus: string): 'not_started' | 'in_progress' | 'blocked' | 'complete' {
  // Use explicit type mapping to ensure literal types are preserved
  const mapping: {
    [DB_FEATURE_STATUS.BACKLOG]: typeof FEATURE_STATUS.NOT_STARTED
    [DB_FEATURE_STATUS.ACTIVE]: typeof FEATURE_STATUS.IN_PROGRESS
    [DB_FEATURE_STATUS.BLOCKED]: typeof FEATURE_STATUS.BLOCKED
    [DB_FEATURE_STATUS.COMPLETE]: typeof FEATURE_STATUS.COMPLETE
  } = {
    [DB_FEATURE_STATUS.BACKLOG]: FEATURE_STATUS.NOT_STARTED,
    [DB_FEATURE_STATUS.ACTIVE]: FEATURE_STATUS.IN_PROGRESS,
    [DB_FEATURE_STATUS.BLOCKED]: FEATURE_STATUS.BLOCKED,
    [DB_FEATURE_STATUS.COMPLETE]: FEATURE_STATUS.COMPLETE,
  }
  const result = mapping[dbStatus as keyof typeof mapping]
  return (result || FEATURE_STATUS.NOT_STARTED) as 'not_started' | 'in_progress' | 'blocked' | 'complete'
}

/**
 * Validate feedback type (API format - what frontend sends)
 */
export function validateFeedbackType(type: string): void {
  const validTypes = Object.values(FEEDBACK_TYPE)
  if (!validTypes.includes(type as any)) {
    throw APIErrors.badRequest(`Invalid feedback type. Must be one of: ${validTypes.join(', ')}`)
  }
}

/**
 * Convert API feedback type to DB feedback type using constants
 */
export function feedbackTypeToDb(apiType: string): string {
  const mapping: Record<string, string> = {
    [FEEDBACK_TYPE.COMMENT]: DB_FEEDBACK_TYPE.COMMENT,
    [FEEDBACK_TYPE.TIMELINE_PROPOSAL]: DB_FEEDBACK_TYPE.PROPOSAL,
  }
  return mapping[apiType] || DB_FEEDBACK_TYPE.COMMENT
}

/**
 * Convert DB feedback type to API feedback type using constants
 */
export function feedbackTypeToApi(dbType: string): string {
  const mapping: Record<string, string> = {
    [DB_FEEDBACK_TYPE.COMMENT]: FEEDBACK_TYPE.COMMENT,
    [DB_FEEDBACK_TYPE.PROPOSAL]: FEEDBACK_TYPE.TIMELINE_PROPOSAL,
  }
  return mapping[dbType] || FEEDBACK_TYPE.COMMENT
}

/**
 * Validate feedback status
 */
export function validateFeedbackStatus(status: string): void {
  const validStatuses = ['pending', 'approved', 'rejected']
  if (!validStatuses.includes(status)) {
    throw APIErrors.badRequest(`Invalid feedback status. Must be one of: ${validStatuses.join(', ')}`)
  }
}

/**
 * Validate risk level
 */
export function validateRiskLevel(riskLevel: string): void {
  const validLevels = ['low', 'medium', 'high']
  if (!validLevels.includes(riskLevel)) {
    throw APIErrors.badRequest(`Invalid risk level. Must be one of: ${validLevels.join(', ')}`)
  }
}

/**
 * Validate ticket type (Jira-style)
 */
export function validateTicketType(ticketType: string | null | undefined): void {
  if (ticketType === null || ticketType === undefined) {
    return // null/undefined is valid (defaults to 'feature')
  }
  const validTypes = Object.values(TICKET_TYPES) as string[]
  if (!validTypes.includes(ticketType)) {
    throw APIErrors.badRequest(`Invalid ticket type. Must be one of: ${validTypes.join(', ')}`)
  }
}

/**
 * Validate story points (must be positive integer or null)
 */
export function validateStoryPoints(storyPoints: number | null | undefined): void {
  if (storyPoints === null || storyPoints === undefined) {
    return // null/undefined is valid
  }
  if (typeof storyPoints !== 'number' || storyPoints < 0 || !Number.isInteger(storyPoints)) {
    throw APIErrors.badRequest('Story points must be a non-negative integer or null')
  }
}

/**
 * Validate labels array
 */
export function validateLabels(labels: string[] | null | undefined): void {
  if (labels === null || labels === undefined) {
    return // null/undefined is valid
  }
  if (!Array.isArray(labels)) {
    throw APIErrors.badRequest('Labels must be an array')
  }
  for (const label of labels) {
    if (typeof label !== 'string') {
      throw APIErrors.badRequest('All labels must be strings')
    }
  }
}

/**
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

/**
 * Validate pending change status (Phase 12)
 */
export function validatePendingChangeStatus(status: string): void {
  const validStatuses = Object.values(PENDING_CHANGE_STATUS)
  if (!validStatuses.includes(status as any)) {
    throw APIErrors.badRequest(`Invalid pending change status. Must be one of: ${validStatuses.join(', ')}`)
  }
}

/**
 * Validate user story demographics (Phase 11.5)
 */
export function validateUserStoryDemographics(demographics: any): void {
  if (demographics === null || demographics === undefined) {
    return // null/undefined is valid (optional field)
  }
  if (typeof demographics !== 'object') {
    throw APIErrors.badRequest('Demographics must be an object')
  }
  // Allow any keys, but values should be strings or numbers
  for (const [key, value] of Object.entries(demographics)) {
    if (typeof value !== 'string' && typeof value !== 'number' && value !== null) {
      throw APIErrors.badRequest(`Demographic field "${key}" must be a string, number, or null`)
    }
  }
}

/**
 * Validate user story fields (Phase 11.5)
 */
export function validateUserStory(data: Record<string, any>): void {
  validateRequired(data, ['name', 'role', 'goal', 'benefit'])
  
  if (typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw APIErrors.badRequest('User story name is required and must be a non-empty string')
  }
  
  if (typeof data.role !== 'string' || data.role.trim().length === 0) {
    throw APIErrors.badRequest('User story role is required and must be a non-empty string')
  }
  
  if (typeof data.goal !== 'string' || data.goal.trim().length === 0) {
    throw APIErrors.badRequest('User story goal is required and must be a non-empty string')
  }
  
  if (typeof data.benefit !== 'string' || data.benefit.trim().length === 0) {
    throw APIErrors.badRequest('User story benefit is required and must be a non-empty string')
  }
  
  if (data.demographics !== undefined) {
    validateUserStoryDemographics(data.demographics)
  }
}

/**
 * Validate JSON body from request
 */
export async function validateJsonBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch (error) {
    throw APIErrors.badRequest('Invalid JSON body')
  }
}

