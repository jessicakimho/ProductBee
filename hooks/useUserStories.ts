'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type {
  UserStoryResponse,
  CreateUserStoryRequest,
  UpdateUserStoryRequest,
  GetUserStoriesResponse,
  AssignUserStoryToTicketRequest,
  UnassignUserStoryFromTicketRequest,
  TicketAlignmentResponse,
  CheckTicketAlignmentRequest,
} from '@/types'

interface UseUserStoriesReturn {
  userStories: UserStoryResponse[]
  isLoading: boolean
  error: string | null
  fetchUserStories: (projectId: string) => Promise<void>
  createUserStory: (data: CreateUserStoryRequest) => Promise<UserStoryResponse | null>
  updateUserStory: (userStoryId: string, data: UpdateUserStoryRequest) => Promise<UserStoryResponse | null>
  deleteUserStory: (userStoryId: string) => Promise<boolean>
  assignUserStoryToTicket: (ticketId: string, userStoryId: string) => Promise<boolean>
  unassignUserStoryFromTicket: (ticketId: string, userStoryId: string) => Promise<boolean>
  checkTicketAlignment: (projectId: string, ticketId: string) => Promise<TicketAlignmentResponse | null>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isAssigning: boolean
  isCheckingAlignment: boolean
}

const MAX_CACHED_STORIES = 50

// Local cache for user stories (last 50 per project)
const userStoriesCache = new Map<string, { stories: UserStoryResponse[]; timestamp: number }>()

