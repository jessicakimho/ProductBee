import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import { getUserFromSession } from '@/lib/api/permissions'
import OnboardingForm from '@/components/onboarding/OnboardingForm'
import { ROLES } from '@/lib/constants'

/**
 * Onboarding Page - Server component
 * Redirects users who already have a non-viewer role, or allows them to set their role
 */
export default async function OnboardingPage() {
  const headersList = await headers()
  const cookiesList = await cookies()
  const session = await getSession({ 
    req: { headers: headersList, cookies: cookiesList } as any 
  })
  
  if (!session) {
    redirect('/api/auth/login')
  }

  // Get user from database
  let user
  try {
    user = await getUserFromSession(session)
  } catch (error) {
    console.error('Error fetching user:', error)
    redirect('/api/auth/login')
  }

  // If user has a non-viewer role and (for engineers) has a specialization, they can proceed
  // But we still allow them to update their profile if they want
  const needsOnboarding = 
    user.role === ROLES.VIEWER || 
    (user.role === ROLES.ENGINEER && !user.specialization)

  // If user doesn't need onboarding, redirect to dashboard
  // But we'll still show the form so they can update if needed
  if (!needsOnboarding && user.role !== ROLES.VIEWER) {
    // User already has a proper role set, but we'll still show the form for updates
    // They can skip if they want
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <OnboardingForm 
        initialRole={user.role}
        initialSpecialization={user.specialization || null}
      />
    </div>
  )
}

