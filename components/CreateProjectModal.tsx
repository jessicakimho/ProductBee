'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create project')
      }

      const data = await response.json()
      toast.success('Project created successfully!')
      onClose()
      setProjectName('')
      setProjectDescription('')
      router.push(`/project/${data.project.id}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 card border-b-0 rounded-b-none px-8 py-6 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-2xl font-semibold tracking-tight">
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label
              htmlFor="projectName"
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full"
              placeholder="Enter project name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="projectDescription"
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Project Description
            </label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={6}
              className="w-full"
              placeholder="Describe your project in detail..."
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

