import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { checkTicketAlignment } from '@/lib/gemini'
import type { CheckTicketAlignmentRequest, TicketAlignmentResponse } from '@/types/api'

/**
 * POST /api/feature/[id]/check-alignment
 * Check how well a ticket aligns with user stories using AI
 * Requires: Project access, account isolation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const ticketId = params.id
    validateUUID(ticketId, 'Ticket ID')

    const supabase = createServerClient()

    // Verify ticket exists and belongs to user's account
    const { data: ticket, error: ticketError } = await supabase
      .from('features')
      .select('id, project_id, account_id, title, description, acceptance_criteria')
      .eq('id', ticketId)
      .eq('account_id', user.account_id)
      .single()

    if (ticketError || !ticket) {
      throw APIErrors.notFound('Ticket')
    }

    // Verify project access
    await requireProjectAccess(user, ticket.project_id)

    // Get all user stories for the account (user stories are now global/account-level)
    // We fetch all user stories since they can be linked to any project
    const { data: userStories, error: userStoriesError } = await supabase
      .from('user_stories')
      .select('id, name, role, goal, benefit, demographics')
      .eq('account_id', user.account_id)

    if (userStoriesError) {
      console.error('[Check Alignment] Error fetching user stories:', userStoriesError)
      throw APIErrors.internalError('Failed to fetch user stories')
    }

    if (!userStories || userStories.length === 0) {
      // No user stories to compare against
      const response: TicketAlignmentResponse = {
        alignmentScore: 0,
        suggestions: ['No user stories found for this project. Create user stories to enable alignment checking.'],
        matchedUserStories: [],
        aiAnalysis: 'No user stories available for comparison.',
      }
      return successResponse(response)
    }

    // Call AI alignment check
    const alignmentResult = await checkTicketAlignment({
      ticketTitle: ticket.title,
      ticketDescription: ticket.description,
      ticketAcceptanceCriteria: ticket.acceptance_criteria || null,
      userStories: userStories.map((us) => ({
        id: us.id,
        name: us.name,
        role: us.role,
        goal: us.goal,
        benefit: us.benefit,
        demographics: us.demographics || null,
      })),
    })

    const response: TicketAlignmentResponse = {
      alignmentScore: alignmentResult.alignmentScore,
      suggestions: alignmentResult.suggestions,
      matchedUserStories: alignmentResult.matchedUserStories,
      aiAnalysis: alignmentResult.aiAnalysis,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

