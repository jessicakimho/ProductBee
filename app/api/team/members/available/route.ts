import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession } from '@/lib/api/permissions'
import { handleError, successResponse } from '@/lib/api/errors'
import type { GetTeamMembersResponse } from '@/types/api'
import { calculateUserWorkload, isUserOnVacation } from '@/lib/api/workload'

/**
 * GET /api/team/members/available
 * Get all available team members in the current user's account (excludes users on vacation)
 * Returns team members with roles, specializations, workload metrics, and vacation status
 * Enforces account isolation - users only see team members from their account
 * Filters out users who are currently on vacation
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const supabase = createServerClient()

    // Get all users in the same account (account isolation)
    const { data: teamMembers, error: teamError } = await supabase
      .from('users')
      .select('*')
      .eq('account_id', user.account_id)
      .order('name', { ascending: true })

    if (teamError) {
      throw new Error('Failed to fetch team members')
    }

    if (!teamMembers || teamMembers.length === 0) {
      return successResponse<GetTeamMembersResponse>({ members: [] })
    }

    // Calculate workload and format each team member
    // Filter out users who are on vacation
    const members = await Promise.all(
      teamMembers.map(async (member) => {
        const workload = await calculateUserWorkload(member.id, member.account_id)
        const vacationDates = (member.vacation_dates as Array<{ start: string; end: string }>) || []
        const onVacation = isUserOnVacation(vacationDates)

        return {
          _id: member.id,
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role as 'admin' | 'pm' | 'engineer' | 'viewer',
          specialization: member.specialization || null,
          vacationDates: vacationDates.length > 0 ? vacationDates : undefined,
          currentTicketCount: workload.ticketCount,
          currentStoryPointCount: workload.storyPointCount,
          isOnVacation: onVacation,
          createdAt: member.created_at,
        }
      })
    )

    // Filter out users who are on vacation
    const availableMembers = members.filter((member) => !member.isOnVacation)

    const response: GetTeamMembersResponse = {
      members: availableMembers,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

