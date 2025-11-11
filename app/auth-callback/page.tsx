'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'

/**
 * Post-login callback page with buffer to prevent redirect loops
 * 
 * This page serves as an intermediate step after Auth0 authentication.
 * It waits for the session to be established client-side before redirecting
 * to the dashboard, preventing infinite redirect loops from timing issues.
 * 
 * We use client-side only to avoid server-side cookie timing issues.
 */
export default function AuthCallbackPage() {
  const { user, isLoading, error } = useUser()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    // Wait for Auth0 to finish loading
    if (isLoading) {
      return
    }

    // If there's an error, redirect to login
    if (error) {
      console.error('Auth callback error:', error)
      // Add delay to prevent rapid redirects
      setTimeout(() => {
        window.location.href = '/api/auth/login'
      }, 500)
      return
    }

    // If we have a user, wait a bit then redirect to dashboard
    if (user && !redirecting) {
      setRedirecting(true)
      
      // Add a buffer (750ms) to ensure session cookies are fully set
      // This prevents redirect loops from fake pings or timing issues
      const timer = setTimeout(() => {
        window.location.href = '/dashboard'
      }, 750)

      return () => clearTimeout(timer)
    }

    // If no user after loading, wait a bit more then check again or redirect to login
    if (!user && !isLoading && !error && !redirecting) {
      // Give it a bit more time - sometimes the session takes a moment
      const timer = setTimeout(() => {
        // Try one more time to get the user
        // If still no user, redirect to login
        window.location.href = '/api/auth/login'
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [user, isLoading, error, redirecting])

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

