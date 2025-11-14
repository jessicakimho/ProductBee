import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { getUserFromSession } from '@/lib/api/permissions'
import TeamMembersList from '@/components/team/TeamMembersList'

/**
 * Team Page - Server component
 * Displays all team members in the current account
 */
export default async function TeamPage() {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Team Members
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all team members in your account with their roles, specializations, and workload.
          </p>
        </div>
        <TeamMembersList />
      </div>
    </div>
  )
}

