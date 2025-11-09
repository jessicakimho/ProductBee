import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { AssignUserStoryToTicketRequest, AssignUserStoryToTicketResponse, UnassignUserStoryFromTicketRequest, UnassignUserStoryFromTicketResponse } from '@/types/api'

/**
 * POST /api/feature/[id]/assign-user-story
 * Link a user story to a ticket (feature)
 * Requires: PM or Admin role, account isolation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    // Only PMs and Admins can link user stories to tickets
    requirePMOrAdmin(user)

    const ticketId = params.id
    validateUUID(ticketId, 'Ticket ID')

    const body = await validateJsonBody<AssignUserStoryToTicketRequest>(request)
    validateRequired(body, ['userStoryId'])
    validateUUID(body.userStoryId, 'User Story ID')

    const supabase = createServerClient()

    // Verify ticket exists and belongs to user's account
    const { data: ticket, error: ticketError } = await supabase
      .from('features')
      .select('id, project_id, account_id')
      .eq('id', ticketId)
      .eq('account_id', user.account_id)
      .single()

    if (ticketError || !ticket) {
      throw APIErrors.notFound('Ticket')
    }

    // Verify project access
    await requireProjectAccess(user, ticket.project_id)

    // Verify user story exists and belongs to the same project and account
    const { data: userStory, error: userStoryError } = await supabase
      .from('user_stories')
      .select('id, project_id, account_id')
      .eq('id', body.userStoryId)
      .eq('account_id', user.account_id)
      .single()

    if (userStoryError || !userStory) {
      throw APIErrors.notFound('User story')
    }

    // Verify user story belongs to the same project as the ticket
    if (userStory.project_id !== ticket.project_id) {
      throw APIErrors.badRequest('User story must belong to the same project as the ticket')
    }

    // Check if link already exists
    const { data: existingLink } = await supabase
      .from('ticket_user_story')
      .select('ticket_id, user_story_id')
      .eq('ticket_id', ticketId)
      .eq('user_story_id', body.userStoryId)
      .eq('account_id', user.account_id)
      .single()

    if (existingLink) {
      // Link already exists, return success
      const response: AssignUserStoryToTicketResponse = {
        message: 'User story already linked to ticket',
        ticketId,
        userStoryId: body.userStoryId,
      }
      return successResponse(response)
    }

    // Create link
    const { error: linkError } = await supabase
      .from('ticket_user_story')
      .insert({
        ticket_id: ticketId,
        user_story_id: body.userStoryId,
        account_id: user.account_id,
      })

    if (linkError) {
      console.error('[Assign User Story] Error:', linkError)
      throw APIErrors.internalError('Failed to link user story to ticket')
    }

    const response: AssignUserStoryToTicketResponse = {
      message: 'User story linked to ticket successfully',
      ticketId,
      userStoryId: body.userStoryId,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/feature/[id]/assign-user-story
 * Unlink a user story from a ticket (feature)
 * Requires: PM or Admin role, account isolation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    // Only PMs and Admins can unlink user stories from tickets
    requirePMOrAdmin(user)

    const ticketId = params.id
    validateUUID(ticketId, 'Ticket ID')

    const body = await validateJsonBody<UnassignUserStoryFromTicketRequest>(request)
    validateRequired(body, ['userStoryId'])
    validateUUID(body.userStoryId, 'User Story ID')

    const supabase = createServerClient()

    // Verify ticket exists and belongs to user's account
    const { data: ticket, error: ticketError } = await supabase
      .from('features')
      .select('id, account_id')
      .eq('id', ticketId)
      .eq('account_id', user.account_id)
      .single()

    if (ticketError || !ticket) {
      throw APIErrors.notFound('Ticket')
    }

    // Delete link
    const { error: deleteError } = await supabase
      .from('ticket_user_story')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('user_story_id', body.userStoryId)
      .eq('account_id', user.account_id)

    if (deleteError) {
      console.error('[Unassign User Story] Error:', deleteError)
      throw APIErrors.internalError('Failed to unlink user story from ticket')
    }

    const response: UnassignUserStoryFromTicketResponse = {
      message: 'User story unlinked from ticket successfully',
      ticketId,
      userStoryId: body.userStoryId,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

