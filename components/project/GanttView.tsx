'use client'

import { useMemo, useRef } from 'react'
import { Gantt, ViewMode } from 'gantt-task-react'
import type { Task } from 'gantt-task-react'
import 'gantt-task-react/dist/index.css'
import { PRIORITY_LEVELS } from '@/lib/constants'
import type { FeatureResponse } from '@/types'

interface GanttViewProps {
  features: FeatureResponse[]
  onTaskClick?: (feature: FeatureResponse) => void
}

// Priority color mapping for Gantt bars
const priorityColors: Record<string, string> = {
  [PRIORITY_LEVELS.CRITICAL]: '#ef4444', // red-500
  [PRIORITY_LEVELS.HIGH]: '#f59e0b', // amber-500
  [PRIORITY_LEVELS.MEDIUM]: '#3b82f6', // blue-500
  [PRIORITY_LEVELS.LOW]: '#10b981', // emerald-500
}

// Default color for features without priority
const defaultColor = '#6b7280' // gray-500

// Custom Tooltip Component
const TooltipContent = ({ task, fontSize, fontFamily }: { task: Task; fontSize: string; fontFamily: string }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="font-semibold text-gray-900 dark:text-white mb-1" style={{ fontSize, fontFamily }}>
        {task.name}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {task.start.toLocaleDateString()} - {task.end.toLocaleDateString()}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Progress: {task.progress}%
      </div>
    </div>
  )
}

/**
 * Convert FeatureResponse to Gantt Task format
 */
function featureToTask(feature: FeatureResponse, allFeatures: FeatureResponse[]): Task {
  // Get start and end dates
  const startDate = feature.startDate ? new Date(feature.startDate) : new Date()
  const endDate = feature.endDate
    ? new Date(feature.endDate)
    : feature.startDate && feature.duration
    ? new Date(new Date(feature.startDate).getTime() + feature.duration * 24 * 60 * 60 * 1000)
    : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // Default 7 days

  // Ensure end date is after start date
  const finalEndDate = endDate > startDate ? endDate : new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000)

  // Get priority color
  const priority = feature.priority || PRIORITY_LEVELS.LOW
  const barColor = priorityColors[priority] || defaultColor

  // Convert dependencies to Gantt format (array of task IDs)
  // Map dependency IDs to actual task IDs
  const dependencies: string[] = (feature.dependsOn || [])
    .map((depId) => {
      const depFeature = allFeatures.find((f) => f._id === depId || f.id === depId)
      return depFeature?._id || depFeature?.id || depId
    })
    .filter(Boolean) as string[]

  return {
    start: startDate,
    end: finalEndDate,
    name: feature.title,
    id: feature._id || feature.id,
    type: 'task',
    progress: feature.status === 'complete' ? 100 : feature.status === 'in_progress' || feature.status === 'active' ? 50 : 0,
    dependencies: dependencies,
    styles: {
      progressColor: barColor,
      progressSelectedColor: barColor,
      backgroundColor: barColor,
      backgroundSelectedColor: barColor,
    },
  }
}

export default function GanttView({ features, onTaskClick }: GanttViewProps) {
  // Create a map to store feature data by task ID
  const featureMapRef = useRef<Map<string, FeatureResponse>>(new Map())

  // Convert features to Gantt tasks
  const tasks = useMemo(() => {
    if (!features || features.length === 0) {
      return []
    }

    // Clear and rebuild the feature map
    featureMapRef.current.clear()

    const tasksWithTimeline = features
      .filter((f) => f.startDate || f.endDate || f.duration) // Only show features with timeline data
      .map((feature) => {
        const task = featureToTask(feature, features)
        // Store feature in map for click handler
        featureMapRef.current.set(task.id, feature)
        return task
      })

    return tasksWithTimeline
  }, [features])

  const handleTaskClick = (task: Task) => {
    const feature = featureMapRef.current.get(task.id)
    if (feature && onTaskClick) {
      onTaskClick(feature)
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-soft p-8 border border-[#d9d9d9]">
        <div className="text-center text-[#404040]">
          <p className="text-lg mb-2">No timeline data available</p>
          <p className="text-sm">Features need start dates, end dates, or durations to appear in the Gantt chart.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-soft border border-[#d9d9d9] overflow-x-auto">
      <div className="p-4">
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Month}
          locale="en-US"
          onDateChange={() => {}} // Read-only for now
          onTaskDelete={() => {}} // Read-only for now
          onProgressChange={() => {}} // Read-only for now
          onDoubleClick={handleTaskClick}
          onClick={handleTaskClick}
          listCellWidth=""
          columnWidth={65}
          rowHeight={50}
          ganttHeight={Math.max(400, tasks.length * 50 + 100)}
          preStepsCount={1}
          todayColor="rgba(59, 130, 246, 0.3)" // blue with opacity
          TooltipContent={TooltipContent}
        />
      </div>
    </div>
  )
}

