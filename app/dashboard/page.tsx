import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession } from '@/lib/api/permissions'
import { ROLES } from '@/lib/constants'
import type { ProjectResponse } from '@/types'

async function getProjects(accountId: string) {
  try {
    const supabase = createServerClient()

    // Get all projects with creator info, filtered by account_id
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        created_by:users!projects_created_by_fkey (
          name,
          email
        )
      `)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return []
    }

    // Format projects to match expected structure
    return projects?.map((project: any): ProjectResponse => ({
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
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export default async function DashboardPage() {
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

  // Redirect to onboarding if user needs to set their role or specialization
  // Users with default 'viewer' role or engineers without specialization should complete onboarding
  const needsOnboarding = 
    user.role === ROLES.VIEWER || 
    (user.role === ROLES.ENGINEER && !user.specialization)

  if (needsOnboarding) {
    redirect('/onboarding')
  }

  const projects = await getProjects(user.account_id)

  // Ensure we always pass an array and user role
  return <DashboardClient projects={Array.isArray(projects) ? projects : []} userRole={user.role} />
}

