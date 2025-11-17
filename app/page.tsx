import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'

/**
 * Root Page
 * 
 * Redirects authenticated users to /dashboard
 * Redirects unauthenticated users to /home (public landing page)
 */
export default async function Home() {
  // Check if user is authenticated
  const session = await getSession()
  
  // If authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }
  
  // If not authenticated, redirect to public landing page
  redirect('/home')
}

