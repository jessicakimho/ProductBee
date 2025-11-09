import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { GetUserStoriesResponse } from '@/types/api'

/**
 * GET /api/user-story/project/[id]
 * Get all user stories for a project
 * Requires: Project access, account isolation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const projectId = params.id
    validateUUID(projectId, 'Project ID')

    // Verify project access and account isolation
    await requireProjectAccess(user, projectId)

    const supabase = createServerClient()

    // Get all user stories for the project
    const { data: userStories, error: userStoriesError } = await supabase
      .from('user_stories')
      .select('*')
      .eq('project_id', projectId)
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

