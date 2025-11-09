'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { GetUserProfileResponse, UpdateUserProfileRequest, UpdateUserProfileResponse, UserProfileResponse } from '@/types/api'

/**
 * Hook for fetching and updating user profile
 */
export function useUserProfile() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)

  /**
   * Fetch current user's profile
   */
  async function fetchProfile(): Promise<UserProfileResponse | null> {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile')
      const responseData = await response.json()

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch profile')
      }

      const data = responseData.data as GetUserProfileResponse
      setProfile(data.profile)
      return data.profile
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch profile')
      return null
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update current user's profile
   */
  async function updateProfile(updates: UpdateUserProfileRequest): Promise<UserProfileResponse | null> {
    setLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const responseData = await response.json()

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to update profile')
      }

      const data = responseData.data as UpdateUserProfileResponse
      setProfile(data.profile)
      toast.success('Profile updated successfully')
      return data.profile
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
  }
}

