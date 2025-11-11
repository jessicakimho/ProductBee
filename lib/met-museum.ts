/**
 * Metropolitan Museum of Art API utility
 * Fetches random images from the Met Museum collection
 */

const MET_MUSEUM_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1'

/**
 * Fetch a random object from the Met Museum collection
 */
async function fetchRandomObject(): Promise<any> {
  try {
    // Try to get objects with images by searching for common terms
    // The Met Museum API doesn't support wildcard search, so we'll use a common search term
    const searchTerms = ['painting', 'sculpture', 'art', 'portrait', 'landscape', 'abstract']
    const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]
    
    const searchResponse = await fetch(
      `${MET_MUSEUM_API_BASE}/search?hasImages=true&q=${encodeURIComponent(randomTerm)}`
    )
    
    if (!searchResponse.ok) {
      throw new Error(`Met Museum API search failed: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    
    if (!searchData.objectIDs || searchData.objectIDs.length === 0) {
      // If search returns no results, try a different approach
      // Use a known object ID range (Met Museum has objects from 1 to ~500000)
      // Try random IDs in a known range that often have images
      const randomId = Math.floor(Math.random() * 100000) + 1
      const objectResponse = await fetch(
        `${MET_MUSEUM_API_BASE}/objects/${randomId}`
      )
      
      if (!objectResponse.ok) {
        throw new Error(`Met Museum API object fetch failed: ${objectResponse.status}`)
      }
      
      const objectData = await objectResponse.json()
      return objectData
    }
    
    // Get a random object ID from search results
    const randomIndex = Math.floor(Math.random() * Math.min(searchData.objectIDs.length, 100))
    const objectId = searchData.objectIDs[randomIndex]
    
    // Fetch the object details
    const objectResponse = await fetch(
      `${MET_MUSEUM_API_BASE}/objects/${objectId}`
    )
    
    if (!objectResponse.ok) {
      throw new Error(`Met Museum API object fetch failed: ${objectResponse.status}`)
    }
    
    const objectData = await objectResponse.json()
    
    return objectData
  } catch (error) {
    console.error('[Met Museum] Error fetching random object:', error)
    throw error
  }
}

/**
 * Get a random image URL from the Met Museum collection
 * Returns the primary image URL or null if no image is available
 */
export async function getRandomMetMuseumImage(): Promise<string | null> {
  // Try multiple times to get an image (max 5 attempts)
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const object = await fetchRandomObject()
      
      // Check if the object has a primary image
      if (object.primaryImage && object.primaryImage.length > 0) {
        return object.primaryImage
      }
      
      // If no primary image, try to get the first available image
      if (object.additionalImages && object.additionalImages.length > 0) {
        return object.additionalImages[0]
      }
      
      // If object exists but has no images, try again
      const objectId = object.objectID || 'unknown'
      console.log(`[Met Museum] Attempt ${attempt + 1}: Object ${objectId} has no images, retrying...`)
    } catch (error) {
      console.warn(`[Met Museum] Attempt ${attempt + 1} failed:`, error)
      // Continue to next attempt
    }
  }
  
  console.warn('[Met Museum] Failed to fetch image after 5 attempts')
  return null
}

/**
 * Get a random image URL with fallback
 * If Met Museum API fails, returns null (gradient will be used instead)
 */
export async function getProjectImage(): Promise<string | null> {
  try {
    const imageUrl = await getRandomMetMuseumImage()
    if (imageUrl) {
      console.log('[Met Museum] Successfully fetched image:', imageUrl)
    } else {
      console.warn('[Met Museum] No image available, will use gradient')
    }
    return imageUrl
  } catch (error) {
    console.error('[Met Museum] Error in getProjectImage:', error)
    return null
  }
}

