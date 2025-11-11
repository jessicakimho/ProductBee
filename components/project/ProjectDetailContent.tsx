'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  restrictToWindowEdges,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ROLES, FEATURE_STATUS } from '@/lib/constants'
import { useProject } from '@/hooks/useProject'
import { useFeature } from '@/hooks/useFeature'
import { usePendingChanges } from '@/hooks/usePendingChanges'
import FeatureCard from './FeatureCard'
import FeatureModal from './FeatureModal'
import TicketCreateForm from './TicketCreateForm'
import GanttView from './GanttView'
import ViewToggle, { type ViewType } from './ViewToggle'
import PendingChangesNotification from './PendingChangesNotification'
import PendingChangesList from '@/components/modals/PendingChangesList'
import UserStoriesTab from './UserStoriesTab'
import type { GetProjectResponse, FeatureResponse } from '@/types'

interface ProjectDetailContentProps {
  projectId: string
  initialData: GetProjectResponse
  userRole?: string
}

// Feature status columns (using API format values)
const columns = [
  { id: FEATURE_STATUS.NOT_STARTED, title: 'Backlog' },
  { id: FEATURE_STATUS.IN_PROGRESS, title: 'In Progress' },
  { id: FEATURE_STATUS.BLOCKED, title: 'Blocked' },
  { id: FEATURE_STATUS.COMPLETE, title: 'Complete' },
]

// Draggable Feature Card Component
function DraggableFeatureCard({
  feature,
  onClick,
  canEdit,
  pendingChangeId,
}: {
  feature: FeatureResponse
  onClick: () => void
  canEdit?: boolean
  pendingChangeId?: string | null
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature._id || feature.id,
    disabled: !canEdit || !!pendingChangeId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <FeatureCard
        feature={feature}
        onClick={onClick}
        canEdit={canEdit}
        pendingChangeId={pendingChangeId}
      />
    </div>
  )
}

