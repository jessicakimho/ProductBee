'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserProfile } from '@/hooks/useUserProfile'
import { ROLES, SPECIALIZATIONS } from '@/lib/constants'
import type { UpdateUserProfileRequest } from '@/types/api'

interface OnboardingFormProps {
  initialRole?: 'admin' | 'pm' | 'engineer' | 'viewer'
  initialSpecialization?: string | null
}

/**
 * OnboardingForm - Client component for user role and specialization setup
 * Allows users to select their role (PM, Engineer, or Viewer) and specialization (for engineers)
 * Note: Admin role cannot be set through this form - admins are set manually
 */
export default function OnboardingForm({ initialRole, initialSpecialization }: OnboardingFormProps) {
  const router = useRouter()
  const { profile, loading, fetchProfile, updateProfile } = useUserProfile()
  // Default to 'pm' if role is admin or undefined
  const defaultRole = (initialRole === 'pm' || initialRole === 'engineer' || initialRole === 'viewer') 
    ? initialRole 
    : 'pm'
  const [role, setRole] = useState<'pm' | 'engineer' | 'viewer'>(defaultRole as 'pm' | 'engineer' | 'viewer')
  const [specialization, setSpecialization] = useState<string | null>(
    initialSpecialization || null
  )
  const [submitting, setSubmitting] = useState(false)

  // Fetch profile on mount if not provided
  useEffect(() => {
    if (!initialRole && !profile) {
      fetchProfile()
    }
  }, [initialRole, profile, fetchProfile])

  // Update state when profile is loaded
  useEffect(() => {
    if (profile && !initialRole) {
      if (profile.role === 'pm' || profile.role === 'engineer' || profile.role === 'viewer') {
        setRole(profile.role)
      }
      setSpecialization(profile.specialization || null)
    }
  }, [profile, initialRole])

  // Check if user is admin
  const isAdmin = initialRole === 'admin' || profile?.role === 'admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const updates: UpdateUserProfileRequest = {}

      // Don't update role if user is admin
      if (!isAdmin) {
        updates.role = role
      }

      // Only set specialization if role is engineer (or if admin wants to set specialization)
      if (role === ROLES.ENGINEER || (isAdmin && specialization)) {
        if (!specialization && role === ROLES.ENGINEER) {
          alert('Please select a specialization for engineers')
          setSubmitting(false)
          return
        }
        updates.specialization = specialization
      } else if (!isAdmin) {
        // Clear specialization for non-engineers (but not for admins)
        updates.specialization = null
      }

      // If no updates (e.g., admin with no changes), just redirect
      if (Object.keys(updates).length === 0) {
        // Use replace instead of href to avoid adding to history
        window.location.replace('/dashboard')
        return
      }

      // Update profile and wait for completion
      await updateProfile(updates)
      
      // Redirect immediately after update
      // The database update happens server-side, so we can redirect right away
      // Dashboard will fetch fresh user data and handle redirect back to onboarding if needed
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      setSubmitting(false)
      // Don't redirect on error - user will see error toast and can try again
    }
  }

  const handleSkip = (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Allow users to skip and go to dashboard (they'll be redirected back if needed)
    // Use immediate navigation
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isAdmin ? 'Update Profile' : 'Welcome to ProductBee!'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {isAdmin 
            ? 'Update your profile settings. Note: Admin role cannot be changed through this form.'
            : "Let's set up your profile. Choose your role to get started."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection - Disabled for admins */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What's your role? {!isAdmin && <span className="text-red-500">*</span>}
              {isAdmin && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Admin - cannot be changed)</span>}
            </label>
            {isAdmin && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  You are an Admin. Your role cannot be changed through this form. You can still update your specialization or other profile settings below.
                </p>
              </div>
            )}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
              <button
                type="button"
                onClick={() => {
                  setRole(ROLES.PM)
                  setSpecialization(null) // Clear specialization when switching roles
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  role === ROLES.PM
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-semibold mb-1">Product Manager</div>
                <div className="text-sm opacity-75">Manage projects and roadmaps</div>
              </button>

              <button
                type="button"
                onClick={() => setRole(ROLES.ENGINEER)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  role === ROLES.ENGINEER
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-semibold mb-1">Engineer</div>
                <div className="text-sm opacity-75">Build and deliver features</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole(ROLES.VIEWER)
                  setSpecialization(null) // Clear specialization when switching roles
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  role === ROLES.VIEWER
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-semibold mb-1">Viewer</div>
                <div className="text-sm opacity-75">Read-only access</div>
              </button>
            </div>
          </div>

          {/* Specialization Selection (for engineers or admins who want to set specialization) */}
          {(role === ROLES.ENGINEER || isAdmin) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What's your specialization? {role === ROLES.ENGINEER && !isAdmin && <span className="text-red-500">*</span>}
                {isAdmin && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Optional for admins)</span>}
              </label>
              <select
                value={specialization || ''}
                onChange={(e) => setSpecialization(e.target.value || null)}
                required={role === ROLES.ENGINEER && !isAdmin}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select specialization...</option>
                <option value={SPECIALIZATIONS.BACKEND}>{SPECIALIZATIONS.BACKEND}</option>
                <option value={SPECIALIZATIONS.FRONTEND}>{SPECIALIZATIONS.FRONTEND}</option>
                <option value={SPECIALIZATIONS.QA}>{SPECIALIZATIONS.QA}</option>
                <option value={SPECIALIZATIONS.DEVOPS}>{SPECIALIZATIONS.DEVOPS}</option>
              </select>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isAdmin 
                  ? 'You can set a specialization to help with task assignment, even if you are not an engineer.'
                  : 'This helps us assign tasks that match your expertise.'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || loading || (!isAdmin && role === ROLES.ENGINEER && !specialization)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : isAdmin ? 'Update Profile' : 'Continue'}
            </button>
            {(initialRole && !isAdmin) && (
              <button
                type="button"
                onClick={(e) => handleSkip(e)}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold rounded-lg transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

