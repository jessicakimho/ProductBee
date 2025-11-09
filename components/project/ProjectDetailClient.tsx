'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ArrowLeft, ChevronRight } from 'lucide-react'
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
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

// Feature status columns
const columns = [
  { id: 'backlog' as const, title: 'Backlog' },
  { id: 'active' as const, title: 'In Progress' },
  { id: 'blocked' as const, title: 'Blocked' },
  { id: 'complete' as const, title: 'Complete' },
]

// Generate a gradient color based on project ID
const getProjectGradient = (id: string) => {
  const gradients = [
    'from-blue-200 via-blue-300 to-green-200',
    'from-yellow-200 via-orange-200 to-pink-200',
    'from-green-200 via-emerald-200 to-teal-200',
    'from-pink-200 via-purple-200 to-indigo-200',
    'from-orange-200 via-red-200 to-pink-200',
  ]
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length
  return gradients[index]
}

export default function ProjectDetailClient({
  projectData: initialData,
  userRole,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const { user } = useUser()
  const [selectedFeature, setSelectedFeature] = useState<FeatureResponse | null>(null)
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  
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
  const canEdit = !isViewer
  const canApprove = isPMOrAdmin

  const handleFeatureClick = (feature: FeatureResponse) => {
    setSelectedFeature(feature)
  }

  const handleFeatureUpdate = async (featureId: string, newStatus: FeatureResponse['status']) => {
    if (isViewer) {
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
  const gradient = getProjectGradient(projectId)

  // Filter features by selected status
  const filteredFeatures = selectedStatus
    ? displayData.features.filter((f) => f.status === selectedStatus)
    : displayData.features

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Header */}
      <header className="bg-[#f5f5f5] border-b border-[#d9d9d9] h-16 flex items-center px-6">
        <div className="flex items-center gap-3 flex-1">
          {/* Bee Logo - Rounded Container */}
          <div className="w-6 h-6 relative flex-shrink-0 rounded-md overflow-hidden">
            <Image
              src="/bee_logo.png"
              alt="ProductBee Logo"
              fill
              className="object-contain"
              sizes="24px"
            />
          </div>
          <span className="text-[#0d0d0d] text-sm">...</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="px-4 py-2 bg-[#a855f7] rounded-full text-white text-sm font-medium">
              {user.name || user.email}
            </div>
          )}
          <span className="text-[#0d0d0d] text-2xl font-bold">Roadmap</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <aside className="w-96 bg-[#f2f2f2] border-r border-[#d9d9d9] flex flex-col overflow-y-auto">
          {/* Project Details Card */}
          <div className="p-4">
            <div className="bg-white rounded-card shadow-soft overflow-hidden">
              {/* Project Image/Background */}
              <div className={`h-64 relative overflow-hidden ${!displayData.project.roadmap?.imageUrl ? `bg-gradient-to-br ${gradient}` : ''}`}>
                {displayData.project.roadmap?.imageUrl && (
                  <Image
                    src={displayData.project.roadmap.imageUrl}
                    alt={displayData.project.name}
                    fill
                    className="object-cover scale-110"
                    sizes="384px"
                  />
                )}
                <button
                  onClick={() => router.push('/dashboard')}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10">
                  <h1 className="text-white font-bold text-2xl leading-tight mb-2">
                    {displayData.project.name}
                  </h1>
                </div>
              </div>
              
              {/* Description */}
              <div className="p-4">
                <p className="text-[#404040] text-sm mb-4 line-clamp-3">
                  {displayData.project.description || 'No description available.'}
                </p>
                
                {/* Risk Level and Creator Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      riskColors[riskLevel] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {displayData.project.roadmap.riskLevel || 'Low'} Risk
                  </span>
                  {displayData.project.createdBy && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {displayData.project.createdBy.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Filters */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {columns.map((column) => {
                const count = getFeaturesByStatus(column.id).length
                const isSelected = selectedStatus === column.id
                return (
                  <button
                    key={column.id}
                    onClick={() => setSelectedStatus(isSelected ? null : column.id)}
                    className={`px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-white border border-[#d9d9d9] text-[#0d0d0d] shadow-soft'
                        : 'bg-white border border-[#d9d9d9] text-[#404040] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {column.title}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-auto p-4 border-t border-[#d9d9d9] bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[#a855f7] italic font-medium text-sm">ProductBee</span>
              {!isViewer && (
                <button
                  onClick={() => setIsCreateTicketOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#d9d9d9] text-[#0d0d0d] rounded-full text-sm font-medium hover:bg-[#c9c9c9] transition-colors"
                >
                  <span className="text-lg">+</span>
                  Project
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area - Roadmap */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-8">
            {/* Roadmap View */}
            {currentView === 'gantt' ? (
              <GanttView
                features={filteredFeatures}
                onTaskClick={handleFeatureClick}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {columns.map((column) => {
                  const features = getFeaturesByStatus(column.id)
                  return (
                    <div
                      key={column.id}
                      className="bg-white rounded-card shadow-soft p-4"
                    >
                      <h3 className="font-semibold text-[#0d0d0d] mb-4">
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
                          <div className="text-center py-8 text-[#404040] text-sm">
                            No features
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

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
