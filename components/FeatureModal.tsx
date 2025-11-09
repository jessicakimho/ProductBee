'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquare, Send, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import FeedbackThread from './FeedbackThread'

interface Feature {
  _id: string
  title: string
  description: string
  priority: 'P0' | 'P1' | 'P2'
  effortEstimateWeeks: number
  status: 'backlog' | 'active' | 'blocked' | 'complete'
}

interface Feedback {
  _id: string
  type: 'comment' | 'proposal'
  content: string
  aiAnalysis?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  userId: {
    name: string
    email: string
  }
}

interface FeatureModalProps {
  isOpen: boolean
  onClose: () => void
  feature: Feature | null
  projectId: string
  feedback: Feedback[]
  userRole?: string
  onFeatureUpdate?: () => void
}

export default function FeatureModal({
  isOpen,
  onClose,
  feature,
  projectId,
  feedback,
  userRole,
  onFeatureUpdate,
}: FeatureModalProps) {
  const [comment, setComment] = useState('')
  const [proposal, setProposal] = useState('')
  const [activeTab, setActiveTab] = useState<'comment' | 'proposal'>('comment')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canApprove = userRole === 'pm' || userRole === 'admin'

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
      toast.error('Please enter some content')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          featureId: feature._id,
          type,
          content: content.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit feedback')
      }

      toast.success(type === 'comment' ? 'Comment added!' : 'Proposal submitted!')
      if (type === 'comment') {
        setComment('')
      } else {
        setProposal('')
      }
      onFeatureUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (feedbackId: string) => {
    try {
      const response = await fetch('/api/feedback/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedbackId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve')
      }

      toast.success('Proposal approved!')
      onFeatureUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve')
    }
  }

  const handleReject = async (feedbackId: string) => {
    try {
      const response = await fetch('/api/feedback/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedbackId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject')
      }

      toast.success('Proposal rejected')
      onFeatureUpdate?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject')
    }
  }

  const priorityStyles: Record<string, string> = {
    P0: 'bg-white/40',
    P1: 'bg-white/30',
    P2: 'bg-white/20',
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 card border-b-0 rounded-b-none px-8 py-6" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold tracking-tight mb-3">
                {feature.title}
              </h2>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    priorityStyles[feature.priority] || 'bg-white/30'
                  }`}
                  style={{ color: 'var(--text-muted)' }}
                >
                  {feature.priority}
                </span>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-4 h-4" />
                  <span>{feature.effortEstimateWeeks} weeks</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 tracking-tight">
              Description
            </h3>
            <p className="whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
              {feature.description}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 tracking-tight">
              <MessageSquare className="w-5 h-5" />
              Feedback Thread
            </h3>
            <FeedbackThread
              feedback={feedback}
              onApprove={handleApprove}
              onReject={handleReject}
              canApprove={canApprove}
            />
          </div>

          <div className="border-t pt-8" style={{ borderColor: 'var(--border)' }}>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setActiveTab('comment')}
                className={activeTab === 'comment' ? 'active' : ''}
              >
                Add Comment
              </button>
              <button
                onClick={() => setActiveTab('proposal')}
                className={activeTab === 'proposal' ? 'active' : ''}
              >
                Submit Proposal
              </button>
            </div>

            {activeTab === 'comment' ? (
              <div className="space-y-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full"
                  placeholder="Add your comment..."
                />
                <button
                  onClick={() => handleSubmitFeedback('comment')}
                  disabled={isSubmitting || !comment.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Comment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  rows={6}
                  className="w-full"
                  placeholder="Describe your proposal for timeline changes, feature modifications, etc..."
                />
                <button
                  onClick={() => handleSubmitFeedback('proposal')}
                  disabled={isSubmitting || !proposal.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Proposal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

