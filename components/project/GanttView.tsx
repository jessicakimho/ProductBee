'use client'

import { useMemo, useRef, useEffect } from 'react'
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
    <div className="bg-white p-3 rounded-lg shadow-soft">
      <div className="font-semibold text-[#0d0d0d]" style={{ fontSize, fontFamily }}>
        {task.name}
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

  // Hide Name/From/To header row and elements after render, and hide arrows
  useEffect(() => {
    const hideElements = () => {
      const container = document.querySelector('.gantt-container')
      if (container) {
        // Hide header rows
        const headerRows = container.querySelectorAll('thead tr:first-child')
        headerRows.forEach((row) => {
          const rowElement = row as HTMLElement
          rowElement.style.display = 'none'
        })

        // Hide divs with _1nBOt class (the container for Name/From/To)
        const nameContainers = container.querySelectorAll('div[class*="_1nBOt"]')
        nameContainers.forEach((el) => {
          const element = el as HTMLElement
          element.style.display = 'none'
        })

        // Hide divs containing Name/From/To text
        const allDivs = container.querySelectorAll('div')
        allDivs.forEach((div) => {
          const text = div.textContent?.trim()
          if (text === 'Name' || text === 'From' || text === 'To' || text === '&nbsp;Name' || text === '&nbsp;From' || text === '&nbsp;To') {
            const element = div as HTMLElement
            element.style.display = 'none'
            // Also hide parent if it's the container
            const parent = div.parentElement
            if (parent && parent.classList.toString().includes('_1nBOt')) {
              parent.style.display = 'none'
            }
          }
        })

        // Hide dependency arrows (SVG paths and lines)
        const svgElements = container.querySelectorAll('svg path, svg line')
        svgElements.forEach((el) => {
          const element = el as HTMLElement
          // Check if it's an arrow (usually has specific attributes or is in a certain position)
          const d = element.getAttribute('d')
          const markerEnd = element.getAttribute('marker-end')
          if (markerEnd || (d && d.includes('L'))) {
            element.style.display = 'none'
            element.style.visibility = 'hidden'
          }
        })
      }
    }

    // Run immediately and also after delays to catch dynamically rendered content
    hideElements()
    const timer = setTimeout(hideElements, 100)
    const timer2 = setTimeout(hideElements, 500)
    const timer3 = setTimeout(hideElements, 1000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-soft p-8">
        <div className="text-center text-[#404040]">
          <p className="text-lg mb-2">No timeline data available</p>
          <p className="text-sm">Features need start dates, end dates, or durations to appear in the Gantt chart.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-soft overflow-x-auto overflow-y-auto">
      <div className="w-full h-full p-6">
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Month}
          locale="en-US"
          onDateChange={() => {}} // Read-only for now
          onTaskDelete={() => {}} // Read-only for now
          onProgressChange={() => {}} // Read-only for now
          onDoubleClick={handleTaskClick}
          onClick={() => {}} // Disable single click
          listCellWidth="0"
          columnWidth={180}
          rowHeight={80}
          ganttHeight={Math.max(600, tasks.length * 80 + 200)}
          preStepsCount={1}
          todayColor="rgba(59, 130, 246, 0.08)"
          TooltipContent={TooltipContent}
          fontSize="14"
          fontFamily="inherit"
        />
      </div>
    </div>
  )
}

