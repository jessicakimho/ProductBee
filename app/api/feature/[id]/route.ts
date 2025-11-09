import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateFeatureStatus, validatePriority, validateTicketType, validateStoryPoints, validateLabels } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { UpdateFeatureRequest, UpdateFeatureResponse } from '@/types/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const featureId = params.id
    validateUUID(featureId, 'Feature ID')

    const updates = await validateJsonBody<UpdateFeatureRequest>(request)
    const supabase = createServerClient()

    // Get feature to check project access and account isolation
    const { data: existingFeature, error: featureFetchError } = await supabase
      .from('features')
      .select('project_id, account_id')
      .eq('id', featureId)
      .eq('account_id', user.account_id)
      .single()

    if (featureFetchError || !existingFeature) {
      throw APIErrors.notFound('Feature')
    }

    // Check project access (enforces account isolation)
    await requireProjectAccess(user, existingFeature.project_id)
    
    // Additional account_id check for safety
    if (existingFeature.account_id !== user.account_id) {
      throw APIErrors.forbidden('Access denied. Feature belongs to a different account.')
    }

    // Map camelCase to snake_case for database and validate
    const dbUpdates: any = {}
    if (updates.status !== undefined) {
      validateFeatureStatus(updates.status)
      dbUpdates.status = updates.status
    }
    if (updates.priority !== undefined) {
      validatePriority(updates.priority)
      dbUpdates.priority = updates.priority
    }
    if (updates.title !== undefined) {
      dbUpdates.title = updates.title
    }
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description
    }
    if (updates.effortEstimateWeeks !== undefined) {
      dbUpdates.effort_estimate_weeks = updates.effortEstimateWeeks
    }
    if (updates.dependsOn !== undefined) {
      // Validate all dependencies are UUIDs
      updates.dependsOn.forEach((depId) => validateUUID(depId, 'Dependency ID'))
      dbUpdates.depends_on = updates.dependsOn
    }
    // Jira-style fields (Phase 6)
    if (updates.assignedTo !== undefined) {
      if (updates.assignedTo !== null) {
        validateUUID(updates.assignedTo, 'Assigned To')
      }
      dbUpdates.assigned_to = updates.assignedTo
    }
    if (updates.reporter !== undefined) {
      if (updates.reporter !== null) {
        validateUUID(updates.reporter, 'Reporter')
      }
      dbUpdates.reporter = updates.reporter
    }
    if (updates.storyPoints !== undefined) {
      validateStoryPoints(updates.storyPoints)
      dbUpdates.story_points = updates.storyPoints
    }
    if (updates.labels !== undefined) {
      validateLabels(updates.labels)
      dbUpdates.labels = updates.labels || []
    }
    if (updates.acceptanceCriteria !== undefined) {
      dbUpdates.acceptance_criteria = updates.acceptanceCriteria || null
    }
    if (updates.ticketType !== undefined) {
      validateTicketType(updates.ticketType)
      dbUpdates.ticket_type = updates.ticketType || 'feature'
    }

    // If no updates, return error
    if (Object.keys(dbUpdates).length === 0) {
      throw APIErrors.badRequest('No valid updates provided')
    }

    const { data: feature, error: featureError } = await supabase
      .from('features')
      .update(dbUpdates)
      .eq('id', featureId)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (featureError || !feature) {
      throw APIErrors.internalError('Failed to update feature')
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

    const response: UpdateFeatureResponse = {
      feature: formattedFeature,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

