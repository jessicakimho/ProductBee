import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProposalApproval } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { RejectFeedbackRequest, RejectFeedbackResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const body = await validateJsonBody<RejectFeedbackRequest>(request)
    validateRequired(body, ['feedbackId'])
    validateUUID(body.feedbackId, 'Feedback ID')

    const { feedbackId } = body
    const supabase = createServerClient()

    // Get feedback - filtered by account_id for account isolation
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .eq('account_id', user.account_id)
      .single()

    if (feedbackError || !feedback) {
      throw APIErrors.notFound('Feedback')
    }

    if (feedback.status !== 'pending') {
      throw APIErrors.badRequest('Feedback already processed')
    }

    // Check permission to approve/reject proposals (PM/Admin + account isolation)
    await requireProposalApproval(user, feedback.project_id)

    // Update feedback status - filtered by account_id for account isolation
    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update({ status: 'rejected' })
      .eq('id', feedbackId)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (updateError) {
      throw APIErrors.internalError('Failed to update feedback')
    }

    // Format response
    const formattedFeedback = {
      _id: updatedFeedback.id,
      id: updatedFeedback.id,
      projectId: updatedFeedback.project_id,
      featureId: updatedFeedback.feature_id,
      userId: updatedFeedback.user_id,
      type: updatedFeedback.type,
      content: updatedFeedback.content,
      proposedRoadmap: updatedFeedback.proposed_roadmap,
      aiAnalysis: updatedFeedback.ai_analysis,
      status: updatedFeedback.status,
      createdAt: updatedFeedback.created_at,
    }

    const response: RejectFeedbackResponse = {
      message: 'Proposal rejected',
      feedback: formattedFeedback,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

