'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Client component that adds a buffer delay before redirecting to dashboard
 * This prevents redirect loops from timing issues or fake pings
 */
export default function AuthCallbackClient() {
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (!redirecting) {
      setRedirecting(true)
      
      // Add a buffer (500ms) to ensure session cookies are fully set
      // This prevents redirect loops from fake pings or timing issues
      const timer = setTimeout(() => {
        // Use window.location for a hard redirect to ensure cookies are sent
        window.location.href = '/dashboard'
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [redirecting])

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

