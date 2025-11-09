import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired, validatePriority, validateTicketType, validateStoryPoints, validateLabels } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { HTTP_STATUS } from '@/lib/constants'
import type { CreateFeatureRequest, CreateFeatureResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const body = await validateJsonBody<CreateFeatureRequest>(request)
    validateRequired(body, ['projectId', 'title', 'description', 'priority', 'effortEstimateWeeks'])

    // Validate project access and account isolation
    await requireProjectAccess(user, body.projectId)

    // Validate fields
    validatePriority(body.priority)
    if (body.ticketType !== undefined) {
      validateTicketType(body.ticketType)
    }
    if (body.storyPoints !== undefined) {
      validateStoryPoints(body.storyPoints)
    }
    if (body.labels !== undefined) {
      validateLabels(body.labels)
    }
    if (body.assignedTo !== undefined && body.assignedTo !== null) {
      validateUUID(body.assignedTo, 'Assigned To')
    }
    if (body.dependsOn !== undefined) {
      body.dependsOn.forEach((depId) => validateUUID(depId, 'Dependency ID'))
    }

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

    // Verify assigned user exists and belongs to same account (if assigned)
    if (body.assignedTo) {
      const { data: assignedUser, error: userError } = await supabase
        .from('users')
        .select('id, account_id')
        .eq('id', body.assignedTo)
        .eq('account_id', user.account_id)
        .single()

      if (userError || !assignedUser) {
        throw APIErrors.badRequest('Assigned user not found or does not belong to your account')
      }
    }

    // Create feature
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .insert({
        project_id: body.projectId,
        account_id: user.account_id,
        title: body.title,
        description: body.description,
        priority: body.priority,
        effort_estimate_weeks: body.effortEstimateWeeks,
        depends_on: body.dependsOn || [],
        status: 'backlog',
        // Jira-style fields (Phase 6)
        ticket_type: body.ticketType || 'feature',
        story_points: body.storyPoints ?? null,
        labels: body.labels || [],
        acceptance_criteria: body.acceptanceCriteria || null,
        assigned_to: body.assignedTo || null,
        reporter: user.id, // Set reporter to the user creating the ticket
      })
      .select()
      .single()

    if (featureError || !feature) {
      console.error('[Feature Create] Error:', featureError)
      throw APIErrors.internalError('Failed to create feature')
    }

    // Format response
    const formattedFeature = {
      _id: feature.id,
      id: feature.id,
      projectId: feature.project_id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      priority: feature.priority,
      effortEstimateWeeks: feature.effort_estimate_weeks,
      dependsOn: feature.depends_on || [],
      createdAt: feature.created_at,
      // Jira-style fields (Phase 6)
      assignedTo: feature.assigned_to || null,
      reporter: feature.reporter || null,
      storyPoints: feature.story_points ?? null,
      labels: feature.labels || [],
      acceptanceCriteria: feature.acceptance_criteria || null,
      ticketType: feature.ticket_type || 'feature',
    }

    const response: CreateFeatureResponse = {
      feature: formattedFeature,
    }

    return successResponse(response, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleError(error)
  }
}

