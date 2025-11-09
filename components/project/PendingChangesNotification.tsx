'use client'

import { Bell } from 'lucide-react'

interface PendingChangesNotificationProps {
  count: number
  onClick: () => void
}

export default function PendingChangesNotification({
  count,
  onClick,
}: PendingChangesNotificationProps) {
  if (count === 0) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#404040] bg-white border border-[#d9d9d9] rounded-full hover:bg-[#f5f5f5] transition-colors shadow-soft"
      title={`${count} pending status change${count !== 1 ? 's' : ''}`}
    >
      <Bell className="w-4 h-4" />
      <span>Pending Changes</span>
      <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-600 rounded-full">
        {count > 99 ? '99+' : count}
      </span>
    </button>
  )
}

