'use client'

import { AlertCircle, Clock, ClockIcon } from 'lucide-react'
import type { FeatureResponse } from '@/types'

interface FeatureCardProps {
  feature: FeatureResponse
  onClick: () => void
  canEdit?: boolean
  onStatusChange?: (featureId: string, newStatus: FeatureResponse['status']) => void
  pendingChangeId?: string | null
}

// Priority color mapping
const priorityColors: Record<string, string> = {
  P0: 'bg-red-100 text-red-800',
  P1: 'bg-orange-100 text-orange-800',
  P2: 'bg-blue-100 text-blue-800',
}

export default function FeatureCard({
  feature,
  onClick,
  canEdit,
  onStatusChange,
  pendingChangeId,
}: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-card-inner shadow-soft p-4 cursor-pointer hover:shadow-lg transition-all ${
        pendingChangeId
          ? 'border-yellow-400 border-2'
          : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-[#0d0d0d] text-sm">
          {feature.title}
        </h4>
        <div className="flex items-center gap-2">
          {pendingChangeId && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              Pending
            </span>
          )}
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              priorityColors[feature.priority] ||
              'bg-gray-100 text-gray-800'
            }`}
          >
            {feature.priority}
          </span>
        </div>
      </div>
      <p className="text-sm text-[#404040] mb-3 line-clamp-2">
        {feature.description}
      </p>
      <div className="flex items-center gap-3 text-xs text-[#404040]">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{feature.effortEstimateWeeks} weeks</span>
        </div>
        {feature.status === 'blocked' && (
          <div className="flex items-center gap-1 text-orange-600">
            <AlertCircle className="w-3 h-3" />
            <span>Blocked</span>
          </div>
        )}
      </div>
    </div>
  )
}
