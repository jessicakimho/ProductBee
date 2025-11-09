'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, Send, Clock } from 'lucide-react'
import { ROLES } from '@/lib/constants'
import { useFeedback } from '@/hooks/useFeedback'
import FeedbackThread from '../feedback/FeedbackThread'
import type { FeatureResponse, FeedbackResponse } from '@/types'

interface FeatureModalProps {
  isOpen: boolean
  onClose: () => void
  feature: FeatureResponse | null
  projectId: string
  feedback: FeedbackResponse[]
  userRole?: string
  canEdit?: boolean
  canApprove?: boolean
  onFeatureUpdate?: () => void
}

// Priority color mapping
const priorityColors: Record<string, string> = {
  P0: 'bg-red-100 text-red-800',
  P1: 'bg-orange-100 text-orange-800',
  P2: 'bg-blue-100 text-blue-800',
}

export default function FeatureModal({
  isOpen,
  onClose,
  feature,
  projectId,
  feedback,
  userRole,
  canEdit = true,
  canApprove = false,
  onFeatureUpdate,
}: FeatureModalProps) {
  const [comment, setComment] = useState('')
  const [proposal, setProposal] = useState('')
  const [activeTab, setActiveTab] = useState<'comment' | 'proposal'>('comment')
  const { createFeedback, approveFeedback, rejectFeedback, isSubmitting } = useFeedback()

  // Determine permissions if not explicitly provided
  const hasApprovePermission = canApprove || userRole === ROLES.PM || userRole === ROLES.ADMIN
  const hasEditPermission = canEdit && userRole !== ROLES.VIEWER
  const isViewer = userRole === ROLES.VIEWER

  useEffect(() => {
    if (!isOpen) {
      setComment('')
      setProposal('')
      setActiveTab('comment')
    }
  }, [isOpen])

  if (!isOpen || !feature) return null

  const handleSubmitFeedback = async (type: 'comment' | 'proposal') => {
    const content = type === 'comment' ? comment : proposal
    if (!content.trim()) {
      return
    }

    const result = await createFeedback({
      projectId,
      featureId: feature._id || feature.id,
      type,
      content: content.trim(),
    })

    if (result) {
      if (type === 'comment') {
        setComment('')
      } else {
        setProposal('')
      }
      onFeatureUpdate?.()
    }
  }

  const handleApprove = async (feedbackId: string) => {
    const result = await approveFeedback(feedbackId)
    if (result) {
      onFeatureUpdate?.()
    }
  }

  const handleReject = async (feedbackId: string) => {
    const result = await rejectFeedback(feedbackId)
    if (result) {
      onFeatureUpdate?.()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card shadow-soft w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-[#d9d9d9] px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#0d0d0d] mb-2">
                {feature.title}
              </h2>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    priorityColors[feature.priority] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {feature.priority}
                </span>
                <div className="flex items-center gap-1 text-sm text-[#404040]">
                  <Clock className="w-4 h-4" />
                  <span>{feature.effortEstimateWeeks} weeks</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#404040] hover:text-[#0d0d0d] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#0d0d0d] mb-2">
              Description
            </h3>
            <p className="text-[#404040] whitespace-pre-wrap">
              {feature.description}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#0d0d0d] mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback Thread
            </h3>
            <FeedbackThread
              feedback={feedback}
              onApprove={handleApprove}
              onReject={handleReject}
              canApprove={hasApprovePermission}
            />
          </div>

          {!isViewer && (
            <div className="border-t border-[#d9d9d9] pt-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('comment')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'comment'
                      ? 'bg-[#a855f7] text-white'
                      : 'bg-white border border-[#d9d9d9] text-[#0d0d0d] hover:bg-[#f5f5f5]'
                  }`}
                >
                  Add Comment
                </button>
                <button
                  onClick={() => setActiveTab('proposal')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === 'proposal'
                      ? 'bg-[#a855f7] text-white'
                      : 'bg-white border border-[#d9d9d9] text-[#0d0d0d] hover:bg-[#f5f5f5]'
                  }`}
                >
                  Submit Proposal
                </button>
              </div>

            {activeTab === 'comment' ? (
              <div className="space-y-3">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-white border border-[#d9d9d9] rounded-lg text-[#0d0d0d] focus:outline-none focus:ring-2 focus:ring-[#a855f7] focus:border-transparent transition-all resize-none"
                  placeholder="Add your comment..."
                />
                <button
                  onClick={() => handleSubmitFeedback('comment')}
                  disabled={isSubmitting || !comment.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Submit Comment
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 bg-white border border-[#d9d9d9] rounded-lg text-[#0d0d0d] focus:outline-none focus:ring-2 focus:ring-[#a855f7] focus:border-transparent transition-all resize-none"
                  placeholder="Describe your proposal for timeline changes, feature modifications, etc..."
                />
                <button
                  onClick={() => handleSubmitFeedback('proposal')}
                  disabled={isSubmitting || !proposal.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Submit Proposal
                </button>
              </div>
            )}
            </div>
          )}
          
          {isViewer && (
            <div className="border-t border-[#d9d9d9] pt-6">
              <p className="text-sm text-[#404040] text-center">
                You have view-only access. Contact a PM or Admin to add comments or proposals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

