import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateUserStory, validateRequired } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { HTTP_STATUS } from '@/lib/constants'
import type { CreateUserStoryRequest, CreateUserStoryResponse, GetUserStoriesResponse } from '@/types/api'

/**
 * GET /api/user-story
 * Get all user stories for the account (global, not project-scoped)
 * Requires: Account access
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const supabase = createServerClient()

    // Get all user stories for the account (global, not filtered by project)
    const { data: userStories, error: userStoriesError } = await supabase
      .from('user_stories')
      .select('*')
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (userStoriesError) {
      console.error('[User Stories List] Error:', userStoriesError)
      throw APIErrors.internalError('Failed to fetch user stories')
    }

    // Get creator info for each user story
    const creatorIds = [...new Set(userStories?.map((us) => us.created_by) || [])]
    const { data: creators } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', creatorIds)

    const creatorMap = new Map(creators?.map((c) => [c.id, c]) || [])

    // Get linked ticket IDs for each user story
    const userStoryIds = userStories?.map((us) => us.id) || []
    const { data: ticketLinks } = await supabase
      .from('ticket_user_story')
      .select('ticket_id, user_story_id')
      .in('user_story_id', userStoryIds)
      .eq('account_id', user.account_id)

    const ticketLinksMap = new Map<string, string[]>()
    ticketLinks?.forEach((link) => {
      if (!ticketLinksMap.has(link.user_story_id)) {
        ticketLinksMap.set(link.user_story_id, [])
      }
      ticketLinksMap.get(link.user_story_id)?.push(link.ticket_id)
    })

    // Format response
    const formattedUserStories = (userStories || []).map((userStory) => {
      const creator = creatorMap.get(userStory.created_by)
      return {
        _id: userStory.id,
        id: userStory.id,
        projectId: userStory.project_id || null,
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
              _id: userStory.created_by,
              name: '',
              email: '',
            },
        createdAt: userStory.created_at,
        updatedAt: userStory.updated_at || null,
        linkedTicketIds: ticketLinksMap.get(userStory.id) || [],
      }
    })

    const response: GetUserStoriesResponse = {
      userStories: formattedUserStories,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

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
    validateRequired(body, ['name', 'role', 'goal', 'benefit'])
    validateUserStory(body)

    const supabase = createServerClient()

    // If projectId is provided, verify project exists and belongs to user's account
    if (body.projectId) {
      validateUUID(body.projectId, 'Project ID')
      // Verify project access and account isolation
      await requireProjectAccess(user, body.projectId)

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
    }

    // Create user story (project_id is now optional for global user stories)
    const { data: userStory, error: userStoryError } = await supabase
      .from('user_stories')
      .insert({
        project_id: body.projectId || null,
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
      projectId: userStory.project_id || null,
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

