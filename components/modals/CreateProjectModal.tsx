'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { PRIORITY_LEVELS } from '@/lib/constants'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')
  const [estimatedEffort, setEstimatedEffort] = useState<number>(4)
  const [labels, setLabels] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!projectName.trim() || !projectDescription.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          projectDescription: projectDescription.trim(),
        }),
      })

      let responseData
      try {
        responseData = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }

      if (!response.ok || !responseData.success) {
        const errorMessage = responseData.error || responseData.message || 'Failed to create project'
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          code: responseData.code,
          fullResponse: responseData,
        })
        // Check for permission errors
        if (response.status === 403 || errorMessage.includes('Access denied') || errorMessage.includes('PM')) {
          throw new Error('Only PMs and Admins can create projects. Please contact a PM or Admin for assistance.')
        }
        throw new Error(errorMessage)
      }

      // Handle wrapped response: { success: true, data: { project: {...}, features: [...] } }
      const projectData = responseData.data
      if (!projectData?.project?.id) {
        throw new Error('Invalid response from server')
      }

      toast.success('Project created successfully!')
      onClose()
      setProjectName('')
      setProjectDescription('')
      setPriority('medium')
      setEstimatedEffort(4)
      setLabels([])
      setNewLabel('')
      router.push(`/project/${projectData.project.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-card shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#d9d9d9] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#0d0d0d]">
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="text-[#404040] hover:text-[#0d0d0d] transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium text-[#404040] mb-2"
            >
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
              placeholder="Enter project name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="projectDescription"
              className="block text-sm font-medium text-[#404040] mb-2"
            >
              Project Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
              placeholder="Describe your project in detail..."
              required
              disabled={isLoading}
            />
          </div>

          {/* Priority and Estimated Effort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-[#404040] mb-2"
              >
                Default Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
                disabled={isLoading}
              >
                {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="estimatedEffort"
                className="block text-sm font-medium text-[#404040] mb-2"
              >
                Estimated Effort (Weeks)
              </label>
              <input
                id="estimatedEffort"
                type="number"
                min="1"
                step="1"
                value={estimatedEffort}
                onChange={(e) => setEstimatedEffort(parseInt(e.target.value) || 4)}
                className="w-full px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Labels/Tags */}
          <div>
            <label
              htmlFor="labels"
              className="block text-sm font-medium text-[#404040] mb-2"
            >
              Project Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="labels"
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
                      setLabels([...labels, newLabel.trim()])
                      setNewLabel('')
                    }
                  }
                }}
                className="flex-1 px-4 py-2 border border-[#d9d9d9] rounded-card-inner focus:ring-2 focus:ring-[#a855f7] focus:border-transparent bg-white text-[#0d0d0d]"
                placeholder="Add a tag and press Enter"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => {
                  if (newLabel.trim() && !labels.includes(newLabel.trim())) {
                    setLabels([...labels, newLabel.trim()])
                    setNewLabel('')
                  }
                }}
                className="px-4 py-2 bg-[#d9d9d9] text-[#0d0d0d] rounded-full hover:bg-[#c9c9c9] transition-colors"
                disabled={isLoading}
              >
                Add
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#a855f7] bg-opacity-10 text-[#a855f7] rounded-full text-sm"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => setLabels(labels.filter((l) => l !== label))}
                      className="hover:text-[#9333ea] transition-colors"
                      disabled={isLoading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#d9d9d9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#404040] hover:bg-[#f5f5f5] rounded-full transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !projectName.trim() || !projectDescription.trim()}
              className="px-4 py-2 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

