import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { getUserFromSession, requireTaskAssignment, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { suggestAssignment } from '@/lib/ai/assignment'
import { createServerClient } from '@/lib/supabase'
import type { SuggestAssigneeRequest, SuggestAssigneeResponse } from '@/types/api'

/**
 * POST /api/feature/suggest-assignee
 * Get AI-powered assignment suggestions for a task/feature
 * Phase 9: AI Smart Assignment Suggestions
 * 
 * Requires: PM or Admin role
 * Enforces: Account isolation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const body = await validateJsonBody<SuggestAssigneeRequest>(request)
    const supabase = createServerClient()

    // Validate required fields
    if (!body.taskDescription || typeof body.taskDescription !== 'string') {
      throw APIErrors.badRequest('taskDescription is required and must be a string')
    }

    if (!body.taskTitle || typeof body.taskTitle !== 'string') {
      throw APIErrors.badRequest('taskTitle is required and must be a string')
    }

    // If projectId is provided, verify access and get project context
    let projectId: string | undefined
    if (body.projectId) {
      validateUUID(body.projectId, 'Project ID')
      await requireTaskAssignment(user, body.projectId)
      projectId = body.projectId
    } else {
      // If no projectId, still require PM/Admin role
      requirePMOrAdmin(user)
    }

    // Get feature context if featureId is provided
    let featureContext: {
      title: string
      description: string
      labels: string[]
      ticketType: string
    } | null = null

    if (body.featureId) {
      validateUUID(body.featureId, 'Feature ID')

      const { data: feature, error: featureError } = await supabase
        .from('features')
        .select('title, description, labels, ticket_type, project_id, account_id')
        .eq('id', body.featureId)
        .eq('account_id', user.account_id)
        .single()

      if (featureError || !feature) {
        throw APIErrors.notFound('Feature')
      }

      // Verify project access if projectId wasn't provided
      if (!projectId) {
        await requireTaskAssignment(user, feature.project_id)
        projectId = feature.project_id
      } else if (projectId !== feature.project_id) {
        throw APIErrors.badRequest('Feature does not belong to the specified project')
      }

      featureContext = {
        title: feature.title,
        description: feature.description,
        labels: feature.labels || [],
        ticketType: feature.ticket_type || 'feature',
      }
    }

    // Use feature context if available, otherwise use request body
    const taskTitle = featureContext?.title || body.taskTitle
    const taskDescription = featureContext?.description || body.taskDescription
    const taskLabels = featureContext?.labels || body.taskLabels || []
    const taskType = featureContext?.ticketType || body.taskType || 'feature'

    // Get AI-powered assignment suggestions
    const suggestion = await suggestAssignment(
      taskDescription,
      taskTitle,
      taskLabels.length > 0 ? taskLabels : undefined,
      taskType,
      user.account_id,
      projectId
    )

    const response: SuggestAssigneeResponse = {
      suggestion,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

