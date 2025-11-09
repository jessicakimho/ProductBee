'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { FeedbackResponse, CreateFeedbackRequest } from '@/types'

export function useFeedback() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const createFeedback = useCallback(async (
    feedbackData: CreateFeedbackRequest
  ): Promise<FeedbackResponse | null> => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/feedback/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to create feedback')
      }

      // Handle wrapped response: { success: true, data: { feedback: {...} } }
      const data = responseData.data
      const typeLabel = feedbackData.type === 'comment' ? 'Comment' : 'Proposal'
      toast.success(`${typeLabel} submitted successfully!`)
      return data.feedback
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit feedback'
      toast.error(message)
      console.error('Error creating feedback:', error)
      return null
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const approveFeedback = useCallback(async (
    feedbackId: string
  ): Promise<FeedbackResponse | null> => {
    try {
      setIsApproving(true)
      const response = await fetch('/api/feedback/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedbackId }),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        // Check for permission errors
        if (response.status === 403 || responseData.error?.includes('Access denied') || responseData.error?.includes('PM')) {
          throw new Error('Only PMs and Admins can approve proposals. Please contact a PM or Admin for assistance.')
        }
        throw new Error(responseData.error || 'Failed to approve feedback')
      }

      // Handle wrapped response: { success: true, data: { message: string, feedback: {...} } }
      const data = responseData.data
      toast.success('Proposal approved!')
      return data.feedback
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve feedback'
      toast.error(message)
      console.error('Error approving feedback:', error)
      return null
    } finally {
      setIsApproving(false)
    }
  }, [])

  const rejectFeedback = useCallback(async (
    feedbackId: string
  ): Promise<FeedbackResponse | null> => {
    try {
      setIsRejecting(true)
      const response = await fetch('/api/feedback/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedbackId }),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        // Check for permission errors
        if (response.status === 403 || responseData.error?.includes('Access denied') || responseData.error?.includes('PM')) {
          throw new Error('Only PMs and Admins can reject proposals. Please contact a PM or Admin for assistance.')
        }
        throw new Error(responseData.error || 'Failed to reject feedback')
      }

      // Handle wrapped response: { success: true, data: { message: string, feedback: {...} } }
      const data = responseData.data
      toast.success('Proposal rejected')
      return data.feedback
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject feedback'
      toast.error(message)
      console.error('Error rejecting feedback:', error)
      return null
    } finally {
      setIsRejecting(false)
    }
  }, [])

  return {
    createFeedback,
    approveFeedback,
    rejectFeedback,
    isSubmitting,
    isApproving,
    isRejecting,
  }
}

