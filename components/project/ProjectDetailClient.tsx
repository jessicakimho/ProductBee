'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { ROLES } from '@/lib/constants'
import { useProject } from '@/hooks/useProject'
import { useFeature } from '@/hooks/useFeature'
import FeatureCard from './FeatureCard'
import FeatureModal from './FeatureModal'
import TicketCreateForm from './TicketCreateForm'
import GanttView from './GanttView'
import ViewToggle, { type ViewType } from './ViewToggle'
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

// Feature status columns
const columns = [
  { id: 'backlog' as const, title: 'Backlog' },
  { id: 'active' as const, title: 'In Progress' },
  { id: 'blocked' as const, title: 'Blocked' },
  { id: 'complete' as const, title: 'Complete' },
]

export default function ProjectDetailClient({
  projectData: initialData,
  userRole,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const { user } = useUser()
  const [selectedFeature, setSelectedFeature] = useState<FeatureResponse | null>(null)
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  
  // View state with localStorage persistence (default to 'gantt')
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectViewPreference')
      return (saved === 'gantt' || saved === 'backlog') ? saved : 'gantt'
    }
    return 'gantt'
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

  // Use hook data if available and loaded, otherwise use initial data
  const displayData = projectData && projectData.project ? projectData : initialData

  // Permission checks
  const isViewer = userRole === ROLES.VIEWER
  const isPMOrAdmin = userRole === ROLES.PM || userRole === ROLES.ADMIN
  const canEdit = !isViewer // Only viewers are read-only
  const canApprove = isPMOrAdmin // Only PM and Admin can approve proposals

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

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Roadmap Summary
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {displayData.project.roadmap.summary}
            </p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Features
          </h2>
          <div className="flex items-center gap-4">
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

        {currentView === 'gantt' ? (
          <GanttView
            features={displayData.features}
            onTaskClick={handleFeatureClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((column) => {
              const features = getFeaturesByStatus(column.id)
              return (
                <div
                  key={column.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    {column.title} ({features.length})
                  </h3>
                  <div className="space-y-3 min-h-[200px]">
                    {features.map((feature) => (
                      <FeatureCard
                        key={feature._id || feature.id}
                        feature={feature}
                        onClick={() => handleFeatureClick(feature)}
                        canEdit={canEdit}
                        onStatusChange={canEdit ? (featureId, newStatus) => handleFeatureUpdate(featureId, newStatus) : undefined}
                      />
                    ))}
                    {features.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        No features
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
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
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}

