'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Sparkles, Loader2, AlertTriangle, User, X } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import type { SuggestedTicket } from '@/types/chat'
import { PRIORITY_LEVELS } from '@/lib/constants'

interface TicketGenerationControlsProps {
  projectId: string
  onTicketsApplied?: (ticketIds: string[]) => void
}

interface EngineerInfo {
  id: string
  name: string
  currentTicketCount: number
  currentStoryPointCount: number
  isOverloaded: boolean
  confidenceScore?: number
}

// Thresholds for "red" engineers (overloaded)
const OVERLOAD_THRESHOLDS = {
  MAX_TICKETS: 5,
  MAX_STORY_POINTS: 30,
}

// Check if engineer is overloaded (in the red)
function isEngineerOverloaded(ticketCount: number, storyPointCount: number): boolean {
  return ticketCount > OVERLOAD_THRESHOLDS.MAX_TICKETS || storyPointCount > OVERLOAD_THRESHOLDS.MAX_STORY_POINTS
}

// Check if ticket can be auto-assigned
function canAutoAssign(ticket: SuggestedTicket, engineerInfo: EngineerInfo | null): boolean {
  if (!ticket.assignedTo || !engineerInfo) return false
  if (ticket.confidenceScore === undefined || ticket.confidenceScore < 50) return false
  return !engineerInfo.isOverloaded
}

