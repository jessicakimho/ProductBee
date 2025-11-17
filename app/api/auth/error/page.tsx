'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AlertCircle, Home } from 'lucide-react'

/**
 * Auth0 Error Page Content
 * 
 * This component uses useSearchParams() which requires a Suspense boundary
 */
function AuthErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // User-friendly error messages
  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          message: 'You denied access to the application. Please try logging in again and grant the necessary permissions.',
        }
      case 'login_required':
        return {
          title: 'Login Required',
          message: 'You need to log in to access this application. Please try again.',
        }
      case 'invalid_request':
        return {
          title: 'Invalid Request',
          message: 'The authentication request was invalid. Please try again.',
        }
      default:
        return {
          title: 'Authentication Error',
          message: errorDescription || 'An error occurred during authentication. Please try again.',
        }
    }
  }
  
  const { title, message } = getErrorMessage()
  
  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-card shadow-soft p-8 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 relative">
            <Image
              src="/bee_logo.png"
              alt="ProductBee Logo"
              fill
              className="object-contain"
              sizes="64px"
            />
          </div>
        </div>
        
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        
        {/* Error Title */}
        <h1 className="text-2xl font-bold text-[#0d0d0d] dark:text-white mb-2">
          {title}
        </h1>
        
        {/* Error Message */}
        <p className="text-[#404040] dark:text-gray-400 mb-6">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              // For access_denied errors, clear session first before retrying
              if (error === 'access_denied') {
                window.location.href = '/api/auth/logout?returnTo=/api/auth/login'
              } else {
                router.push('/api/auth/login')
              }
            }}
            className="w-full px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-full font-medium transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => {
              // For access_denied errors, clear session first before going home
              if (error === 'access_denied') {
                window.location.href = '/api/auth/logout?returnTo=/home'
              } else {
                router.push('/home')
              }
            }}
            className="w-full px-4 py-2 bg-[#d9d9d9] dark:bg-gray-700 text-[#0d0d0d] dark:text-white rounded-full font-medium hover:bg-[#c9c9c9] dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </div>
        
        {/* Technical Details (for debugging) */}
        {error && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 pt-6 border-t border-[#d9d9d9] dark:border-gray-700">
            <p className="text-xs text-[#404040] dark:text-gray-500 font-mono">
              Error Code: {error}
            </p>
            {errorDescription && (
              <p className="text-xs text-[#404040] dark:text-gray-500 font-mono mt-1">
                {errorDescription}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Auth0 Error Page
 * 
 * This page is displayed when Auth0 authentication encounters an error.
 * Common errors include:
 * - access_denied: User denied authorization
 * - login_required: User needs to log in
 * - invalid_request: Invalid request parameters
 */
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a855f7] mx-auto mb-4"></div>
          <p className="text-[#404040] dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}

