import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateUserStory, validateRequired } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { HTTP_STATUS } from '@/lib/constants'
import type { CreateUserStoryRequest, CreateUserStoryResponse } from '@/types/api'

/**
 * POST /api/user-story
 * Create a new user story
 * Requires: PM or Admin role
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    // Only PMs and Admins can create user stories
    requirePMOrAdmin(user)

    const body = await validateJsonBody<CreateUserStoryRequest>(request)
    validateRequired(body, ['projectId', 'name', 'role', 'goal', 'benefit'])
    validateUUID(body.projectId, 'Project ID')
    validateUserStory(body)

    // Verify project access and account isolation
    await requireProjectAccess(user, body.projectId)

    const supabase = createServerClient()

    // Verify project exists and belongs to user's account
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, account_id')
      .eq('id', body.projectId)
      .eq('account_id', user.account_id)
      .single()

    if (projectError || !project) {
      throw APIErrors.notFound('Project')
    }

    // Create user story
    const { data: userStory, error: userStoryError } = await supabase
      .from('user_stories')
      .insert({
        project_id: body.projectId,
        account_id: user.account_id,
        name: body.name.trim(),
        role: body.role.trim(),
        goal: body.goal.trim(),
        benefit: body.benefit.trim(),
        demographics: body.demographics || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (userStoryError || !userStory) {
      console.error('[User Story Create] Error:', userStoryError)
      throw APIErrors.internalError('Failed to create user story')
    }

    // Get creator info
    const { data: creator } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user.id)
      .single()

    // Format response
    const formattedUserStory = {
      _id: userStory.id,
      id: userStory.id,
      projectId: userStory.project_id,
      name: userStory.name,
      role: userStory.role,
      goal: userStory.goal,
      benefit: userStory.benefit,
      demographics: userStory.demographics,
      createdBy: creator
        ? {
            _id: creator.id,
            name: creator.name,
            email: creator.email,
          }
        : {
            _id: user.id,
            name: user.name,
            email: user.email,
          },
      createdAt: userStory.created_at,
      updatedAt: userStory.updated_at || null,
      linkedTicketIds: [],
    }

    const response: CreateUserStoryResponse = {
      userStory: formattedUserStory,
    }

    return successResponse(response, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleError(error)
  }
}

