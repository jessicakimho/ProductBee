'use client'

import { X, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { PendingChangeResponse, FeatureResponse } from '@/types'
import { FEATURE_STATUS } from '@/lib/constants'

interface PendingChangesListProps {
  isOpen: boolean
  onClose: () => void
  pendingChanges: PendingChangeResponse[]
  features: FeatureResponse[]
  onApprove: (featureId: string, pendingChangeId: string) => Promise<void>
  onReject: (featureId: string, pendingChangeId: string, reason?: string) => Promise<void>
  isApproving: boolean
  isRejecting: boolean
}

const statusLabels: Record<string, string> = {
  [FEATURE_STATUS.NOT_STARTED]: 'Backlog',
  [FEATURE_STATUS.IN_PROGRESS]: 'In Progress',
  [FEATURE_STATUS.BLOCKED]: 'Blocked',
  [FEATURE_STATUS.COMPLETE]: 'Complete',
}

export default function PendingChangesList({
  isOpen,
  onClose,
  pendingChanges,
  features,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: PendingChangesListProps) {
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({})
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  if (!isOpen) return null

  const getFeatureTitle = (featureId: string) => {
    const feature = features.find((f) => f.id === featureId || f._id === featureId)
    return feature?.title || 'Unknown Feature'
  }

  const handleReject = async (featureId: string, pendingChangeId: string) => {
    try {
      setRejectingId(pendingChangeId)
      const reason = rejectionReasons[pendingChangeId] || undefined
      await onReject(featureId, pendingChangeId, reason)
      
      // Clear rejection reason after successful rejection
      setRejectionReasons((prev) => {
        const updated = { ...prev }
        delete updated[pendingChangeId]
        return updated
      })
    } catch (error) {
      // Error is already handled by onReject (toast notification in hook)
      // But we still need to log it for debugging
      console.error('Error rejecting status change:', error)
    } finally {
      // Always reset rejectingId, even if rejection fails
      setRejectingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-card shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#d9d9d9]">
          <h2 className="text-xl font-semibold text-[#0d0d0d]">
            Pending Status Changes
          </h2>
          <button
            onClick={onClose}
            className="text-[#404040] hover:text-[#0d0d0d] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {pendingChanges.length === 0 ? (
            <div className="text-center py-8 text-[#404040]">
              <p>No pending status changes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingChanges.map((change) => {
                const featureTitle = getFeatureTitle(change.featureId)
                // Use both id and _id for comparison to handle ID variations
                const changeId = change.id || change._id
                const isRejecting = rejectingId === changeId
                const showReasonInput = rejectingId === changeId

                return (
                  <div
                    key={changeId}
                    className="border border-[#d9d9d9] rounded-card-inner p-4 bg-[#f5f5f5]"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-[#0d0d0d] mb-1">
                          {featureTitle}
                        </h3>
                        <p className="text-sm text-[#404040]">
                          <span className="font-medium">{change.proposedBy.name}</span> wants to move
                          from{' '}
                          <span className="font-medium">
                            {statusLabels[change.fromStatus] || change.fromStatus}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {statusLabels[change.toStatus] || change.toStatus}
                          </span>
                        </p>
                        <p className="text-xs text-[#404040] mt-1">
                          {new Date(change.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Rejection reason input */}
                    {showReasonInput && (
                      <div className="mb-3">
                        <textarea
                          value={rejectionReasons[changeId] || ''}
                          onChange={(e) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [changeId]: e.target.value,
                            }))
                          }
                          placeholder="Optional: Provide a reason for rejection..."
                          className="w-full px-3 py-2 text-sm border border-[#d9d9d9] rounded-card-inner bg-white text-[#0d0d0d] placeholder-[#404040] focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApprove(change.featureId, changeId)}
                        disabled={isApproving || isRejecting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-soft"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          if (showReasonInput) {
                            handleReject(change.featureId, changeId)
                          } else {
                            setRejectingId(changeId)
                          }
                        }}
                        disabled={isApproving || isRejecting}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-soft"
                      >
                        <XCircle className="w-4 h-4" />
                        {showReasonInput ? 'Confirm Reject' : 'Reject'}
                      </button>
                      {showReasonInput && (
                        <button
                          onClick={() => {
                            setRejectingId(null)
                            setRejectionReasons((prev) => {
                              const updated = { ...prev }
                              delete updated[changeId]
                              return updated
                            })
                          }}
                          disabled={isRejecting}
                          className="px-4 py-2 text-sm font-medium text-[#404040] bg-[#d9d9d9] rounded-full hover:bg-[#c9c9c9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

