'use client'

import { MessageSquare, User, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { FeedbackResponse } from '@/types'

interface FeedbackThreadProps {
  feedback: FeedbackResponse[]
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
      <div className="text-center py-8 text-[#404040]">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No feedback yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <div
          key={item._id || item.id}
          className="bg-white rounded-card-inner shadow-soft p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#404040]" />
              <span className="font-medium text-[#0d0d0d]">
                {typeof item.userId === 'object' && item.userId !== null
                  ? item.userId.name || 'Unknown User'
                  : 'Unknown User'}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#a855f7] bg-opacity-10 text-[#a855f7]">
                {item.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'pending' && item.type === 'proposal' && canApprove && (
                <>
                  <button
                    onClick={() => onApprove?.(item._id || item.id)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Approve"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onReject?.(item._id || item.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              {item.status === 'approved' && (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Approved</span>
                </span>
              )}
              {item.status === 'rejected' && (
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">Rejected</span>
                </span>
              )}
            </div>
          </div>
          <p className="text-[#404040] mb-3 whitespace-pre-wrap">
            {item.content}
          </p>
          {item.aiAnalysis && (
            <div className="mt-3 p-3 bg-[#a855f7] bg-opacity-5 rounded-lg border border-[#a855f7] border-opacity-20">
              <p className="text-xs font-medium text-[#a855f7] mb-1">
                AI Analysis:
              </p>
              <p className="text-sm text-[#404040] whitespace-pre-wrap">
                {typeof item.aiAnalysis === 'string'
                  ? (() => {
                      try {
                        const parsed = JSON.parse(item.aiAnalysis)
                        return parsed.summary || item.aiAnalysis
                      } catch {
                        return item.aiAnalysis
                      }
                    })()
                  : item.aiAnalysis}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-[#404040]">
            <Clock className="w-3 h-3" />
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

