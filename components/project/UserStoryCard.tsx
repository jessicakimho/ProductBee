'use client'

import { Edit2, Trash2, Link2, Unlink, User } from 'lucide-react'
import type { UserStoryResponse, FeatureResponse } from '@/types'

interface UserStoryCardProps {
  userStory: UserStoryResponse
  linkedTickets?: FeatureResponse[]
  allTickets?: FeatureResponse[]
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
  onLinkTicket: (ticketId: string) => void
  onUnlinkTicket: (ticketId: string) => void
  isDeleting?: boolean
  isLinking?: boolean
}

export default function UserStoryCard({
  userStory,
  linkedTickets = [],
  allTickets = [],
  canEdit,
  onEdit,
  onDelete,
  onLinkTicket,
  onUnlinkTicket,
  isDeleting = false,
  isLinking = false,
}: UserStoryCardProps) {
  const linkedTicketIds = userStory.linkedTicketIds || []
  const availableTickets = allTickets.filter((ticket) => !linkedTicketIds.includes(ticket.id) && !linkedTicketIds.includes(ticket._id))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{userStory.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created by {userStory.createdBy?.name || 'Unknown'} • {new Date(userStory.createdAt).toLocaleDateString()}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit user story"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              disabled={isDeleting}
              title="Delete user story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* User Story Content */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</p>
          <p className="text-gray-900 dark:text-white">{userStory.role}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal</p>
          <p className="text-gray-900 dark:text-white">{userStory.goal}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benefit</p>
          <p className="text-gray-900 dark:text-white">{userStory.benefit}</p>
        </div>
      </div>

      {/* Demographics */}
      {userStory.demographics && Object.keys(userStory.demographics).length > 0 && (
        <div className="mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Demographics
          </p>
          <div className="flex flex-wrap gap-2">
            {userStory.demographics.age && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                Age: {userStory.demographics.age}
              </span>
            )}
            {userStory.demographics.location && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-sm">
                Location: {userStory.demographics.location}
              </span>
            )}
            {userStory.demographics.technical_skill && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm">
                Skill: {userStory.demographics.technical_skill}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Linked Tickets */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Linked Tickets ({linkedTickets.length})
          </p>
          {canEdit && availableTickets.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onLinkTicket(e.target.value)
                  e.target.value = ''
                }
              }}
              disabled={isLinking}
              className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Link Ticket</option>
              {availableTickets.map((ticket) => (
                <option key={ticket.id || ticket._id} value={ticket.id || ticket._id}>
                  {ticket.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {linkedTickets.length > 0 ? (
          <div className="space-y-2">
            {linkedTickets.map((ticket) => (
              <div
                key={ticket.id || ticket._id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-sm text-gray-900 dark:text-white">{ticket.title}</span>
                {canEdit && (
                  <button
                    onClick={() => onUnlinkTicket(ticket.id || ticket._id)}
                    className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    disabled={isLinking}
                    title="Unlink ticket"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No linked tickets</p>
        )}
      </div>
    </div>
  )
}

