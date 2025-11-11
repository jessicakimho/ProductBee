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
 * IMPORTANT: If this page receives a 'code' parameter, it means Auth0
 * redirected here directly instead of going through /api/auth/callback.
 * In that case, we redirect to /api/auth/callback first to process the code.
 */
export default function AuthCallbackPage() {
  const { user, isLoading, error } = useUser()
  const [redirecting, setRedirecting] = useState(false)
  const [checkedCode, setCheckedCode] = useState(false)

  useEffect(() => {
    // Check if we have a 'code' parameter - this means Auth0 redirected here
    // directly instead of going through /api/auth/callback first
    // We only check this once on mount
    if (!checkedCode && typeof window !== 'undefined') {
      setCheckedCode(true)
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      
      if (code) {
        // Redirect to the Auth0 callback handler to process the code
        // It will then redirect back to /auth-callback (without the code)
        const callbackUrl = `/api/auth/callback?code=${encodeURIComponent(code)}${state ? `&state=${encodeURIComponent(state)}` : ''}`
        window.location.href = callbackUrl
        return // Exit early - we're redirecting
      }
    }

    // If we haven't checked yet or we're still processing the code redirect, wait
    if (!checkedCode) {
      return
    }

    // Wait for Auth0 to finish loading
    if (isLoading) {
      return
    }

    // If there's an error, redirect to login
    if (error) {
      console.error('Auth callback error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
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
        // Log diagnostic info before redirecting
        console.warn('Auth callback: No user detected after waiting')
        console.warn('This might indicate:')
        console.warn('1. AUTH0_SECRET is too short (should be 32+ chars)')
        console.warn('2. Session cookies not being set properly')
        console.warn('3. Cookie domain/path mismatch')
        // Try one more time to get the user
        // If still no user, redirect to login
        window.location.href = '/api/auth/login'
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [user, isLoading, error, redirecting, checkedCode])

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

