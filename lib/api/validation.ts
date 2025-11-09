import { APIErrors } from './errors'

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
  const validRoles = ['admin', 'pm', 'engineer', 'viewer']
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
  const validSpecializations = ['Backend', 'Frontend', 'QA', 'DevOps']
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
  const validStatuses = ['backlog', 'active', 'blocked', 'complete']
  if (!validStatuses.includes(status)) {
    throw APIErrors.badRequest(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
  }
}

/**
 * Validate priority (database format)
 */
export function validatePriority(priority: string): void {
  const validPriorities = ['P0', 'P1', 'P2']
  if (!validPriorities.includes(priority)) {
    throw APIErrors.badRequest(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`)
  }
}

/**
 * Validate feedback type (database format)
 */
export function validateFeedbackType(type: string): void {
  const validTypes = ['comment', 'proposal']
  if (!validTypes.includes(type)) {
    throw APIErrors.badRequest(`Invalid feedback type. Must be one of: ${validTypes.join(', ')}`)
  }
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
 * Sanitize string input (basic XSS prevention)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
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

