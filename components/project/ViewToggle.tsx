'use client'

import { LayoutGrid, Calendar, Users } from 'lucide-react'

export type ViewType = 'gantt' | 'backlog' | 'user-stories'

interface ViewToggleProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="inline-flex rounded-full border border-[#d9d9d9] bg-white p-1 shadow-soft">
      <button
        onClick={() => onViewChange('backlog')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          currentView === 'backlog'
            ? 'bg-[#a855f7] text-white'
            : 'text-[#404040] hover:bg-[#f5f5f5]'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Backlog
      </button>
      <button
        onClick={() => onViewChange('gantt')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          currentView === 'gantt'
            ? 'bg-[#a855f7] text-white'
            : 'text-[#404040] hover:bg-[#f5f5f5]'
        }`}
      >
        <Calendar className="w-4 h-4" />
        Gantt
      </button>
      <button
        onClick={() => onViewChange('user-stories')}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          currentView === 'user-stories'
            ? 'bg-[#a855f7] text-white'
            : 'text-[#404040] hover:bg-[#f5f5f5]'
        }`}
      >
        <Users className="w-4 h-4" />
        User Stories
      </button>
    </div>
  )
}

