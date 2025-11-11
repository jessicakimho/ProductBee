import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, priorityToApi, statusToApi, feedbackTypeToApi } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { calculateTimeline } from '@/lib/api/timeline'
import type { GetProjectResponse } from '@/types/api'
import type { Feature } from '@/models/Feature'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const projectId = params.id
    validateUUID(projectId, 'Project ID')

    const supabase = createServerClient()

    // Check project access
    await requireProjectAccess(user, projectId)

    // Get project with creator info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        created_by:users!projects_created_by_fkey (
          name,
          email
        )
      `)
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      throw APIErrors.notFound('Project')
    }

    // Get features for this project - filtered by account_id for account isolation
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', projectId)
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: true })

    if (featuresError) {
      throw APIErrors.internalError('Failed to fetch features')
    }

    // Get feedback for this project - filtered by account_id for account isolation
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('project_id', projectId)
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: false })

    if (feedbackError) {
      throw APIErrors.internalError('Failed to fetch feedback')
    }

    // Get unique user IDs from feedback
    const userIds = [...new Set(feedback?.map((fb: any) => fb.user_id).filter(Boolean) || [])]
    
    // Fetch user data for all feedback creators
    let users: any[] = []
    if (userIds.length > 0) {
      const { data: userData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)
        .eq('account_id', user.account_id)
      
      if (!usersError && userData) {
        users = userData
      }
    }

    // Create a map of user IDs to user data
    const userMap = new Map(
      (users || []).map((u: any) => [u.id, { _id: u.id, name: u.name, email: u.email }])
    )

    // Group feedback by feature (convert DB format to API format using constants)
    const feedbackByFeature: Record<string, any[]> = {}
    feedback?.forEach((fb: any) => {
      const featureId = fb.feature_id
      if (!feedbackByFeature[featureId]) {
        feedbackByFeature[featureId] = []
      }
      feedbackByFeature[featureId].push({
        _id: fb.id,
        id: fb.id,
        projectId: fb.project_id,
        featureId: fb.feature_id,
        userId: fb.user_id ? (userMap.get(fb.user_id) || null) : null,
        type: feedbackTypeToApi(fb.type), // Convert DB -> API using constants
        content: fb.content,
        proposedRoadmap: fb.proposed_roadmap,
        aiAnalysis: fb.ai_analysis,
        status: fb.status,
        createdAt: fb.created_at,
      })
    })

    // Format project data
    const formattedProject = {
      _id: project.id,
      id: project.id,
      name: project.name,
      description: project.description,
      roadmap: project.roadmap,
      createdAt: project.created_at,
      createdBy: project.created_by ? {
        _id: project.created_by.id,
        name: project.created_by.name,
        email: project.created_by.email,
      } : null,
    }

    // Convert database features to Feature model format (using constants)
    const featureModels: Feature[] = (features || []).map((feature) => ({
      id: feature.id,
      created_at: feature.created_at,
      updated_at: feature.updated_at || undefined,
      project_id: feature.project_id,
      account_id: feature.account_id,
      title: feature.title,
      description: feature.description,
      status: statusToApi(feature.status), // Convert DB -> API using constants
      priority: priorityToApi(feature.priority), // Convert DB -> API using constants
      dependencies: feature.depends_on || [],
      estimated_effort_weeks: feature.effort_estimate_weeks,
      assigned_to: feature.assigned_to || null,
      reporter: feature.reporter || null,
      story_points: feature.story_points ?? null,
      labels: feature.labels || [],
      acceptance_criteria: feature.acceptance_criteria || null,
      ticket_type: feature.ticket_type || 'feature',
      start_date: feature.start_date || null,
      end_date: feature.end_date || null,
      duration: feature.duration ?? null,
    }))

    // Calculate timeline data (Phase 7)
    const timelineData = calculateTimeline(featureModels)

    // Format features data with timeline information
    const formattedFeatures = timelineData.features.map((feature) => ({
      _id: feature.id,
      id: feature.id,
      projectId: feature.project_id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      priority: feature.priority,
      effortEstimateWeeks: feature.estimated_effort_weeks || 0,
      dependsOn: feature.dependencies || [],
      createdAt: feature.created_at,
      // Jira-style fields (Phase 6)
      assignedTo: feature.assigned_to || null,
      reporter: feature.reporter || null,
      storyPoints: feature.story_points ?? null,
      labels: feature.labels || [],
      acceptanceCriteria: feature.acceptance_criteria || null,
      ticketType: feature.ticket_type || 'feature',
      // Timeline fields (Phase 7)
      startDate: feature.start_date || feature.calculatedStartDate || null,
      endDate: feature.end_date || feature.calculatedEndDate || null,
      duration: feature.duration || feature.calculatedDuration || null,
      isOnCriticalPath: feature.isOnCriticalPath || false,
      slackDays: feature.slackDays,
    }))

    const response: GetProjectResponse = {
      project: formattedProject,
      features: formattedFeatures,
      feedbackByFeature,
      timeline: {
        dependencyChains: timelineData.dependencyChains,
        criticalPath: timelineData.criticalPath,
        milestones: timelineData.milestones,
        overlaps: timelineData.overlaps,
      },
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