export default function TicketGenerationControls({
  projectId,
  onTicketsApplied,
}: TicketGenerationControlsProps) {
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set())
  const [visibleTickets, setVisibleTickets] = useState<number[]>([])
  const [engineerInfoMap, setEngineerInfoMap] = useState<Map<number, EngineerInfo | null>>(new Map())
  const [loadingEngineers, setLoadingEngineers] = useState<Set<number>>(new Set())
  const [assignmentWarnings, setAssignmentWarnings] = useState<Map<number, string>>(new Map())

  const {
    suggestedTickets,
    applyTickets,
    isApplying,
    isGenerating,
    setSuggestedTickets,
  } = useChat(projectId)

  // Fetch engineer info for a ticket
  const fetchEngineerInfo = async (ticketIndex: number, ticket: SuggestedTicket) => {
    if (!ticket.assignedTo) {
      setEngineerInfoMap((prev) => new Map(prev.set(ticketIndex, null)))
      return
    }

    setLoadingEngineers((prev) => new Set(prev).add(ticketIndex))

    try {
      const response = await fetch('/api/team/members')
      const responseData = await response.json()

      if (response.ok && responseData.success) {
        const engineer = responseData.data.members.find((m: any) => m.id === ticket.assignedTo)
        if (engineer) {
          const isOverloaded = isEngineerOverloaded(
            engineer.currentTicketCount,
            engineer.currentStoryPointCount
          )
          setEngineerInfoMap((prev) =>
            new Map(
              prev.set(ticketIndex, {
                id: engineer.id,
                name: engineer.name,
                currentTicketCount: engineer.currentTicketCount,
                currentStoryPointCount: engineer.currentStoryPointCount,
                isOverloaded,
                confidenceScore: ticket.confidenceScore,
              })
            )
          )
        } else {
          setEngineerInfoMap((prev) => new Map(prev.set(ticketIndex, null)))
        }
      }
    } catch (error) {
      console.error('Failed to fetch engineer info:', error)
      setEngineerInfoMap((prev) => new Map(prev.set(ticketIndex, null)))
    } finally {
      setLoadingEngineers((prev) => {
        const next = new Set(prev)
        next.delete(ticketIndex)
        return next
      })
    }
  }

  // Fetch engineer info for all tickets with assignments
  useEffect(() => {
    if (suggestedTickets.length === 0) {
      setEngineerInfoMap(new Map())
      setVisibleTickets([])
      return
    }

    // Fetch engineer info for all tickets
    suggestedTickets.forEach((ticket, index) => {
      if (ticket.assignedTo && !engineerInfoMap.has(index)) {
        fetchEngineerInfo(index, ticket)
      }
    })
  }, [suggestedTickets])

  // Determine which tickets can be auto-assigned
  const autoAssignableTickets = suggestedTickets
    .map((ticket, index) => {
      const engineerInfo = engineerInfoMap.get(index)
      return { index, ticket, engineerInfo, canAutoAssign: canAutoAssign(ticket, engineerInfo || null) }
    })
    .filter((item) => item.canAutoAssign)
    .map((item) => item.index)

  // Check if all engineers are overloaded or all confidence scores are < 50%
  // Only consider tickets with assignments
  const ticketsWithAssignments = suggestedTickets
    .map((ticket, index) => ({ ticket, index }))
    .filter(({ ticket }) => ticket.assignedTo)

  const allEngineersOverloaded =
    ticketsWithAssignments.length > 0 &&
    ticketsWithAssignments.every(({ index }) => {
      const engineerInfo = engineerInfoMap.get(index)
      return !engineerInfo || engineerInfo.isOverloaded
    })

  const allConfidenceLow =
    ticketsWithAssignments.length > 0 &&
    ticketsWithAssignments.every(
      ({ ticket }) => ticket.confidenceScore === undefined || ticket.confidenceScore < 50
    )

  const shouldShowWarnings = (allEngineersOverloaded || allConfidenceLow) && ticketsWithAssignments.length > 0

  // Lazy load tickets: auto-assignable ones first, then others one by one
  useEffect(() => {
    if (suggestedTickets.length === 0 || isGenerating) {
      return
    }

    // Wait for engineer info to load for tickets with assignments
    const ticketsWithAssignments = suggestedTickets.filter((t) => t.assignedTo)
    if (ticketsWithAssignments.length > 0 && loadingEngineers.size > 0) {
      return // Wait for engineer info to load
    }

    // If we can auto-assign some tickets, show those first
    if (autoAssignableTickets.length > 0) {
      autoAssignableTickets.forEach((index, i) => {
        setTimeout(() => {
          setVisibleTickets((prev) => {
            if (!prev.includes(index)) {
              return [...prev, index]
            }
            return prev
          })
        }, i * 100) // Stagger by 100ms
      })
    }

    // Show non-auto-assignable tickets one by one (quicker)
    const nonAutoAssignable = suggestedTickets
      .map((_, index) => index)
      .filter((index) => !autoAssignableTickets.includes(index))

    if (nonAutoAssignable.length > 0) {
      // If we have auto-assignable tickets, wait a bit after they're shown
      // Otherwise, show non-auto-assignable tickets immediately
      const delay = autoAssignableTickets.length > 0 ? autoAssignableTickets.length * 100 + 200 : 0
      nonAutoAssignable.forEach((index, i) => {
        setTimeout(() => {
          setVisibleTickets((prev) => {
            if (!prev.includes(index)) {
              return [...prev, index]
            }
            return prev
          })
        }, delay + i * 50) // Faster loading (50ms between tickets)
      })
    }
  }, [suggestedTickets, isGenerating, autoAssignableTickets, loadingEngineers.size])

  // Check for assignment warnings when selecting tickets
  useEffect(() => {
    const warnings = new Map<number, string>()
    selectedTickets.forEach((index) => {
      const ticket = suggestedTickets[index]
      const engineerInfo = engineerInfoMap.get(index)

      if (ticket.assignedTo && engineerInfo) {
        if (engineerInfo.isOverloaded) {
          warnings.set(
            index,
            `Warning: ${engineerInfo.name} is overloaded (${engineerInfo.currentTicketCount} tickets, ${engineerInfo.currentStoryPointCount} story points). Manual assignment required.`
          )
        } else if (ticket.confidenceScore !== undefined && ticket.confidenceScore < 50) {
          warnings.set(index, `Warning: Low confidence score (${ticket.confidenceScore}%). Manual assignment recommended.`)
        }
      }
    })
    setAssignmentWarnings(warnings)
  }, [selectedTickets, suggestedTickets, engineerInfoMap])

  const handleTicketToggle = (index: number) => {
    const newSelected = new Set(selectedTickets)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTickets(newSelected)
  }

  const handleApply = async () => {
    if (selectedTickets.size === 0) return

    const ticketsToApply = suggestedTickets.filter((_, index) => selectedTickets.has(index))

    const createdIds = await applyTickets(ticketsToApply)
    if (createdIds) {
      // Remove applied tickets from suggestions
      const remainingTickets = suggestedTickets.filter((_, index) => !selectedTickets.has(index))
      setSuggestedTickets(remainingTickets)
      setSelectedTickets(new Set())
      setAssignmentWarnings(new Map())
      onTicketsApplied?.(createdIds)
    }
  }

  const handleDismiss = () => {
    setSuggestedTickets([])
    setSelectedTickets(new Set())
    setAssignmentWarnings(new Map())
    setEngineerInfoMap(new Map())
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case PRIORITY_LEVELS.CRITICAL:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case PRIORITY_LEVELS.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case PRIORITY_LEVELS.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case PRIORITY_LEVELS.LOW:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Show skeleton loaders while generating
  if (isGenerating && suggestedTickets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generating tickets...
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (suggestedTickets.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI-Generated Tickets ({suggestedTickets.length})
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Dismiss"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Global Warning */}
      {shouldShowWarnings && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Auto-assignment unavailable
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {allEngineersOverloaded
                  ? 'All engineers are overloaded. Manual assignment required for all tickets.'
                  : 'All assignments have low confidence scores. Manual assignment recommended.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {suggestedTickets.map((ticket, index) => {
          const isVisible = visibleTickets.includes(index)
          const isLoading = loadingEngineers.has(index) || (isGenerating && !isVisible)
          const engineerInfo = engineerInfoMap.get(index)
          const canAutoAssign = canAutoAssign(ticket, engineerInfo || null)
          const warning = assignmentWarnings.get(index)

          if (!isVisible && !isLoading) return null

          return (
            <div
              key={index}
              className={`border rounded-lg transition-all ${
                isLoading
                  ? 'opacity-50'
                  : isVisible
                  ? 'opacity-100 animate-fade-in'
                  : 'opacity-0'
              } ${
                selectedTickets.has(index)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => handleTicketToggle(index)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {selectedTickets.has(index) ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Engineer Assignment Info */}
                    {ticket.assignedTo ? (
                      <div
                        className={`mb-3 p-2 rounded-lg ${
                          canAutoAssign
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : engineerInfo?.isOverloaded
                            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Loading engineer info...
                            </span>
                          </div>
                        ) : engineerInfo ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {engineerInfo.name}
                              </span>
                              {canAutoAssign && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  (Auto-assigned)
                                </span>
                              )}
                              {engineerInfo.isOverloaded && (
                                <span className="text-xs text-red-600 dark:text-red-400">
                                  (Overloaded - Manual assignment required)
                                </span>
                              )}
                              {!canAutoAssign && !engineerInfo.isOverloaded && ticket.confidenceScore !== undefined && ticket.confidenceScore < 50 && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                  (Low confidence)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {engineerInfo.currentTicketCount} tickets, {engineerInfo.currentStoryPointCount} SP
                              {ticket.confidenceScore !== undefined && (
                                <span> • {ticket.confidenceScore}% confidence</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Engineer not found
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          No engineer assigned • Manual assignment required
                        </div>
                      </div>
                    )}

                    {/* Ticket Info */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {ticket.title}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Effort: {ticket.effortEstimateWeeks} weeks</span>
                      {ticket.storyPoints && <span>• {ticket.storyPoints} SP</span>}
                      {ticket.labels && ticket.labels.length > 0 && (
                        <span>• {ticket.labels.join(', ')}</span>
                      )}
                      {!ticket.assignedTo && ticket.confidenceScore !== undefined && (
                        <span>• {ticket.confidenceScore}% confidence</span>
                      )}
                    </div>

                    {/* Assignment Warning */}
                    {warning && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                        {warning}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedTickets.size} of {suggestedTickets.length} tickets selected
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            disabled={isApplying}
          >
            Dismiss
          </button>
          <button
            onClick={handleApply}
            disabled={selectedTickets.size === 0 || isApplying}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Apply Selected ({selectedTickets.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
