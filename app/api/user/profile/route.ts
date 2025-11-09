import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession } from '@/lib/api/permissions'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { validateJsonBody, validateRole, validateSpecialization, validateVacationDates } from '@/lib/api/validation'
import type { GetUserProfileResponse, UpdateUserProfileRequest, UpdateUserProfileResponse } from '@/types/api'
import { calculateUserWorkload } from '@/lib/api/workload'
import { ROLES } from '@/lib/constants'

/**
 * GET /api/user/profile
 * Get the current user's profile
 * Returns user profile with workload metrics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const supabase = createServerClient()

    // Get user from database with all fields
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .eq('account_id', user.account_id)
      .single()

    if (userError || !dbUser) {
      throw new Error('Failed to fetch user profile')
    }

    // Calculate workload metrics
    // Note: Workload calculation requires assignedTo field on features (Phase 6)
    // For now, this returns 0 until Phase 6 is implemented
    const workload = await calculateUserWorkload(user.id, user.account_id)

    // Format response
    const profile: GetUserProfileResponse['profile'] = {
      _id: dbUser.id,
      id: dbUser.id,
      auth0_id: dbUser.auth0_id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as 'admin' | 'pm' | 'engineer' | 'viewer',
      account_id: dbUser.account_id,
      team_id: dbUser.team_id || undefined,
      specialization: dbUser.specialization || null,
      vacationDates: dbUser.vacation_dates as Array<{ start: string; end: string }> || [],
      currentTicketCount: workload.ticketCount,
      currentStoryPointCount: workload.storyPointCount,
      createdAt: dbUser.created_at,
    }

    const response: GetUserProfileResponse = {
      profile,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * PATCH /api/user/profile
 * Update the current user's profile
 * Users can only update their own profile
 * Validates role, specialization, and vacation dates
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const updates = await validateJsonBody<UpdateUserProfileRequest>(request)
    const supabase = createServerClient()

    // Build update object
    const dbUpdates: any = {}

    // Validate and update role
    if (updates.role !== undefined) {
      validateRole(updates.role)
      dbUpdates.role = updates.role
      
      // If role is not engineer, clear specialization
      if (updates.role !== ROLES.ENGINEER) {
        dbUpdates.specialization = null
      }
    }

    // Validate and update specialization
    if (updates.specialization !== undefined) {
      validateSpecialization(updates.specialization)
      
      // Only engineers can have specialization
      const currentRole = dbUpdates.role || user.role
      if (updates.specialization !== null && currentRole !== ROLES.ENGINEER) {
        throw APIErrors.badRequest('Specialization can only be set for engineers')
      }
      
      dbUpdates.specialization = updates.specialization
    }

    // Validate and update vacation dates
    if (updates.vacationDates !== undefined) {
      validateVacationDates(updates.vacationDates)
      dbUpdates.vacation_dates = updates.vacationDates || []
    }

    // If no updates, return error
    if (Object.keys(dbUpdates).length === 0) {
      throw APIErrors.badRequest('No valid updates provided')
    }

    // Update user (users can only update their own profile)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', user.id)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (updateError || !updatedUser) {
      throw APIErrors.internalError('Failed to update user profile')
    }

    // Calculate workload metrics
    const workload = await calculateUserWorkload(user.id, user.account_id)

    // Format response
    const profile: UpdateUserProfileResponse['profile'] = {
      _id: updatedUser.id,
      id: updatedUser.id,
      auth0_id: updatedUser.auth0_id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role as 'admin' | 'pm' | 'engineer' | 'viewer',
      account_id: updatedUser.account_id,
      team_id: updatedUser.team_id || undefined,
      specialization: updatedUser.specialization || null,
      vacationDates: updatedUser.vacation_dates as Array<{ start: string; end: string }> || [],
      currentTicketCount: workload.ticketCount,
      currentStoryPointCount: workload.storyPointCount,
      createdAt: updatedUser.created_at,
    }

    const response: UpdateUserProfileResponse = {
      profile,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

