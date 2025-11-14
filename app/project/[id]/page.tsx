import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, canViewProject } from '@/lib/api/permissions'
import { feedbackTypeToApi } from '@/lib/api/validation'
import type { GetProjectResponse, FeatureResponse, FeedbackResponse, ProjectResponse } from '@/types'

async function getProjectData(id: string, accountId: string) {
  try {
    const supabase = createServerClient()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return null
    }

    // Get project with creator info, filtered by account_id
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        created_by:users!projects_created_by_fkey (
          name,
          email
        )
      `)
      .eq('id', id)
      .eq('account_id', accountId)
      .single()

    if (projectError || !project) {
      return null
    }

    // Get features for this project, filtered by account_id
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', id)
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })

    if (featuresError) {
      console.error('Error fetching features:', featuresError)
      return null
    }

    // Get feedback for this project, filtered by account_id
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('project_id', id)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError)
      return null
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
        .eq('account_id', accountId)
      
      if (!usersError && userData) {
        users = userData
      }
    }

    // Create a map of user IDs to user data
    const userMap = new Map(
      (users || []).map((u: any) => [u.id, { _id: u.id, name: u.name, email: u.email }])
    )

    // Group feedback by feature
    const feedbackByFeature: Record<string, FeedbackResponse[]> = {}
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
        type: feedbackTypeToApi(fb.type), // Convert DB -> API
        content: fb.content,
        proposedRoadmap: fb.proposed_roadmap,
        aiAnalysis: fb.ai_analysis,
        status: fb.status,
        createdAt: fb.created_at,
      })
    })

    // Format project data
    const formattedProject: GetProjectResponse['project'] = {
      _id: project.id,
      id: project.id,
      name: project.name,
      description: project.description,
      roadmap: project.roadmap,
      createdAt: project.created_at,
      createdBy: project.created_by ? {
        name: project.created_by.name,
        email: project.created_by.email,
      } : undefined,
    }

    // Format features data
    const formattedFeatures: FeatureResponse[] = features?.map((feature): FeatureResponse => ({
      _id: feature.id,
      id: feature.id,
      projectId: feature.project_id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      priority: feature.priority,
      effortEstimateWeeks: feature.effort_estimate_weeks,
      dependsOn: feature.depends_on || [],
      createdAt: feature.created_at,
    })) || []

    const result: GetProjectResponse = {
      project: formattedProject,
      features: formattedFeatures,
      feedbackByFeature,
    }

    return result
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const headersList = await headers()
  const cookiesList = await cookies()
  const session = await getSession({ 
    req: { headers: headersList, cookies: cookiesList } as any 
  })
  
  if (!session) {
    redirect('/api/auth/login')
  }

  // Get user from database with proper account isolation
  let user
  try {
    user = await getUserFromSession(session)
  } catch (error) {
    console.error('Error fetching user:', error)
    redirect('/api/auth/login')
  }

  // Check if user can view this project (account isolation + permissions)
  const canView = await canViewProject(user, params.id)
  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0d0d0d] mb-2">
            Access Denied
          </h1>
          <p className="text-[#404040] mb-4">
            You do not have access to this project.
          </p>
          <a
            href="/dashboard"
            className="text-[#a855f7] hover:underline"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const data = await getProjectData(params.id, user.account_id)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0d0d0d] mb-2">
            Project Not Found
          </h1>
          <a
            href="/dashboard"
            className="text-[#a855f7] hover:underline"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Also fetch all projects for the dashboard
  const supabase = createServerClient()
  const { data: projectsData } = await supabase
    .from('projects')
    .select(`
      *,
      created_by:users!projects_created_by_fkey (
        name,
        email
      )
    `)
    .eq('account_id', user.account_id)
    .order('created_at', { ascending: false })

  const projects: ProjectResponse[] = (projectsData?.map((project: any): ProjectResponse => ({
    _id: project.id,
    id: project.id,
    name: project.name,
    description: project.description,
    roadmap: project.roadmap,
    createdAt: project.created_at,
    createdBy: project.created_by ? {
      name: project.created_by.name,
      email: project.created_by.email,
    } : null,
  })) || [])

  return (
    <DashboardClient 
      projects={projects}
      userRole={user.role}
      initialProjectId={params.id}
      initialProjectData={data}
    />
  )
}

