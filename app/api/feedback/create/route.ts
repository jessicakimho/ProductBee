import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { analyzeProposal } from '@/lib/gemini'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, validateRequired, validateJsonBody, validateFeedbackType } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { HTTP_STATUS } from '@/lib/constants'
import type { CreateFeedbackRequest, CreateFeedbackResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const body = await validateJsonBody<CreateFeedbackRequest>(request)
    validateRequired(body, ['projectId', 'featureId', 'type', 'content'])
    validateUUID(body.projectId, 'Project ID')
    validateUUID(body.featureId, 'Feature ID')
    validateFeedbackType(body.type)

    const { projectId, featureId, type, content, proposedRoadmap } = body
    const supabase = createServerClient()

    // Check project access
    await requireProjectAccess(user, projectId)

    // Verify project and feature exist - filtered by account_id for account isolation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('account_id', user.account_id)
      .single()

    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('*')
      .eq('id', featureId)
      .eq('account_id', user.account_id)
      .single()

    if (projectError || !project) {
      throw APIErrors.notFound('Project')
    }

    if (featureError || !feature) {
      throw APIErrors.notFound('Feature')
    }

    // Verify feature belongs to project
    if (feature.project_id !== projectId) {
      throw APIErrors.badRequest('Feature does not belong to this project')
    }

    let aiAnalysis = undefined

    // If it's a proposal, analyze it with AI
    if (type === 'proposal') {
      try {
        const analysis = await analyzeProposal(content, project.roadmap)
        aiAnalysis = JSON.stringify(analysis)
      } catch (error) {
        console.error('Error analyzing proposal:', error)
        // Continue without AI analysis if it fails
      }
    }

    // Create feedback with account_id for account isolation
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .insert({
        project_id: projectId,
        feature_id: featureId,
        user_id: user.id,
        account_id: user.account_id,
        type,
        content,
        proposed_roadmap: proposedRoadmap || null,
        ai_analysis: aiAnalysis || null,
        status: 'pending',
      })
      .select(`
        *,
        user_id:users!feedback_user_id_fkey (
          name,
          email
        )
      `)
      .single()

    if (feedbackError || !feedback) {
      throw APIErrors.internalError('Failed to create feedback')
    }

    // Format response
    const formattedFeedback = {
      _id: feedback.id,
      id: feedback.id,
      projectId: feedback.project_id,
      featureId: feedback.feature_id,
      userId: feedback.user_id ? {
        _id: feedback.user_id.id,
        name: feedback.user_id.name,
        email: feedback.user_id.email,
      } : null,
      type: feedback.type,
      content: feedback.content,
      proposedRoadmap: feedback.proposed_roadmap,
      aiAnalysis: feedback.ai_analysis,
      status: feedback.status,
      createdAt: feedback.created_at,
    }

    const response: CreateFeedbackResponse = {
      feedback: formattedFeedback,
    }

    return successResponse(response, HTTP_STATUS.CREATED)
  } catch (error) {
    return handleError(error)
  }
}

