'use client'

import { useState } from 'react'
import { Sparkles, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useUserStories } from '@/hooks/useUserStories'
import type { TicketAlignmentResponse } from '@/types'

interface TicketAlignmentCheckProps {
  projectId: string
  ticketId: string
}

export default function TicketAlignmentCheck({ projectId, ticketId }: TicketAlignmentCheckProps) {
  const { checkTicketAlignment, isCheckingAlignment } = useUserStories()
  const [alignmentData, setAlignmentData] = useState<TicketAlignmentResponse | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const handleCheckAlignment = async () => {
    const result = await checkTicketAlignment(projectId, ticketId)
    if (result) {
      setAlignmentData(result)
      setHasChecked(true)
      setIsExpanded(true)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
    if (score >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
    return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Alignment Check</h3>
        </div>
        <button
          onClick={handleCheckAlignment}
          disabled={isCheckingAlignment}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Check how well this ticket aligns with user stories in this project using AI analysis.
        </p>
      )}

      {alignmentData && (
        <div className="space-y-4">
          {/* Alignment Score */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              {getScoreIcon(alignmentData.alignmentScore)}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Alignment Score</p>
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
            <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Analysis</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {alignmentData.aiAnalysis}
              </p>
            </div>
          )}

          {/* Matched User Stories */}
          {alignmentData.matchedUserStories && alignmentData.matchedUserStories.length > 0 && (
            <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Matched User Stories</h4>
              <div className="space-y-3">
                {alignmentData.matchedUserStories.map((match, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{match.userStoryName}</p>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                        {match.relevanceScore}% relevance
                      </span>
                    </div>
                    {match.reasons && match.reasons.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
            <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                Suggestions for Improvement
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
                {alignmentData.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {alignmentData.alignmentScore === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    No user stories found
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
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

