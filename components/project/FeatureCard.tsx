'use client'

import { AlertCircle, Clock } from 'lucide-react'
import type { FeatureResponse } from '@/types'

interface FeatureCardProps {
  feature: FeatureResponse
  onClick: () => void
  canEdit?: boolean
  onStatusChange?: (featureId: string, newStatus: FeatureResponse['status']) => void
}

// Priority color mapping
const priorityColors: Record<string, string> = {
  P0: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  P1: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  P2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

export default function FeatureCard({ feature, onClick, canEdit, onStatusChange }: FeatureCardProps) {
  // Props are accepted for future use but not implemented yet
  // Status changes will be handled in FeatureModal or via drag-and-drop
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
          {feature.title}
        </h4>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            priorityColors[feature.priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {feature.priority}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
        {feature.description}
      </p>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{feature.effortEstimateWeeks} weeks</span>
        </div>
        {feature.status === 'blocked' && (
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-3 h-3" />
            <span>Blocked</span>
          </div>
        )}
      </div>
    </div>
  )
}

