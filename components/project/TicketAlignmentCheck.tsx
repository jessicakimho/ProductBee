'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useUserStories } from '@/hooks/useUserStories'
import type { TicketAlignmentResponse } from '@/types'

interface TicketAlignmentCheckProps {
  projectId: string
  ticketId: string
  alignmentData?: TicketAlignmentResponse | null
  onAlignmentDataChange?: (data: TicketAlignmentResponse | null) => void
}

export default function TicketAlignmentCheck({ 
  projectId, 
  ticketId,
  alignmentData: externalAlignmentData,
  onAlignmentDataChange
}: TicketAlignmentCheckProps) {
  const { checkTicketAlignment, isCheckingAlignment } = useUserStories()
  const [internalAlignmentData, setInternalAlignmentData] = useState<TicketAlignmentResponse | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  // Use external alignment data if provided, otherwise use internal state
  const alignmentData = externalAlignmentData !== undefined ? externalAlignmentData : internalAlignmentData

  // Sync hasChecked state based on alignmentData
  useEffect(() => {
    if (alignmentData) {
      setHasChecked(true)
      setIsExpanded(true)
    }
  }, [alignmentData])

  const handleCheckAlignment = async () => {
    const result = await checkTicketAlignment(projectId, ticketId)
    if (result) {
      if (onAlignmentDataChange) {
        // Use external state management if provided
        onAlignmentDataChange(result)
      } else {
        // Use internal state management
        setInternalAlignmentData(result)
      }
      setHasChecked(true)
      setIsExpanded(true)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />
    return <XCircle className="w-5 h-5 text-red-600" />
  }

  return (
    <div className="border border-[#d9d9d9] rounded-card p-4 bg-[#f5f5f5]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#a855f7]" />
          <h3 className="text-lg font-semibold text-[#0d0d0d]">AI Alignment Check</h3>
        </div>
        <button
          onClick={handleCheckAlignment}
          disabled={isCheckingAlignment}
          className="px-4 py-2 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-soft"
        >
          {isCheckingAlignment ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Check Alignment
            </>
          )}
        </button>
      </div>

      {!hasChecked && !isCheckingAlignment && (
        <p className="text-sm text-[#404040]">
          Check how well this ticket aligns with user stories in this project using AI analysis.
        </p>
      )}

      {alignmentData && (
        <div className="space-y-4">
          {/* Alignment Score */}
          <div className="flex items-center justify-between p-4 bg-white rounded-card-inner shadow-soft">
            <div className="flex items-center gap-3">
              {getScoreIcon(alignmentData.alignmentScore)}
              <div>
                <p className="text-sm font-medium text-[#404040]">Alignment Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(alignmentData.alignmentScore)}`}>
                  {alignmentData.alignmentScore}%
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(alignmentData.alignmentScore)}`}
            >
              {alignmentData.alignmentScore >= 80 ? 'Well Aligned' : alignmentData.alignmentScore >= 60 ? 'Moderate' : 'Needs Improvement'}
            </span>
          </div>

          {/* AI Analysis */}
          {alignmentData.aiAnalysis && (
            <div className="p-4 bg-white rounded-card-inner shadow-soft">
              <h4 className="text-sm font-medium text-[#0d0d0d] mb-2">AI Analysis</h4>
              <p className="text-sm text-[#404040] whitespace-pre-wrap">
                {alignmentData.aiAnalysis}
              </p>
            </div>
          )}

          {/* Matched User Stories */}
          {alignmentData.matchedUserStories && alignmentData.matchedUserStories.length > 0 && (
            <div className="p-4 bg-white rounded-card-inner shadow-soft">
              <h4 className="text-sm font-medium text-[#0d0d0d] mb-3">Matched User Stories</h4>
              <div className="space-y-3">
                {alignmentData.matchedUserStories.map((match, index) => (
                  <div key={index} className="border border-[#d9d9d9] rounded-card-inner p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[#0d0d0d]">{match.userStoryName}</p>
                      <span className="px-2 py-1 bg-[#a855f7] bg-opacity-10 text-[#a855f7] rounded-full text-xs font-medium">
                        {match.relevanceScore}% relevance
                      </span>
                    </div>
                    {match.reasons && match.reasons.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-[#404040] space-y-1">
                        {match.reasons.map((reason, reasonIndex) => (
                          <li key={reasonIndex}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {alignmentData.suggestions && alignmentData.suggestions.length > 0 && (
            <div className="p-4 bg-white rounded-card-inner shadow-soft">
              <h4 className="text-sm font-medium text-[#0d0d0d] mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                Suggestions for Improvement
              </h4>
              <ul className="list-disc list-inside text-sm text-[#404040] space-y-2">
                {alignmentData.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {alignmentData.alignmentScore === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-card-inner">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    No user stories found
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Create user stories for this project to enable alignment checking.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

