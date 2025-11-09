import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession } from '@/lib/api/permissions'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { getProjectImage } from '@/lib/met-api'

/**
 * POST /api/projects/update-images
 * Retroactively adds images to all existing projects that don't have one
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      throw APIErrors.unauthorized()
    }

    const user = await getUserFromSession(session)
    const supabase = createServerClient()

    // Get all projects for this account that don't have an image
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, roadmap')
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      throw projectsError
    }

    if (!projects || projects.length === 0) {
      return successResponse({ 
        message: 'No projects found',
        updated: 0,
        total: 0
      })
    }

    // Filter projects that don't have an image
    const projectsWithoutImages = projects.filter(
      (project) => !project.roadmap?.imageUrl
    )

    if (projectsWithoutImages.length === 0) {
      return successResponse({
        message: 'All projects already have images',
        updated: 0,
        total: projects.length
      })
    }

    console.log(`[Update Images] Found ${projectsWithoutImages.length} projects without images`)

    // Get all existing image URLs to avoid duplicates
    const existingImageUrls = projects
      .map((p) => p.roadmap?.imageUrl)
      .filter((url): url is string => Boolean(url))
    
    console.log(`[Update Images] Found ${existingImageUrls.length} existing images to exclude`)

    // Update each project with an image
    let updatedCount = 0
    const errors: string[] = []
    const usedImageUrls = new Set<string>(existingImageUrls)

    for (const project of projectsWithoutImages) {
      try {
        // Fetch image from Met Museum API, excluding all used images
        const imageUrl = await getProjectImage(Array.from(usedImageUrls))
        
        if (imageUrl) {
          // Mark this image as used
          usedImageUrls.add(imageUrl)
          
          // Update the project's roadmap JSONB with the image URL
          const updatedRoadmap = {
            ...project.roadmap,
            imageUrl: imageUrl,
          }

          const { error: updateError } = await supabase
            .from('projects')
            .update({ roadmap: updatedRoadmap })
            .eq('id', project.id)

          if (updateError) {
            console.error(`[Update Images] Error updating project ${project.id}:`, updateError)
            errors.push(`Project ${project.id}: ${updateError.message}`)
            // Remove from used set if update failed
            usedImageUrls.delete(imageUrl)
          } else {
            updatedCount++
            console.log(`[Update Images] Updated project ${project.id} with image`)
          }
        } else {
          console.warn(`[Update Images] No image found for project ${project.id}`)
          errors.push(`Project ${project.id}: No image available from Met API`)
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error: any) {
        console.error(`[Update Images] Error processing project ${project.id}:`, error)
        errors.push(`Project ${project.id}: ${error.message || 'Unknown error'}`)
      }
    }

    return successResponse({
      message: `Updated ${updatedCount} out of ${projectsWithoutImages.length} projects`,
      updated: updatedCount,
      total: projects.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    return handleError(error)
  }
}

