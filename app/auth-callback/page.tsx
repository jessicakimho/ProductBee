'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'

/**
 * Post-login callback page with buffer to prevent redirect loops
 * 
 * This page serves as an intermediate step after Auth0 authentication.
 * It waits a moment for the session to be fully established before
 * redirecting to the dashboard, preventing infinite redirect loops
 * caused by timing issues with session cookies or fake pings.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const { user, isLoading, error } = useUser()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // Wait for Auth0 to finish loading user data
    if (isLoading) {
      return
    }

    // If there's an error, redirect to login
    if (error) {
      console.error('Auth callback error:', error)
      router.push('/api/auth/login')
      return
    }

    // If we have a user, wait a bit for session to fully establish
    // then redirect to dashboard
    if (user && !redirecting) {
      setRedirecting(true)
      
      // Add a buffer (750ms) to ensure session cookies are fully set
      // This prevents redirect loops from fake pings or timing issues
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 750)

      return () => clearTimeout(timer)
    }

    // If no user after loading completes, redirect to login
    // The session should be established by now if Auth0 callback succeeded
    if (!user && !isLoading && !error) {
      console.warn('Auth callback: No user found, redirecting to login')
      // Add a small delay before redirecting to avoid rapid redirects
      const timer = setTimeout(() => {
        router.push('/api/auth/login')
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [user, isLoading, error, router, redirecting])

  // Show loading state while waiting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing login...</p>
      </div>
    </div>
  )
}

