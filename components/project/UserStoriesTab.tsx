'use client'

import { useState, useEffect } from 'react'
import { Plus, Sparkles, AlertCircle } from 'lucide-react'
import { ROLES } from '@/lib/constants'
import { useUserStories } from '@/hooks/useUserStories'
import UserStoryCard from './UserStoryCard'
import UserStoryForm from './UserStoryForm'
import type { UserStoryResponse, FeatureResponse, CreateUserStoryRequest, UpdateUserStoryRequest } from '@/types'

interface UserStoriesTabProps {
  projectId?: string // Optional: user stories are now global
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

  // Fetch all user stories on mount (global, not project-specific)
  useEffect(() => {
    fetchUserStories() // No projectId needed - fetches all user stories for account
  }, [fetchUserStories])

  // Get linked tickets for a user story
  const getLinkedTickets = (userStory: UserStoryResponse): FeatureResponse[] => {
    const linkedIds = userStory.linkedTicketIds || []
    return features.filter((ticket) => linkedIds.includes(ticket.id) || linkedIds.includes(ticket._id))
  }

  const handleSubmitUserStory = async (data: CreateUserStoryRequest | UpdateUserStoryRequest) => {
    if (editingUserStory) {
      // Update existing user story
      await updateUserStory(editingUserStory.id || editingUserStory._id, data as UpdateUserStoryRequest)
      setEditingUserStory(null)
    } else {
      // Create new user story
      await createUserStory(data as CreateUserStoryRequest)
      setIsFormOpen(false)
    }
    // Refresh user stories
    await fetchUserStories()
  }

  const handleDeleteUserStory = async (userStoryId: string) => {
    if (confirm('Are you sure you want to delete this user story? This will unlink it from all tickets.')) {
      setDeletingUserStoryId(userStoryId)
      const success = await deleteUserStory(userStoryId)
      setDeletingUserStoryId(null)
      if (success) {
        // Refresh user stories
        await fetchUserStories()
      }
    }
  }

  const handleLinkTicket = async (userStoryId: string, ticketId: string) => {
    await assignUserStoryToTicket(ticketId, userStoryId)
    // Refresh user stories to get updated linkedTicketIds
    await fetchUserStories()
  }

  const handleUnlinkTicket = async (userStoryId: string, ticketId: string) => {
    await unassignUserStoryFromTicket(ticketId, userStoryId)
    // Refresh user stories to get updated linkedTicketIds
    await fetchUserStories()
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
    <div className="space-y-4">
      {/* Description and Create Button */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm text-[#404040] flex-1">
          Define user personas and link them to tickets for better alignment. User stories are global and can be used across all projects.
        </p>
        {canEdit && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors shadow-soft flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
            Create User Story
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && userStories.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a855f7] mx-auto"></div>
          <p className="text-[#404040] mt-4">Loading user stories...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && userStories.length === 0 && !error && (
        <div className="text-center py-16 bg-white rounded-card shadow-soft border border-[#d9d9d9]">
          <Sparkles className="w-12 h-12 text-[#404040] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#0d0d0d] mb-2">No user stories yet</h3>
          <p className="text-sm text-[#404040] mb-6 max-w-md mx-auto">
            Create user stories to define personas and link them to tickets across all your projects
          </p>
          {canEdit && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors shadow-soft"
            >
              <Plus className="w-5 h-5" />
              Create Your First User Story
            </button>
          )}
        </div>
      )}

      {/* User Stories List */}
      {!isLoading && userStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        projectId={projectId} // Optional - for backward compatibility
        userStory={editingUserStory}
        onSubmit={handleSubmitUserStory}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  )
}