export function useUserStories(): UseUserStoriesReturn {
  const [userStories, setUserStories] = useState<UserStoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isCheckingAlignment, setIsCheckingAlignment] = useState(false)

  // Load from cache if available
  const loadFromCache = useCallback((projectId: string): UserStoryResponse[] | null => {
    const cached = userStoriesCache.get(projectId)
    if (cached) {
      // Cache is valid (no expiration for now, but we can add it later)
      return cached.stories
    }
    return null
  }, [])

  // Save to cache
  const saveToCache = useCallback((projectId: string, stories: UserStoryResponse[]) => {
    // Limit to last 50 stories
    const limitedStories = stories.slice(0, MAX_CACHED_STORIES)
    userStoriesCache.set(projectId, {
      stories: limitedStories,
      timestamp: Date.now(),
    })
  }, [])

  // Clear cache for a project
  const clearCache = useCallback((projectId: string) => {
    userStoriesCache.delete(projectId)
  }, [])

  const fetchUserStories = useCallback(
    async (projectId: string) => {
      try {
        setIsLoading(true)
        setError(null)

        // Try cache first
        const cached = loadFromCache(projectId)
        if (cached) {
          setUserStories(cached)
          setIsLoading(false)
          // Still fetch in background to update cache
          fetch(`/api/user-story/project/${projectId}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.data?.userStories) {
                setUserStories(data.data.userStories)
                saveToCache(projectId, data.data.userStories)
              }
            })
            .catch(() => {
              // Silently fail background fetch
            })
          return
        }

        const response = await fetch(`/api/user-story/project/${projectId}`)
        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || 'Failed to fetch user stories')
        }

        const stories = responseData.data?.userStories || []
        setUserStories(stories)
        saveToCache(projectId, stories)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch user stories'
        setError(message)
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    },
    [loadFromCache, saveToCache]
  )

  const createUserStory = useCallback(
    async (data: CreateUserStoryRequest): Promise<UserStoryResponse | null> => {
      try {
        setIsCreating(true)
        setError(null)

        const response = await fetch('/api/user-story', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          if (response.status === 403) {
            throw new Error('Only PMs and Admins can create user stories')
          }
          throw new Error(responseData.error || 'Failed to create user story')
        }

        const newUserStory = responseData.data?.userStory
        if (newUserStory) {
          // Update local state
          setUserStories((prev) => [newUserStory, ...prev])
          // Update cache
          const cached = userStoriesCache.get(data.projectId)
          if (cached) {
            saveToCache(data.projectId, [newUserStory, ...cached.stories])
          }
          toast.success('User story created successfully')
        }

        return newUserStory || null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create user story'
        setError(message)
        toast.error(message)
        return null
      } finally {
        setIsCreating(false)
      }
    },
    [saveToCache]
  )

  const updateUserStory = useCallback(
    async (userStoryId: string, data: UpdateUserStoryRequest): Promise<UserStoryResponse | null> => {
      try {
        setIsUpdating(true)
        setError(null)

        const response = await fetch(`/api/user-story/${userStoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          if (response.status === 403) {
            throw new Error('Only PMs and Admins can update user stories')
          }
          throw new Error(responseData.error || 'Failed to update user story')
        }

        const updatedUserStory = responseData.data?.userStory
        if (updatedUserStory) {
          // Update local state
          setUserStories((prev) =>
            prev.map((story) => (story.id === userStoryId || story._id === userStoryId ? updatedUserStory : story))
          )
          // Update cache (find project ID from updated story)
          if (updatedUserStory.projectId) {
            const cached = userStoriesCache.get(updatedUserStory.projectId)
            if (cached) {
              const updatedStories = cached.stories.map((story) =>
                story.id === userStoryId || story._id === userStoryId ? updatedUserStory : story
              )
              saveToCache(updatedUserStory.projectId, updatedStories)
            }
          }
          toast.success('User story updated successfully')
        }

        return updatedUserStory || null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user story'
        setError(message)
        toast.error(message)
        return null
      } finally {
        setIsUpdating(false)
      }
    },
    [saveToCache]
  )

  const deleteUserStory = useCallback(
    async (userStoryId: string): Promise<boolean> => {
      try {
        setIsDeleting(true)
        setError(null)

        // Find the user story to get projectId for cache update
        const userStory = userStories.find((s) => s.id === userStoryId || s._id === userStoryId)
        const projectId = userStory?.projectId

        const response = await fetch(`/api/user-story/${userStoryId}`, {
          method: 'DELETE',
        })

        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          if (response.status === 403) {
            throw new Error('Only PMs and Admins can delete user stories')
          }
          throw new Error(responseData.error || 'Failed to delete user story')
        }

        // Update local state
        setUserStories((prev) => prev.filter((story) => story.id !== userStoryId && story._id !== userStoryId))
        // Update cache
        if (projectId) {
          const cached = userStoriesCache.get(projectId)
          if (cached) {
            const updatedStories = cached.stories.filter(
              (story) => story.id !== userStoryId && story._id !== userStoryId
            )
            saveToCache(projectId, updatedStories)
          }
        }

        toast.success('User story deleted successfully')
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete user story'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsDeleting(false)
      }
    },
    [userStories, saveToCache]
  )

  const assignUserStoryToTicket = useCallback(
    async (ticketId: string, userStoryId: string): Promise<boolean> => {
      try {
        setIsAssigning(true)
        setError(null)

        const request: AssignUserStoryToTicketRequest = { userStoryId }

        const response = await fetch(`/api/feature/${ticketId}/assign-user-story`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          if (response.status === 403) {
            throw new Error('Only PMs and Admins can link user stories to tickets')
          }
          throw new Error(responseData.error || 'Failed to link user story to ticket')
        }

        // Update local state - add ticket ID to user story's linkedTicketIds
        setUserStories((prev) =>
          prev.map((story) => {
            if (story.id === userStoryId || story._id === userStoryId) {
              const linkedIds = story.linkedTicketIds || []
              if (!linkedIds.includes(ticketId)) {
                return { ...story, linkedTicketIds: [...linkedIds, ticketId] }
              }
            }
            return story
          })
        )

        toast.success('User story linked to ticket successfully')
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to link user story to ticket'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsAssigning(false)
      }
    },
    []
  )

  const unassignUserStoryFromTicket = useCallback(
    async (ticketId: string, userStoryId: string): Promise<boolean> => {
      try {
        setIsAssigning(true)
        setError(null)

        const request: UnassignUserStoryFromTicketRequest = { userStoryId }

        const response = await fetch(`/api/feature/${ticketId}/assign-user-story`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          if (response.status === 403) {
            throw new Error('Only PMs and Admins can unlink user stories from tickets')
          }
          throw new Error(responseData.error || 'Failed to unlink user story from ticket')
        }

        // Update local state - remove ticket ID from user story's linkedTicketIds
        setUserStories((prev) =>
          prev.map((story) => {
            if (story.id === userStoryId || story._id === userStoryId) {
              const linkedIds = story.linkedTicketIds || []
              return { ...story, linkedTicketIds: linkedIds.filter((id) => id !== ticketId) }
            }
            return story
          })
        )

        toast.success('User story unlinked from ticket successfully')
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to unlink user story from ticket'
        setError(message)
        toast.error(message)
        return false
      } finally {
        setIsAssigning(false)
      }
    },
    []
  )

  const checkTicketAlignment = useCallback(
    async (projectId: string, ticketId: string): Promise<TicketAlignmentResponse | null> => {
      try {
        setIsCheckingAlignment(true)
        setError(null)

        const request: CheckTicketAlignmentRequest = { projectId, ticketId }

        const response = await fetch(`/api/feature/${ticketId}/check-alignment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        const responseData = await response.json()

        if (!response.ok || !responseData.success) {
          throw new Error(responseData.error || 'Failed to check ticket alignment')
        }

        return responseData.data || null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check ticket alignment'
        setError(message)
        toast.error(message)
        return null
      } finally {
        setIsCheckingAlignment(false)
      }
    },
    []
  )

  return {
    userStories,
    isLoading,
    error,
    fetchUserStories,
    createUserStory,
    updateUserStory,
    deleteUserStory,
    assignUserStoryToTicket,
    unassignUserStoryFromTicket,
    checkTicketAlignment,
    isCreating,
    isUpdating,
    isDeleting,
    isAssigning,
    isCheckingAlignment,
  }
}

