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
    <div className="bg-white rounded-card shadow-soft p-6 border border-[#d9d9d9] hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#0d0d0d] mb-1">{userStory.name}</h3>
          <p className="text-sm text-[#404040]">
            Created by {userStory.createdBy?.name || 'Unknown'} • {new Date(userStory.createdAt).toLocaleDateString()}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-[#404040] hover:text-[#a855f7] hover:bg-[#f5f5f5] rounded-lg transition-colors"
              title="Edit user story"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-[#404040] hover:text-red-600 hover:bg-[#f5f5f5] rounded-lg transition-colors"
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
          <p className="text-sm font-medium text-[#404040] mb-1">Role</p>
          <p className="text-[#0d0d0d]">{userStory.role}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[#404040] mb-1">Goal</p>
          <p className="text-[#0d0d0d]">{userStory.goal}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-[#404040] mb-1">Benefit</p>
          <p className="text-[#0d0d0d]">{userStory.benefit}</p>
        </div>
      </div>

      {/* Demographics */}
      {userStory.demographics && Object.keys(userStory.demographics).length > 0 && (
        <div className="mb-4 pt-4 border-t border-[#d9d9d9]">
          <p className="text-sm font-medium text-[#404040] mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Demographics
          </p>
          <div className="flex flex-wrap gap-2">
            {userStory.demographics.age && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Age: {userStory.demographics.age}
              </span>
            )}
            {userStory.demographics.location && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Location: {userStory.demographics.location}
              </span>
            )}
            {userStory.demographics.technical_skill && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Skill: {userStory.demographics.technical_skill}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Linked Tickets */}
      <div className="pt-4 border-t border-[#d9d9d9]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-[#404040] flex items-center gap-2">
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
              className="text-sm px-3 py-1 border border-[#d9d9d9] rounded-full bg-white text-[#0d0d0d] focus:ring-2 focus:ring-[#a855f7] focus:border-transparent"
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
                className="flex items-center justify-between p-2 bg-[#f5f5f5] rounded-card-inner"
              >
                <span className="text-sm text-[#0d0d0d]">{ticket.title}</span>
                {canEdit && (
                  <button
                    onClick={() => onUnlinkTicket(ticket.id || ticket._id)}
                    className="p-1 text-[#404040] hover:text-red-600 rounded transition-colors"
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
          <p className="text-sm text-[#404040] italic">No linked tickets</p>
        )}
      </div>
    </div>
  )
}

