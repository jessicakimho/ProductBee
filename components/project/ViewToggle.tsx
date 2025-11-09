'use client'

import { LayoutGrid, Calendar } from 'lucide-react'

export type ViewType = 'gantt' | 'backlog'

interface ViewToggleProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
      <button
        onClick={() => onViewChange('gantt')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          currentView === 'gantt'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <Calendar className="w-4 h-4" />
        Gantt
      </button>
      <button
        onClick={() => onViewChange('backlog')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          currentView === 'backlog'
            ? 'bg-blue-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Backlog
      </button>
    </div>
  )
}

