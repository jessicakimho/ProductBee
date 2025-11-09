'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { FeatureResponse, UpdateFeatureRequest, CreateFeatureRequest } from '@/types'

export function useFeature() {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const updateFeature = useCallback(async (
    featureId: string,
    updates: UpdateFeatureRequest
  ): Promise<FeatureResponse | null> => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/feature/${featureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        // Check for permission errors
        if (response.status === 403 || responseData.error?.includes('Access denied')) {
          throw new Error('You do not have permission to update this feature. Viewers have read-only access.')
        }
        if (response.status === 404) {
          throw new Error('Feature not found or you do not have access to it.')
        }
        throw new Error(responseData.error || 'Failed to update feature')
      }

      // Handle wrapped response: { success: true, data: { feature: {...} } }
      const data = responseData.data
      toast.success('Feature updated successfully')
      return data.feature
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update feature'
      toast.error(message)
      console.error('Error updating feature:', error)
      return null
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const updateFeatureStatus = useCallback(async (
    featureId: string,
    status: FeatureResponse['status']
  ): Promise<FeatureResponse | null> => {
    return updateFeature(featureId, { status })
  }, [updateFeature])

  const updateFeaturePriority = useCallback(async (
    featureId: string,
    priority: FeatureResponse['priority']
  ): Promise<FeatureResponse | null> => {
    return updateFeature(featureId, { priority })
  }, [updateFeature])

  const createFeature = useCallback(async (
    featureData: CreateFeatureRequest
  ): Promise<FeatureResponse | null> => {
    try {
      setIsCreating(true)
      const response = await fetch('/api/feature/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(featureData),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        // Check for permission errors
        if (response.status === 403 || responseData.error?.includes('Access denied')) {
          throw new Error('You do not have permission to create features. Viewers have read-only access.')
        }
        if (response.status === 404) {
          throw new Error('Project not found or you do not have access to it.')
        }
        throw new Error(responseData.error || 'Failed to create feature')
      }

      // Handle wrapped response: { success: true, data: { feature: {...} } }
      const data = responseData.data
      toast.success('Feature created successfully')
      return data.feature
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create feature'
      toast.error(message)
      console.error('Error creating feature:', error)
      return null
    } finally {
      setIsCreating(false)
    }
  }, [])

  return {
    updateFeature,
    updateFeatureStatus,
    updateFeaturePriority,
    createFeature,
    isUpdating,
    isCreating,
  }
}

