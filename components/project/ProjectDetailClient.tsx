'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ArrowLeft } from 'lucide-react'
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
import ChatInterface from './ChatInterface'
import TicketGenerationControls from './TicketGenerationControls'
import PendingChangesNotification from './PendingChangesNotification'
import PendingChangesList from '@/components/modals/PendingChangesList'
import UserStoriesTab from './UserStoriesTab'
import type { GetProjectResponse, FeatureResponse } from '@/types'

interface ProjectDetailClientProps {
  projectData: GetProjectResponse
  userRole?: string
}

// Risk level color mapping
const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
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
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border ${
        isOver
          ? 'border-blue-400 dark:border-blue-600 border-2'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
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
            <div className="text-center py-8 text-gray-400 text-sm">No features</div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export default function ProjectDetailClient({
  projectData: initialData,
  userRole,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const { user } = useUser()
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

  const projectId = initialData.project._id || initialData.project.id
  const { projectData, refetch } = useProject(projectId)
  const { updateFeatureStatus } = useFeature()
  const {
    pendingChanges,
    count: pendingCount,
    fetchPendingChanges,
    proposeStatusChange,
    approveStatusChange,
    rejectStatusChange,
    isProposing,
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

  // Permission checks
  const isViewer = userRole === ROLES.VIEWER
  const isPMOrAdmin = userRole === ROLES.PM || userRole === ROLES.ADMIN
  const canEdit = !isViewer // Only viewers are read-only
  const canApprove = isPMOrAdmin // Only PM and Admin can approve proposals

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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
    const success = await rejectStatusChange(featureId, pendingChangeId, reason)
    if (success) {
      await fetchPendingChanges(projectId)
      refetch()
    }
  }

  const getFeaturesByStatus = (status: string) => {
    return displayData.features.filter((f) => f.status === status)
  }

  const riskLevel = displayData.project.roadmap.riskLevel?.toLowerCase() || 'low'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {displayData.project.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {displayData.project.description}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                riskColors[riskLevel] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {displayData.project.roadmap.riskLevel} Risk
            </span>
          </div>

          {/* AI Chat Interface - Claude Style */}
          {isPMOrAdmin && (
            <ChatInterface
              projectId={projectId}
              roadmapSummary={displayData.project.roadmap.summary}
              onTicketsGenerated={() => {
                refetch()
              }}
            />
          )}
        </div>

        {/* AI Ticket Generation Controls */}
        {isPMOrAdmin && (
          <TicketGenerationControls
            projectId={projectId}
            onTicketsApplied={() => {
              refetch()
            }}
          />
        )}

        {/* View Toggle and Actions */}
        {currentView !== 'user-stories' && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Features
            </h2>
            <div className="flex items-center gap-4">
              {pendingCount > 0 && (
                <PendingChangesNotification
                  count={pendingCount}
                  onClick={() => setIsPendingChangesOpen(true)}
                />
              )}
              <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
              {!isViewer && (
                <button
                  onClick={() => setIsCreateTicketOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Create Ticket
                </button>
              )}
            </div>
          </div>
        )}

        {/* User Stories View */}
        {currentView === 'user-stories' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1"></div>
              <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
            </div>
            <UserStoriesTab
              projectId={projectId}
              userRole={userRole}
              features={displayData.features}
            />
          </div>
        )}

        {/* Gantt View */}
        {currentView === 'gantt' && (
          <GanttView
            features={displayData.features}
            onTaskClick={handleFeatureClick}
          />
        )}

        {/* Backlog/Kanban View */}
        {currentView === 'backlog' && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
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
            <DragOverlay>
              {activeFeature ? (
                <div className="opacity-50">
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
      </main>

      {selectedFeature && (
        <FeatureModal
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          feature={selectedFeature}
          projectId={displayData.project._id || displayData.project.id}
          feedback={displayData.feedbackByFeature[selectedFeature._id || selectedFeature.id] || []}
          userRole={userRole}
          canEdit={canEdit}
          canApprove={canApprove}
          project={displayData.project}
          features={displayData.features}
          onFeatureUpdate={() => {
            refetch()
            setSelectedFeature(null)
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

