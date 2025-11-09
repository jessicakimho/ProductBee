'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type { GetTeamMembersResponse, TeamMemberResponse } from '@/types/api'

/**
 * Hook for fetching team members
 */
export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMemberResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch all team members
   */
  async function fetchTeamMembers(): Promise<TeamMemberResponse[]> {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/team/members')
      const responseData = await response.json()

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch team members')
      }

      const data = responseData.data as GetTeamMembersResponse
      setMembers(data.members)
      return data.members
    } catch (error) {
      console.error('Error fetching team members:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team members'
      setError(errorMessage)
      toast.error(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Fetch team members on mount
  useEffect(() => {
    fetchTeamMembers()
  }, [])

  return {
    members,
    loading,
    error,
    refetch: fetchTeamMembers,
  }
}

