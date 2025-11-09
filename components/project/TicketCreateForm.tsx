'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { TICKET_TYPES, PRIORITY_LEVELS, ROLES } from '@/lib/constants'
import { useFeature } from '@/hooks/useFeature'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { useUserProfile } from '@/hooks/useUserProfile'
import type { CreateFeatureRequest } from '@/types'

interface TicketCreateFormProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onSuccess?: () => void
}

export default function TicketCreateForm({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: TicketCreateFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ticketType, setTicketType] = useState<'feature' | 'bug' | 'epic' | 'story'>('feature')
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [storyPoints, setStoryPoints] = useState<number | null>(null)
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [effortEstimateWeeks, setEffortEstimateWeeks] = useState<number>(1)

  const { createFeature, isCreating } = useFeature()
  const { members, loading: membersLoading } = useTeamMembers()
  const { profile, fetchProfile } = useUserProfile()

  // Fetch profile when modal opens
  useEffect(() => {
    if (isOpen && !profile) {
      fetchProfile()
    }
  }, [isOpen, profile, fetchProfile])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setDescription('')
      setTicketType('feature')
      setPriority('medium')
      setAssignedTo(null)
      setStoryPoints(null)
      setAcceptanceCriteria('')
      setLabels([])
      setNewLabel('')
      setEffortEstimateWeeks(1)
    }
  }, [isOpen])

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()])
      setNewLabel('')
    }
  }

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((label) => label !== labelToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      return
    }

    const featureData: CreateFeatureRequest = {
      projectId,
      title: title.trim(),
      description: description.trim(),
      priority,
      effortEstimateWeeks,
      ticketType,
      assignedTo,
      storyPoints,
      acceptanceCriteria: acceptanceCriteria.trim() || null,
      labels: labels.length > 0 ? labels : undefined,
    }

    const result = await createFeature(featureData)
    if (result) {
      onSuccess?.()
      onClose()
    }
  }

  if (!isOpen) return null

  // Filter members to only show engineers (for assignment)
  const assignableMembers = members.filter(
    (member) => member.role === ROLES.ENGINEER || member.role === ROLES.PM || member.role === ROLES.ADMIN
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Ticket
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter ticket title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Describe the ticket in detail..."
              required
            />
          </div>

          {/* Ticket Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ticketType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Ticket Type
              </label>
              <select
                id="ticketType"
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as typeof ticketType)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(TICKET_TYPES).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                  <option key={value} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assignment and Story Points */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="assignedTo"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Assign To
              </label>
              <select
                id="assignedTo"
                value={assignedTo || ''}
                onChange={(e) => setAssignedTo(e.target.value || null)}
                disabled={membersLoading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">Unassigned</option>
                {assignableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.specialization ? `(${member.specialization})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="storyPoints"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Story Points
              </label>
              <input
                id="storyPoints"
                type="number"
                min="0"
                max="100"
                value={storyPoints || ''}
                onChange={(e) => setStoryPoints(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Effort Estimate */}
          <div>
            <label
              htmlFor="effortEstimateWeeks"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Estimated Effort (Weeks) <span className="text-red-500">*</span>
            </label>
            <input
              id="effortEstimateWeeks"
              type="number"
              min="0.5"
              step="0.5"
              value={effortEstimateWeeks}
              onChange={(e) => setEffortEstimateWeeks(parseFloat(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Acceptance Criteria */}
          <div>
            <label
              htmlFor="acceptanceCriteria"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Acceptance Criteria
            </label>
            <textarea
              id="acceptanceCriteria"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Define the acceptance criteria for this ticket..."
            />
          </div>

          {/* Labels */}
          <div>
            <label
              htmlFor="labels"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Labels
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
                    handleAddLabel()
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Add a label and press Enter"
              />
              <button
                type="button"
                onClick={handleAddLabel}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Add
              </button>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(label)}
                      className="hover:text-blue-600 dark:hover:text-blue-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reporter Info */}
          {profile && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Reporter: {profile.name} ({profile.email})
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim() || !description.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