// Droppable Column Component
function DroppableColumn({
  columnId,
  title,
  features,
  onFeatureClick,
  canEdit,
  pendingChangesMap,
}: {
  columnId: string
  title: string
  features: FeatureResponse[]
  onFeatureClick: (feature: FeatureResponse) => void
  canEdit?: boolean
  pendingChangesMap: Map<string, string>
}) {
  const featureIds = features.map((f) => f._id || f.id)
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  })

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-card-inner shadow-soft p-4 border ${
        isOver
          ? 'border-[#a855f7] border-2'
          : 'border-[#d9d9d9]'
      }`}
    >
      <h3 className="font-semibold text-[#0d0d0d] mb-4">
        {title} ({features.length})
      </h3>
      <SortableContext items={featureIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {features.map((feature) => {
            const featureId = feature._id || feature.id
            const pendingChangeId = pendingChangesMap.get(featureId)
            return (
              <DraggableFeatureCard
                key={featureId}
                feature={feature}
                onClick={() => onFeatureClick(feature)}
                canEdit={canEdit}
                pendingChangeId={pendingChangeId}
              />
            )
          })}
          {features.length === 0 && (
            <div className="text-center py-8 text-[#404040] text-sm">No features</div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function ProjectDetailContent({
  projectId,
  initialData,
  userRole,
}: ProjectDetailContentProps) {
  const [selectedFeature, setSelectedFeature] = useState<FeatureResponse | null>(null)
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const [isPendingChangesOpen, setIsPendingChangesOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState<FeatureResponse | null>(null)
  const [optimisticFeatures, setOptimisticFeatures] = useState<FeatureResponse[] | null>(null)

  // View state with localStorage persistence (default to 'backlog')
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectViewPreference')
      return (saved === 'gantt' || saved === 'backlog' || saved === 'user-stories') ? saved : 'backlog'
    }
    return 'backlog'
  })

  // Save view preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectViewPreference', currentView)
    }
  }, [currentView])

  const { projectData, refetch } = useProject(projectId)
  const { updateFeatureStatus } = useFeature()
  const {
    pendingChanges,
    count: pendingCount,
    fetchPendingChanges,
    proposeStatusChange,
    approveStatusChange,
    rejectStatusChange,
    isApproving,
    isRejecting,
  } = usePendingChanges()

  // Fetch pending changes on mount and when project data changes
  useEffect(() => {
    if (projectId) {
      fetchPendingChanges(projectId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Create a map of feature IDs to pending change IDs for quick lookup
  const pendingChangesMap = new Map<string, string>()
  pendingChanges.forEach((change) => {
    pendingChangesMap.set(change.featureId, change.id)
  })

  // Use hook data if available and loaded, otherwise use initial data
  const baseData = projectData && projectData.project ? projectData : initialData
  
  // Apply optimistic updates if available
  const displayData = optimisticFeatures
    ? { ...baseData, features: optimisticFeatures }
    : baseData

  // Get current feedback for selected feature - this will update reactively when displayData changes
  const currentFeedback = selectedFeature
    ? displayData.feedbackByFeature[selectedFeature._id || selectedFeature.id] || []
    : []

  // Permission checks
  const isViewer = userRole === ROLES.VIEWER
  const isPMOrAdmin = userRole === ROLES.PM || userRole === ROLES.ADMIN
  const canEdit = !isViewer // Only viewers are read-only
  const canApprove = isPMOrAdmin // Only PM and Admin can approve proposals

  // Drag and drop sensors
  // Activation constraint allows clicks to work while preserving drag functionality
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Activate drag after 8px of movement (allows clicks to work)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Modifiers to improve drag behavior (don't restrict to vertical axis for kanban cross-column dragging)
  const modifiers = [restrictToWindowEdges]

  const handleFeatureClick = (feature: FeatureResponse) => {
    setSelectedFeature(feature)
  }

  const handleFeatureUpdate = async (featureId: string, newStatus: FeatureResponse['status']) => {
    if (isViewer) {
      // Viewers cannot update features
      return
    }
    const result = await updateFeatureStatus(featureId, newStatus)
    if (result) {
      refetch()
      fetchPendingChanges(projectId)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const feature = displayData.features.find((f) => (f._id || f.id) === active.id)
    if (feature) {
      setActiveFeature(feature)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveFeature(null)
    setOptimisticFeatures(null)

    if (!over || !canEdit) {
      return
    }

    const featureId = active.id as string
    const newStatus = over.id as string

    // Find the feature
    const feature = displayData.features.find((f) => (f._id || f.id) === featureId)
    if (!feature) {
      return
    }

    // Check if status is actually changing
    if (feature.status === newStatus) {
      return
    }

    // Check if there's already a pending change for this feature
    if (pendingChangesMap.has(featureId)) {
      return
    }

    // Optimistic UI update
    const updatedFeatures = displayData.features.map((f) =>
      f._id === featureId || f.id === featureId ? { ...f, status: newStatus } : f
    )
    setOptimisticFeatures(updatedFeatures)

    // Propose status change
    const result = await proposeStatusChange(featureId, newStatus)

    if (result) {
      // Refresh pending changes
      await fetchPendingChanges(projectId)
      // Refresh project data to get updated feature statuses
      refetch()
    } else {
      // Revert optimistic update on error
      setOptimisticFeatures(null)
    }
  }

  const handleApprove = async (featureId: string, pendingChangeId: string) => {
    const success = await approveStatusChange(featureId, pendingChangeId)
    if (success) {
      await fetchPendingChanges(projectId)
      refetch()
    }
  }

  const handleReject = async (featureId: string, pendingChangeId: string, reason?: string) => {
    try {
      const success = await rejectStatusChange(featureId, pendingChangeId, reason)
      if (success) {
        // Refresh pending changes and project data after successful rejection
        await fetchPendingChanges(projectId)
        refetch()
      }
    } catch (error) {
      // Error is already handled by rejectStatusChange (toast notification)
      // But log it for debugging
      console.error('Error in handleReject:', error)
    }
  }

  const getFeaturesByStatus = (status: string) => {
    return displayData.features.filter((f) => f.status === status)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between py-4 px-4 border-b border-[#d9d9d9] bg-white flex-shrink-0">
        <h2 className="text-2xl font-bold text-[#0d0d0d]">
          {currentView === 'user-stories' ? 'User Stories' : currentView === 'gantt' ? 'Gantt' : 'Features'}
        </h2>
        <div className="flex items-center gap-4">
          {pendingCount > 0 && currentView !== 'user-stories' && (
            <PendingChangesNotification
              count={pendingCount}
              onClick={() => setIsPendingChangesOpen(true)}
            />
          )}
          <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
          {!isViewer && currentView !== 'user-stories' && (
            <button
              onClick={() => setIsCreateTicketOpen(true)}
              className="px-4 py-2 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors shadow-soft"
            >
              + Create Ticket
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-hidden ${currentView === 'gantt' ? '' : 'overflow-y-auto px-4 py-4'}`}>
        {/* User Stories View */}
        {currentView === 'user-stories' && (
          <UserStoriesTab
            projectId={projectId}
            userRole={userRole}
            features={displayData.features}
          />
        )}

        {/* Gantt View */}
        {currentView === 'gantt' && (
          <div className="h-full w-full">
            <GanttView
              features={displayData.features}
              onTaskClick={handleFeatureClick}
            />
          </div>
        )}

        {/* Backlog/Kanban View */}
        {currentView === 'backlog' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={modifiers}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {columns.map((column) => {
                const features = getFeaturesByStatus(column.id)
                return (
                  <DroppableColumn
                    key={column.id}
                    columnId={column.id}
                    title={column.title}
                    features={features}
                    onFeatureClick={handleFeatureClick}
                    canEdit={canEdit}
                    pendingChangesMap={pendingChangesMap}
                  />
                )
              })}
            </div>
            <DragOverlay
              adjustScale={false}
              dropAnimation={null}
              style={{
                cursor: 'grabbing',
              }}
            >
              {activeFeature ? (
                <div className="shadow-lg opacity-95" style={{ width: '300px' }}>
                  <FeatureCard
                    feature={activeFeature}
                    onClick={() => {}}
                    canEdit={canEdit}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Modals */}
      {selectedFeature && (
        <FeatureModal
          key={`feature-modal-${selectedFeature._id || selectedFeature.id}`}
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          feature={selectedFeature}
          projectId={displayData.project._id || displayData.project.id}
          feedback={currentFeedback}
          userRole={userRole}
          canEdit={canEdit}
          canApprove={canApprove}
          project={displayData.project}
          features={displayData.features}
          onFeatureUpdate={async () => {
            // Refresh project data to get updated feedback with AI Analysis
            await refetch()
            // Don't close the modal - keep it open so user can see the new feedback
          }}
        />
      )}

      <TicketCreateForm
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        projectId={displayData.project._id || displayData.project.id}
        userRole={userRole}
        onSuccess={() => {
          refetch()
        }}
      />

      {/* Pending Changes Modal */}
      <PendingChangesList
        isOpen={isPendingChangesOpen}
        onClose={() => setIsPendingChangesOpen(false)}
        pendingChanges={pendingChanges}
        features={displayData.features}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />
    </div>
  )
}

