import { createServerClient } from '@/lib/supabase'

/**
 * Workload metrics for a user
 */
export interface WorkloadMetrics {
  ticketCount: number
  storyPointCount: number
}

/**
 * Calculate user workload metrics
 * 
 * Note: This function requires the assignedTo field on features (Phase 6).
 * For now, it returns 0 for all metrics until Phase 6 is implemented.
 * 
 * @param userId - User ID
 * @param accountId - Account ID for account isolation
 * @returns Workload metrics (ticket count and story point count)
 */
export async function calculateUserWorkload(
  userId: string,
  accountId: string
): Promise<WorkloadMetrics> {
  const supabase = createServerClient()

  // TODO: Phase 6 - Implement workload calculation once assignedTo field is added to features
  // For now, return 0 for all metrics
  // 
  // When Phase 6 is complete, this should:
  // 1. Query features where assigned_to = userId
  // 2. Filter by account_id for account isolation
  // 3. Exclude completed features (status != 'complete')
  // 4. Count tickets and sum story points
  // 
  // Example implementation (to be enabled in Phase 6):
  // const { data: features, error } = await supabase
  //   .from('features')
  //   .select('id, story_points, status')
  //   .eq('assigned_to', userId)
  //   .eq('account_id', accountId)
  //   .neq('status', 'complete')
  //
  // if (error) {
  //   console.error('Error calculating workload:', error)
  //   return { ticketCount: 0, storyPointCount: 0 }
  // }
  //
  // const ticketCount = features?.length || 0
  // const storyPointCount = features?.reduce((sum, f) => sum + (f.story_points || 0), 0) || 0
  //
  // return { ticketCount, storyPointCount }

  return {
    ticketCount: 0,
    storyPointCount: 0,
  }
}

/**
 * Check if user is currently on vacation
 * 
 * @param vacationDates - Array of vacation date ranges
 * @returns True if user is on vacation today
 */
export function isUserOnVacation(
  vacationDates?: Array<{ start: string; end: string }> | null
): boolean {
  if (!vacationDates || vacationDates.length === 0) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return vacationDates.some((range) => {
    const startDate = new Date(range.start)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(range.end)
    endDate.setHours(23, 59, 59, 999)

    return today >= startDate && today <= endDate
  })
}

