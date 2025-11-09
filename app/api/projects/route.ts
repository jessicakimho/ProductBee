import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession } from '@/lib/api/permissions'
import { handleError, successResponse } from '@/lib/api/errors'
import type { GetProjectsResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const supabase = createServerClient()

    // Get all projects with creator info - filtered by account_id for account isolation
    const { data: projects, error: projectsError } = await supabase
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

    if (projectsError) {
      throw projectsError
    }

    // Transform data to match expected format
    const formattedProjects = projects?.map((project) => ({
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
    })) || []

    const response: GetProjectsResponse = {
      projects: formattedProjects,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

