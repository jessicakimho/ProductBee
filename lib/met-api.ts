/**
 * Metropolitan Museum of Art API Integration
 * Public API: https://metmuseum.github.io/
 */

const MET_API_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1'

interface MetObject {
  objectID: number
  title: string
  primaryImage: string
  primaryImageSmall: string
  objectDate: string
  culture: string
  period: string
  dynasty: string
  reign: string
  portfolio: string
  artistRole: string
  artistPrefix: string
  artistDisplayName: string
  artistDisplayBio: string
  artistSuffix: string
  artistAlphaSort: string
  artistNationality: string
  artistBeginDate: string
  artistEndDate: string
  artistGender: string
  artistWikidata_URL: string
  artistULAN_URL: string
  objectName: string
  objectBeginDate: number
  objectEndDate: number
  medium: string
  dimensions: string
  measurements: Array<{
    elementName: string
    elementDescription: string
    elementMeasurements: {
      Height: number
      Width: number
    }
  }>
  creditLine: string
  geographyType: string
  city: string
  state: string
  county: string
  country: string
  region: string
  subregion: string
  locale: string
  locus: string
  excavation: string
  river: string
  classification: string
  rightsAndReproduction: string
  linkResource: string
  metadataDate: string
  repository: string
  objectURL: string
  tags: Array<{
    term: string
    AAT_URL: string
    Wikidata_URL: string
  }>
  objectWikidata_URL: string
  isTimelineWork: boolean
  GalleryNumber: string
}

interface MetSearchResponse {
  total: number
  objectIDs: number[]
}

/**
 * Search the Met Museum collection
 */
export async function searchMetCollection(query: string): Promise<number[]> {
  try {
    // Met Museum API search endpoint
    const searchUrl = `${MET_API_BASE}/search?q=${encodeURIComponent(query)}&hasImages=true`
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      console.error(`Met API search failed: ${response.status} ${response.statusText}`)
      return []
    }
    
    const data: MetSearchResponse = await response.json()
    if (data.objectIDs && data.objectIDs.length > 0) {
      return data.objectIDs.slice(0, 50) // Limit to 50 results
    }
    
    return []
  } catch (error) {
    console.error('Error searching Met collection:', error)
    return []
  }
}

/**
 * Get object details from Met Museum API
 */
export async function getMetObject(objectID: number): Promise<MetObject | null> {
  try {
    const response = await fetch(`${MET_API_BASE}/objects/${objectID}`)
    if (!response.ok) {
      return null
    }
    const data: MetObject = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching Met object ${objectID}:`, error)
    return null
  }
}

/**
 * Fisher-Yates shuffle algorithm for truly random array shuffling
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Get a random image from Met Museum based on search terms
 * Excludes images that are already in use
 * Returns the image URL or null if no image found
 */
export async function getRandomMetImage(
  searchTerms: string[],
  excludeUrls: string[] = []
): Promise<string | null> {
  try {
    // Collect all potential images from all search terms
    const allPotentialImages: string[] = []
    const processedObjectIDs = new Set<number>()

    // Try each search term and collect images
    for (const term of searchTerms) {
      const objectIDs = await searchMetCollection(term)
      
      if (objectIDs.length > 0) {
        // Shuffle for randomness
        const shuffled = shuffleArray(objectIDs)
        
        // Try up to 20 objects per search term to get more variety
        for (const objectID of shuffled.slice(0, 20)) {
          // Skip if we've already processed this object
          if (processedObjectIDs.has(objectID)) {
            continue
          }
          processedObjectIDs.add(objectID)

          const object = await getMetObject(objectID)
          if (object && object.primaryImage) {
            // Only add if not in exclude list
            if (!excludeUrls.includes(object.primaryImage)) {
              allPotentialImages.push(object.primaryImage)
            }
          }
        }
      }
    }

    // If we have potential images, return a random one
    if (allPotentialImages.length > 0) {
      const shuffled = shuffleArray(allPotentialImages)
      return shuffled[0]
    }

    return null
  } catch (error) {
    console.error('Error getting Met image:', error)
    return null
  }
}

/**
 * Get a project image from Met Museum API
 * Searches for "woodblock print", "van gogh", or "impressionist"
 * Excludes images that are already in use
 */
export async function getProjectImage(excludeUrls: string[] = []): Promise<string | null> {
  const searchTerms = ['woodblock print', 'van gogh', 'impressionist']
  return getRandomMetImage(searchTerms, excludeUrls)
}

