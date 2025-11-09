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
        return 'bg-[#a855f7] bg-opacity-10 text-[#a855f7]'
      case ROLES.PM:
        return 'bg-blue-100 text-blue-800'
      case ROLES.ENGINEER:
        return 'bg-green-100 text-green-800'
      case ROLES.VIEWER:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper function to get specialization badge color
  const getSpecializationBadgeColor = (specialization: string | null | undefined) => {
    if (!specialization) return 'bg-gray-100 text-gray-600'
    
    switch (specialization) {
      case SPECIALIZATIONS.BACKEND:
        return 'bg-orange-100 text-orange-800'
      case SPECIALIZATIONS.FRONTEND:
        return 'bg-pink-100 text-pink-800'
      case SPECIALIZATIONS.QA:
        return 'bg-yellow-100 text-yellow-800'
      case SPECIALIZATIONS.DEVOPS:
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-card shadow-soft p-6">
        <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
          Team Members
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-[#d9d9d9] rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-card shadow-soft p-6">
        <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
          Team Members
        </h2>
        <div className="text-red-600">
          Error loading team members: {error}
        </div>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-soft p-6">
        <h2 className="text-xl font-semibold text-[#0d0d0d] mb-4">
          Team Members
        </h2>
        <p className="text-[#404040]">
          No team members found.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-card shadow-soft">
      <div className="p-6 border-b border-[#d9d9d9]">
        <h2 className="text-xl font-semibold text-[#0d0d0d]">
          Team Members
        </h2>
        <p className="text-sm text-[#404040] mt-1">
          {members.length} {members.length === 1 ? 'member' : 'members'} in your account
        </p>
      </div>

      <div className="divide-y divide-[#d9d9d9]">
        {members.map((member: TeamMemberResponse) => (
          <div key={member.id} className="p-6 hover:bg-[#f5f5f5] transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-[#0d0d0d]">
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
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      🏖️ On Vacation
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#404040] mb-3">
                  {member.email}
                </p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-[#404040]">Tickets: </span>
                    <span className="font-semibold text-[#0d0d0d]">
                      {member.currentTicketCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#404040]">Story Points: </span>
                    <span className="font-semibold text-[#0d0d0d]">
                      {member.currentStoryPointCount}
                    </span>
                  </div>
                  {member.vacationDates && member.vacationDates.length > 0 && (
                    <div>
                      <span className="text-[#404040]">Vacation Dates: </span>
                      <span className="text-[#404040]">
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

