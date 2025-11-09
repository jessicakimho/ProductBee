'use client'

import { useState, useEffect } from 'react'
import { Plus, Sparkles, AlertCircle } from 'lucide-react'
import { ROLES } from '@/lib/constants'
import { useUserStories } from '@/hooks/useUserStories'
import UserStoryCard from './UserStoryCard'
import UserStoryForm from './UserStoryForm'
import type { UserStoryResponse, FeatureResponse, CreateUserStoryRequest, UpdateUserStoryRequest } from '@/types'

interface UserStoriesTabProps {
  projectId: string
  userRole?: string
  features: FeatureResponse[]
}

export default function UserStoriesTab({ projectId, userRole, features }: UserStoriesTabProps) {
  const {
    userStories,
    isLoading,
    error,
    fetchUserStories,
    createUserStory,
    updateUserStory,
    deleteUserStory,
    assignUserStoryToTicket,
    unassignUserStoryFromTicket,
    isCreating,
    isUpdating,
    isDeleting,
    isAssigning,
  } = useUserStories()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUserStory, setEditingUserStory] = useState<UserStoryResponse | null>(null)
  const [deletingUserStoryId, setDeletingUserStoryId] = useState<string | null>(null)

  const canEdit = userRole === ROLES.PM || userRole === ROLES.ADMIN

  // Fetch user stories on mount
  useEffect(() => {
    fetchUserStories(projectId)
  }, [projectId, fetchUserStories])

  // Get linked tickets for a user story
  const getLinkedTickets = (userStory: UserStoryResponse): FeatureResponse[] => {
    const linkedIds = userStory.linkedTicketIds || []
    return features.filter((ticket) => linkedIds.includes(ticket.id) || linkedIds.includes(ticket._id))
  }

  const handleCreateUserStory = async (data: CreateUserStoryRequest) => {
    await createUserStory(data)
    setIsFormOpen(false)
    // Refresh user stories
    await fetchUserStories(projectId)
  }

  const handleUpdateUserStory = async (data: UpdateUserStoryRequest) => {
    if (editingUserStory) {
      await updateUserStory(editingUserStory.id || editingUserStory._id, data)
      setEditingUserStory(null)
      // Refresh user stories
      await fetchUserStories(projectId)
    }
  }

  const handleDeleteUserStory = async (userStoryId: string) => {
    if (confirm('Are you sure you want to delete this user story? This will unlink it from all tickets.')) {
      setDeletingUserStoryId(userStoryId)
      const success = await deleteUserStory(userStoryId)
      setDeletingUserStoryId(null)
      if (success) {
        // Refresh user stories
        await fetchUserStories(projectId)
      }
    }
  }

  const handleLinkTicket = async (userStoryId: string, ticketId: string) => {
    await assignUserStoryToTicket(ticketId, userStoryId)
    // Refresh user stories to get updated linkedTicketIds
    await fetchUserStories(projectId)
  }

  const handleUnlinkTicket = async (userStoryId: string, ticketId: string) => {
    await unassignUserStoryFromTicket(ticketId, userStoryId)
    // Refresh user stories to get updated linkedTicketIds
    await fetchUserStories(projectId)
  }

  const handleEditClick = (userStory: UserStoryResponse) => {
    setEditingUserStory(userStory)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingUserStory(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Stories</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Define user personas and link them to tickets for better alignment
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create User Story
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && userStories.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">Loading user stories...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && userStories.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Sparkles className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No user stories yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create user stories to define personas and link them to tickets
          </p>
          {canEdit && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First User Story
            </button>
          )}
        </div>
      )}

      {/* User Stories List */}
      {!isLoading && userStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userStories.map((userStory) => {
            const linkedTickets = getLinkedTickets(userStory)
            return (
              <UserStoryCard
                key={userStory.id || userStory._id}
                userStory={userStory}
                linkedTickets={linkedTickets}
                allTickets={features}
                canEdit={canEdit}
                onEdit={() => handleEditClick(userStory)}
                onDelete={() => handleDeleteUserStory(userStory.id || userStory._id)}
                onLinkTicket={(ticketId) => handleLinkTicket(userStory.id || userStory._id, ticketId)}
                onUnlinkTicket={(ticketId) => handleUnlinkTicket(userStory.id || userStory._id, ticketId)}
                isDeleting={isDeleting && deletingUserStoryId === (userStory.id || userStory._id)}
                isLinking={isAssigning}
              />
            )
          })}
        </div>
      )}

      {/* User Story Form Modal */}
      <UserStoryForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        projectId={projectId}
        userStory={editingUserStory}
        onSubmit={editingUserStory ? handleUpdateUserStory : handleCreateUserStory}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  )
}

