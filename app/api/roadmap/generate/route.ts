import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { generateRoadmap } from '@/lib/gemini'
import { getUserFromSession } from '@/lib/api/permissions'
import { validateRequired, validateJsonBody, priorityToApi, statusToApi } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { HTTP_STATUS, DB_FEATURE_STATUS } from '@/lib/constants'
import { getProjectImage } from '@/lib/met-museum'
import type { GenerateRoadmapRequest, GenerateRoadmapResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    console.log('[Roadmap Generate] Starting roadmap generation')
    
    const session = await getSession()
    if (!session) {
      console.error('[Roadmap Generate] No session found')
      throw APIErrors.unauthorized()
    }
    
    console.log('[Roadmap Generate] Session found, getting user')
    const user = await getUserFromSession(session)
    console.log('[Roadmap Generate] User:', user.id, user.email)

    const body = await validateJsonBody<GenerateRoadmapRequest>(request)
    validateRequired(body, ['projectName', 'projectDescription'])

    const { projectName, projectDescription } = body
    console.log('[Roadmap Generate] Project name:', projectName)
    console.log('[Roadmap Generate] Project description length:', projectDescription.length)
    
    const supabase = createServerClient()

    // Generate roadmap using Gemini
    console.log('[Roadmap Generate] Calling generateRoadmap')
    const roadmapData = await generateRoadmap(projectName, projectDescription)
    console.log('[Roadmap Generate] Roadmap generated successfully')
    console.log('[Roadmap Generate] Roadmap data:', {
      summary: roadmapData?.summary?.substring(0, 100),
      riskLevel: roadmapData?.riskLevel,
      featuresCount: roadmapData?.features?.length,
    })

    // Validate roadmap data
    if (!roadmapData || !roadmapData.summary || !roadmapData.features) {
      throw APIErrors.internalError('Invalid roadmap data received from AI')
    }

    // Fetch a random image from Met Museum API
    console.log('[Roadmap Generate] Fetching project image from Met Museum')
    let imageUrl: string | null = null
    try {
      imageUrl = await getProjectImage()
      if (imageUrl) {
        console.log('[Roadmap Generate] Successfully fetched image:', imageUrl)
      } else {
        console.log('[Roadmap Generate] No image fetched, will use gradient')
      }
    } catch (imageError) {
      console.error('[Roadmap Generate] Error fetching image (will use gradient):', imageError)
      // Don't fail the request if image fetch fails, just use gradient
    }

    // Create project with account_id for account isolation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        description: projectDescription,
        created_by: user.id,
        account_id: user.account_id,
        team_id: user.id, // Simplified teamId
        roadmap: {
          summary: roadmapData.summary,
          riskLevel: roadmapData.riskLevel || 'medium',
          imageUrl: imageUrl || undefined, // Only include if we have an image
        },
      })
      .select()
      .single()

    if (projectError || !project) {
      throw APIErrors.internalError('Failed to create project')
    }

    // Create features (first pass - without dependencies)
    interface FeatureToCreate {
      project_id: string
      title: string
      description: string
      priority: string
      effort_estimate_weeks: number
      depends_on: string[]
      status: string
      original_index: number
      original_depends_on: number[]
    }

    const featuresToCreate: FeatureToCreate[] = roadmapData.features.map((feature: any, index: number) => ({
      project_id: project.id,
      account_id: user.account_id,
      title: feature.title,
      description: feature.description,
      priority: feature.priority,
      effort_estimate_weeks: feature.effortEstimateWeeks || 1,
      depends_on: [], // Will update after all features are created
      status: DB_FEATURE_STATUS.BACKLOG, // DB format using constant
      original_index: index, // Store original index for dependency resolution
      original_depends_on: feature.dependsOn || [], // Store dependency indices
      // Jira-style fields (Phase 6)
      ticket_type: feature.ticketType || 'feature',
      story_points: feature.storyPoints ?? null,
      labels: feature.labels || [],
      acceptance_criteria: feature.acceptanceCriteria || null,
      assigned_to: null, // Not assigned during roadmap generation
      reporter: user.id, // Set reporter to the user creating the roadmap
    }))

    const { data: createdFeatures, error: featuresError } = await supabase
      .from('features')
      .insert(featuresToCreate.map(({ original_index, original_depends_on, ...feature }) => feature))
      .select()

    if (featuresError || !createdFeatures) {
      console.error('[Roadmap Generate] Features creation error:', featuresError)
      console.error('[Roadmap Generate] Features to create:', featuresToCreate.map(({ original_index, original_depends_on, ...f }) => f))
      throw APIErrors.internalError(`Failed to create features: ${featuresError?.message || 'Unknown error'}`)
    }

    // Update features with dependencies
    const updatePromises = createdFeatures.map((feature, index) => {
      const originalFeature = featuresToCreate[index]
      if (originalFeature.original_depends_on && originalFeature.original_depends_on.length > 0) {
        const dependencyIds = originalFeature.original_depends_on
          .map((depIndex: number) => createdFeatures[depIndex]?.id)
          .filter(Boolean) as string[]

        if (dependencyIds.length > 0) {
          return supabase
            .from('features')
            .update({ depends_on: dependencyIds })
            .eq('id', feature.id)
        }
      }
      return Promise.resolve({ data: null, error: null })
    })

    await Promise.all(updatePromises)

    // Format response (convert DB format to API format using constants)
    const formattedFeatures = createdFeatures.map((feature) => ({
      _id: feature.id,
      id: feature.id,
      projectId: feature.project_id,
      title: feature.title,
      description: feature.description,
      priority: priorityToApi(feature.priority), // Convert DB -> API using constants
      effortEstimateWeeks: feature.effort_estimate_weeks,
      dependsOn: feature.depends_on || [],
      status: statusToApi(feature.status), // Convert DB -> API using constants
      createdAt: feature.created_at,
      // Jira-style fields (Phase 6)
      assignedTo: feature.assigned_to || null,
      reporter: feature.reporter || null,
      storyPoints: feature.story_points ?? null,
      labels: feature.labels || [],
      acceptanceCriteria: feature.acceptance_criteria || null,
      ticketType: feature.ticket_type || 'feature',
    }))

    const response: GenerateRoadmapResponse = {
      project: {
        id: project.id,
        _id: project.id,
        name: project.name,
        description: project.description,
        roadmap: project.roadmap,
        created_by: project.created_by,
        team_id: project.team_id,
        createdAt: project.created_at,
      },
      features: formattedFeatures,
    }

    return successResponse(response, HTTP_STATUS.CREATED)
  } catch (error: any) {
    console.error('[Roadmap Generate] Caught error:', error)
    console.error('[Roadmap Generate] Error stack:', error?.stack)
    console.error('[Roadmap Generate] Error name:', error?.name)
    console.error('[Roadmap Generate] Error message:', error?.message)
    
    // If it's already an APIError, handle it normally
    if (error?.name === 'APIError' || error?.statusCode) {
      return handleError(error)
    }
    
    // Otherwise, wrap it in an APIError
    return handleError(APIErrors.internalError(error?.message || 'Unknown error occurred'))
  }
}

