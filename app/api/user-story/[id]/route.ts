import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateUserStory } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { HTTP_STATUS } from '@/lib/constants'
import type { UpdateUserStoryRequest, UpdateUserStoryResponse } from '@/types/api'

/**
 * PUT /api/user-story/[id]
 * Update a user story
 * Requires: PM or Admin role, account isolation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    // Only PMs and Admins can update user stories
    requirePMOrAdmin(user)

    const userStoryId = params.id
    validateUUID(userStoryId, 'User Story ID')

    const body = await validateJsonBody<UpdateUserStoryRequest>(request)

    // Validate user story fields if provided
    if (body.name || body.role || body.goal || body.benefit || body.demographics !== undefined) {
      const validationData = {
        name: body.name || '',
        role: body.role || '',
        goal: body.goal || '',
        benefit: body.benefit || '',
        demographics: body.demographics,
      }
      // Only validate if at least one field is being updated
      if (body.name || body.role || body.goal || body.benefit) {
        if (body.name) validationData.name = body.name
        if (body.role) validationData.role = body.role
        if (body.goal) validationData.goal = body.goal
        if (body.benefit) validationData.benefit = body.benefit
        validateUserStory(validationData)
      }
    }

    const supabase = createServerClient()

    // Verify user story exists and belongs to user's account (no project_id check needed for global user stories)
    const { data: existingUserStory, error: fetchError } = await supabase
      .from('user_stories')
      .select('id, account_id, project_id, created_by')
      .eq('id', userStoryId)
      .eq('account_id', user.account_id)
      .single()

    if (fetchError || !existingUserStory) {
      throw APIErrors.notFound('User story')
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }
    if (body.role !== undefined) {
      updateData.role = body.role.trim()
    }
    if (body.goal !== undefined) {
      updateData.goal = body.goal.trim()
    }
    if (body.benefit !== undefined) {
      updateData.benefit = body.benefit.trim()
    }
    if (body.demographics !== undefined) {
      updateData.demographics = body.demographics
    }

    // Update user story
    const { data: userStory, error: updateError } = await supabase
      .from('user_stories')
      .update(updateData)
      .eq('id', userStoryId)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (updateError || !userStory) {
      console.error('[User Story Update] Error:', updateError)
      throw APIErrors.internalError('Failed to update user story')
    }

    // Get creator info
    const { data: creator } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userStory.created_by)
      .single()

    // Get linked ticket IDs
    const { data: linkedTickets } = await supabase
      .from('ticket_user_story')
      .select('ticket_id')
      .eq('user_story_id', userStoryId)
      .eq('account_id', user.account_id)

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
            _id: userStory.created_by,
            name: '',
            email: '',
          },
      createdAt: userStory.created_at,
      updatedAt: userStory.updated_at || null,
      linkedTicketIds: linkedTickets?.map((t) => t.ticket_id) || [],
    }

    const response: UpdateUserStoryResponse = {
      userStory: formattedUserStory,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

/**
 * DELETE /api/user-story/[id]
 * Delete a user story
 * Requires: PM or Admin role, account isolation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    // Only PMs and Admins can delete user stories
    requirePMOrAdmin(user)

    const userStoryId = params.id
    validateUUID(userStoryId, 'User Story ID')

    const supabase = createServerClient()

    // Verify user story exists and belongs to user's account
    const { data: existingUserStory, error: fetchError } = await supabase
      .from('user_stories')
      .select('id, account_id')
      .eq('id', userStoryId)
      .eq('account_id', user.account_id)
      .single()

    if (fetchError || !existingUserStory) {
      throw APIErrors.notFound('User story')
    }

    // Delete user story (cascade will delete ticket_user_story links)
    const { error: deleteError } = await supabase
      .from('user_stories')
      .delete()
      .eq('id', userStoryId)
      .eq('account_id', user.account_id)

    if (deleteError) {
      console.error('[User Story Delete] Error:', deleteError)
      throw APIErrors.internalError('Failed to delete user story')
    }

    return successResponse({ message: 'User story deleted successfully' })
  } catch (error) {
    return handleError(error)
  }
}

