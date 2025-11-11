import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import AuthCallbackClient from './AuthCallbackClient'

/**
 * Post-login callback page with buffer to prevent redirect loops
 * 
 * This page serves as an intermediate step after Auth0 authentication.
 * It checks the session server-side and then uses a client component
 * to add a small buffer before redirecting to the dashboard, preventing
 * infinite redirect loops from timing issues or fake pings.
 */
export default async function AuthCallbackPage() {
  // Check session server-side
  const session = await getSession()
  
  // If no session, redirect to login
  if (!session) {
    redirect('/api/auth/login')
  }

  // If we have a session, render client component that will add buffer and redirect
  return <AuthCallbackClient />
}

