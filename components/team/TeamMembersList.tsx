'use client'

import { useTeamMembers } from '@/hooks/useTeamMembers'
import { ROLES, SPECIALIZATIONS } from '@/lib/constants'
import type { TeamMemberResponse } from '@/types/api'

/**
 * TeamMembersList - Client component to display team members with roles, specializations, and workload
 * Shows all team members in the current account with their roles, specializations, workload metrics, and vacation status
 */
export default function TeamMembersList() {
  const { members, loading, error } = useTeamMembers()

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case ROLES.PM:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case ROLES.ENGINEER:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case ROLES.VIEWER:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Helper function to get specialization badge color
  const getSpecializationBadgeColor = (specialization: string | null | undefined) => {
    if (!specialization) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    
    switch (specialization) {
      case SPECIALIZATIONS.BACKEND:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case SPECIALIZATIONS.FRONTEND:
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
      case SPECIALIZATIONS.QA:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case SPECIALIZATIONS.DEVOPS:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Members
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Members
        </h2>
        <div className="text-red-600 dark:text-red-400">
          Error loading team members: {error}
        </div>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Team Members
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No team members found.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Team Members
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {members.length} {members.length === 1 ? 'member' : 'members'} in your account
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((member: TeamMemberResponse) => (
          <div key={member.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                      member.role
                    )}`}
                  >
                    {member.role.toUpperCase()}
                  </span>
                  {member.specialization && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getSpecializationBadgeColor(
                        member.specialization
                      )}`}
                    >
                      {member.specialization}
                    </span>
                  )}
                  {member.isOnVacation && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                      🏖️ On Vacation
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {member.email}
                </p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tickets: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {member.currentTicketCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Story Points: </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {member.currentStoryPointCount}
                    </span>
                  </div>
                  {member.vacationDates && member.vacationDates.length > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Vacation Dates: </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {member.vacationDates.length} {member.vacationDates.length === 1 ? 'period' : 'periods'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

