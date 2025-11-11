'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { UserStoryResponse, CreateUserStoryRequest, UpdateUserStoryRequest } from '@/types'

interface UserStoryFormProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string // Optional: user stories are now global
  userStory?: UserStoryResponse | null
  onSubmit: (data: CreateUserStoryRequest | UpdateUserStoryRequest) => Promise<void>
  isSubmitting?: boolean
}

export default function UserStoryForm({
  isOpen,
  onClose,
  projectId,
  userStory,
  onSubmit,
  isSubmitting = false,
}: UserStoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    goal: '',
    benefit: '',
    demographics: {
      age: '',
      location: '',
      technical_skill: '',
    } as Record<string, string>,
  })

  useEffect(() => {
    if (userStory) {
      // Edit mode
      setFormData({
        name: userStory.name || '',
        role: userStory.role || '',
        goal: userStory.goal || '',
        benefit: userStory.benefit || '',
        demographics: userStory.demographics || {
          age: '',
          location: '',
          technical_skill: '',
        },
      })
    } else {
      // Create mode
      setFormData({
        name: '',
        role: '',
        goal: '',
        benefit: '',
        demographics: {
          age: '',
          location: '',
          technical_skill: '',
        },
      })
    }
  }, [userStory, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name.trim() || !formData.role.trim() || !formData.goal.trim() || !formData.benefit.trim()) {
      return
    }

    // Prepare demographics (remove empty fields)
    const demographics: Record<string, string> = {}
    if (formData.demographics.age?.trim()) {
      demographics.age = formData.demographics.age.trim()
    }
    if (formData.demographics.location?.trim()) {
      demographics.location = formData.demographics.location.trim()
    }
    if (formData.demographics.technical_skill?.trim()) {
      demographics.technical_skill = formData.demographics.technical_skill.trim()
    }

    if (userStory) {
      // Update existing user story
      const updateData: UpdateUserStoryRequest = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        goal: formData.goal.trim(),
        benefit: formData.benefit.trim(),
        demographics: Object.keys(demographics).length > 0 ? demographics : null,
      }
      await onSubmit(updateData)
    } else {
      // Create new user story (projectId is optional - user stories are now global)
      const createData: CreateUserStoryRequest = {
        ...(projectId && { projectId }), // Only include projectId if provided
        name: formData.name.trim(),
        role: formData.role.trim(),
        goal: formData.goal.trim(),
        benefit: formData.benefit.trim(),
        demographics: Object.keys(demographics).length > 0 ? demographics : null,
      }
      await onSubmit(createData)
    }
  }

  const handleDemographicsChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      demographics: {
        ...prev.demographics,
        [field]: value,
      },
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-card shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#d9d9d9] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0d0d0d]">
            {userStory ? 'Edit User Story' : 'Create User Story'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#404040] hover:text-[#0d0d0d] transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#404040] mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
              placeholder="As a customer"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-[#404040] mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="role"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
              placeholder="I want to reset my password"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Goal Field */}
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-[#404040] mb-2">
              Goal <span className="text-red-500">*</span>
            </label>
            <textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData((prev) => ({ ...prev, goal: e.target.value }))}
              className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
              placeholder="So that I can regain access to my account"
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Benefit Field */}
          <div>
            <label htmlFor="benefit" className="block text-sm font-medium text-[#404040] mb-2">
              Benefit <span className="text-red-500">*</span>
            </label>
            <textarea
              id="benefit"
              value={formData.benefit}
              onChange={(e) => setFormData((prev) => ({ ...prev, benefit: e.target.value }))}
              className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
              placeholder="Reduces support tickets and improves user experience"
              rows={3}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Demographics Section */}
          <div className="border-t border-[#d9d9d9] pt-6">
            <h3 className="text-lg font-medium text-[#0d0d0d] mb-4">Demographics (Optional)</h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="age"
                  className="block text-sm font-medium text-[#404040] mb-2"
                >
                  Age
                </label>
                <input
                  type="text"
                  id="age"
                  value={formData.demographics.age || ''}
                  onChange={(e) => handleDemographicsChange('age', e.target.value)}
                  className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
                  placeholder="25-45"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-[#404040] mb-2"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.demographics.location || ''}
                  onChange={(e) => handleDemographicsChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
                  placeholder="North America"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="technical_skill"
                  className="block text-sm font-medium text-[#404040] mb-2"
                >
                  Technical Skill
                </label>
                <input
                  type="text"
                  id="technical_skill"
                  value={formData.demographics.technical_skill || ''}
                  onChange={(e) => handleDemographicsChange('technical_skill', e.target.value)}
                  className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
                  placeholder="intermediate"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#d9d9d9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#404040] hover:bg-[#f5f5f5] rounded-full transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
              disabled={isSubmitting || !formData.name.trim() || !formData.role.trim() || !formData.goal.trim() || !formData.benefit.trim()}
            >
              {isSubmitting ? 'Saving...' : userStory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

