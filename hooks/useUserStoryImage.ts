'use client'

import { useState, useEffect } from 'react'
import { getRandomMetMuseumImage } from '@/lib/met-museum'

const STORAGE_KEY = 'user_story_images'

// In-memory cache for quick access
const imageCache = new Map<string, string | null>()

// Load cache from localStorage on initialization
function loadCacheFromStorage(): Map<string, string | null> {
  if (typeof window === 'undefined') {
    return new Map()
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      const map = new Map<string, string | null>()
      Object.entries(data).forEach(([key, value]) => {
        map.set(key, value as string | null)
        imageCache.set(key, value as string | null)
      })
      return map
    }
  } catch (error) {
    console.error('[useUserStoryImage] Error loading cache from storage:', error)
  }
  return new Map()
}

// Save cache to localStorage
function saveCacheToStorage(id: string, imageUrl: string | null) {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const data = stored ? JSON.parse(stored) : {}
    data[id] = imageUrl
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('[useUserStoryImage] Error saving cache to storage:', error)
  }
}

// Initialize cache from localStorage
if (typeof window !== 'undefined') {
  loadCacheFromStorage()
}

/**
 * Hook to fetch and cache images for user stories
 * Uses the same Met Museum API approach as projects
 * Images are cached in memory and localStorage to persist across page reloads
 */
export function useUserStoryImage(userStoryId: string | undefined): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(() => {
    if (!userStoryId) return null
    // Check cache first
    return imageCache.get(userStoryId) || null
  })

  useEffect(() => {
    if (!userStoryId) {
      setImageUrl(null)
      return
    }

    // Check cache first (in-memory or localStorage)
    if (imageCache.has(userStoryId)) {
      const cached = imageCache.get(userStoryId)
      setImageUrl(cached || null)
      return
    }

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const data = JSON.parse(stored)
          if (data[userStoryId] !== undefined) {
            const cached = data[userStoryId]
            imageCache.set(userStoryId, cached)
            setImageUrl(cached)
            return
          }
        }
      } catch (error) {
        // Ignore storage errors
      }
    }

    // Fetch image from Met Museum API
    const fetchImage = async () => {
      try {
        const image = await getRandomMetMuseumImage()
        imageCache.set(userStoryId, image)
        saveCacheToStorage(userStoryId, image)
        setImageUrl(image)
      } catch (error) {
        console.error('[useUserStoryImage] Error fetching image:', error)
        imageCache.set(userStoryId, null)
        saveCacheToStorage(userStoryId, null)
        setImageUrl(null)
      }
    }

    fetchImage()
  }, [userStoryId])

  return imageUrl
}

/**
 * Hook to get images for multiple user stories at once
 * Useful for rendering grids of user stories
 */
export function useUserStoryImages(userStoryIds: string[]): Map<string, string | null> {
  const [images, setImages] = useState<Map<string, string | null>>(() => {
    const initialImages = new Map<string, string | null>()
    
    // Load from cache and localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const data = JSON.parse(stored)
          userStoryIds.forEach((id) => {
            if (data[id] !== undefined) {
              initialImages.set(id, data[id])
              imageCache.set(id, data[id])
            }
          })
        }
      } catch (error) {
        // Ignore storage errors
      }
    }

    userStoryIds.forEach((id) => {
      if (imageCache.has(id) && !initialImages.has(id)) {
        initialImages.set(id, imageCache.get(id) || null)
      }
    })

    return initialImages
  })

  useEffect(() => {
    const fetchImages = async () => {
      const newImages = new Map<string, string | null>(images)
      const idsToFetch: string[] = []

      // Check cache and localStorage for each ID
      userStoryIds.forEach((id) => {
        if (imageCache.has(id)) {
          newImages.set(id, imageCache.get(id) || null)
        } else if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
              const data = JSON.parse(stored)
              if (data[id] !== undefined) {
                const cached = data[id]
                imageCache.set(id, cached)
                newImages.set(id, cached)
                return
              }
            }
          } catch (error) {
            // Ignore storage errors
          }
          idsToFetch.push(id)
        } else {
          idsToFetch.push(id)
        }
      })

      // Fetch missing images
      if (idsToFetch.length > 0) {
        const fetchPromises = idsToFetch.map(async (id) => {
          try {
            const image = await getRandomMetMuseumImage()
            imageCache.set(id, image)
            saveCacheToStorage(id, image)
            newImages.set(id, image)
          } catch (error) {
            console.error(`[useUserStoryImages] Error fetching image for ${id}:`, error)
            imageCache.set(id, null)
            saveCacheToStorage(id, null)
            newImages.set(id, null)
          }
        })

        await Promise.all(fetchPromises)
      }
      
      setImages(newImages)
    }

    if (userStoryIds.length > 0) {
      fetchImages()
    }
  }, [userStoryIds.join(',')]) // Re-fetch if IDs change

  return images
}

