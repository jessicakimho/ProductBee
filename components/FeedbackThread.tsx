'use client'

import { MessageSquare, User, Clock, CheckCircle, XCircle } from 'lucide-react'

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

interface FeedbackThreadProps {
  feedback: Feedback[]
  onApprove?: (feedbackId: string) => void
  onReject?: (feedbackId: string) => void
  canApprove?: boolean
}

export default function FeedbackThread({
  feedback,
  onApprove,
  onReject,
  canApprove = false,
}: FeedbackThreadProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>No feedback yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <div
          key={item._id}
          className="card p-6"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="font-medium">
                {item.userId.name}
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/40" style={{ color: 'var(--text-muted)' }}>
                {item.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'pending' && item.type === 'proposal' && canApprove && (
                <>
                  <button
                    onClick={() => onApprove?.(item._id)}
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    title="Approve"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onReject?.(item._id)}
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              {item.status === 'approved' && (
                <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <CheckCircle className="w-4 h-4" />
                  <span>Approved</span>
                </span>
              )}
              {item.status === 'rejected' && (
                <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <XCircle className="w-4 h-4" />
                  <span>Rejected</span>
                </span>
              )}
            </div>
          </div>
          <p className="mb-4 whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
            {item.content}
          </p>
          {item.aiAnalysis && (
            <div className="mt-4 p-4 card bg-white/50">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                AI Analysis:
              </p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
                {typeof item.aiAnalysis === 'string'
                  ? JSON.parse(item.aiAnalysis).summary || item.aiAnalysis
                  : item.aiAnalysis}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3 h-3" />
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

