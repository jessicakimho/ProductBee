'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Plus, LogOut, ArrowLeft, FolderKanban, Users, Edit2, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ROLES } from '@/lib/constants'
import CreateProjectModal from '../modals/CreateProjectModal'
import ProjectDetailContent from '../project/ProjectDetailContent'
import UserStoryForm from '../project/UserStoryForm'
import UserStoryCard from '../project/UserStoryCard'
import { useUserStories } from '@/hooks/useUserStories'
import { useUserStoryImage, useUserStoryImages } from '@/hooks/useUserStoryImage'
import type { ProjectResponse, GetProjectResponse, UserStoryResponse, CreateUserStoryRequest, UpdateUserStoryRequest } from '@/types'

// Risk level color mapping
const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

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

// User Stories Bento Grid Component
function UserStoriesBentoGrid({ 
  userStories, 
  onUserStoryClick 
}: { 
  userStories: UserStoryResponse[]
  onUserStoryClick: (userStory: UserStoryResponse) => void
}) {
  // Fetch images for all user stories
  const userStoryIds = userStories.map((us) => us.id || us._id).filter(Boolean) as string[]
  const images = useUserStoryImages(userStoryIds)

  // Render a user story tile
  const renderUserStoryTile = (
    userStory: UserStoryResponse, 
    size: 'large' | 'medium-vertical' | 'medium-square' | 'small',
    gridClass?: string
  ) => {
    const userStoryId = userStory.id || userStory._id || ''
    const imageUrl = images.get(userStoryId) || null
    const gradient = getProjectGradient(userStoryId)
    const linkedTicketsCount = userStory.linkedTicketIds?.length || 0
    
    const sizeClasses = {
      large: gridClass || 'col-span-2',
      'medium-vertical': gridClass || 'col-span-1',
      'medium-square': gridClass || 'col-span-1',
      small: gridClass || 'col-span-1',
    }

    return (
      <button
        key={userStory.id || userStory._id}
        onClick={() => onUserStoryClick(userStory)}
        className={`${sizeClasses[size]} h-[32vw] bg-white rounded-[18px] shadow-soft overflow-hidden cursor-pointer hover:shadow-lg transition-all group block text-left`}
      >
        <div className={`w-full h-full relative overflow-hidden rounded-[18px] ${
          !imageUrl ? `bg-gradient-to-br ${gradient}` : ''
        }`}>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={userStory.name}
              fill
              className="object-cover scale-110 rounded-[18px]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10 rounded-b-[18px]">
            <p className="text-white font-bold text-2xl leading-tight line-clamp-2 mb-1">
              {userStory.name}
            </p>
            <p className="text-white text-sm opacity-90 line-clamp-1">
              {userStory.role}
            </p>
            {linkedTicketsCount > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-white text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {linkedTicketsCount} ticket{linkedTicketsCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    )
  }

  // Build the grid layout with fun sizes based on linked tickets and creation date
  const gridItems: Array<{ userStory: UserStoryResponse; size: 'large' | 'medium-vertical' | 'medium-square' | 'small'; gridClass: string }> = []
  
  // Sort by linked tickets count and creation date for visual variety
  const sortedStories = [...userStories].sort((a, b) => {
    const aTickets = a.linkedTicketIds?.length || 0
    const bTickets = b.linkedTicketIds?.length || 0
    if (aTickets !== bTickets) return bTickets - aTickets
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  sortedStories.forEach((userStory, index) => {
    const linkedTicketsCount = userStory.linkedTicketIds?.length || 0
    
    if (index === 0) {
      // First story gets large tile (col-span-2)
      gridItems.push({
        userStory,
        size: 'large',
        gridClass: 'col-span-2'
      })
    } else if (linkedTicketsCount >= 5) {
      // Stories with 5+ linked tickets get large tiles (most important)
      gridItems.push({
        userStory,
        size: 'large',
        gridClass: 'col-span-2'
      })
    } else if (linkedTicketsCount >= 2) {
      // Stories with 2-4 linked tickets get medium tiles
      gridItems.push({
        userStory,
        size: 'medium-square',
        gridClass: 'col-span-1'
      })
    } else if (index % 6 === 3 || index % 6 === 5) {
      // Every 6th story (positions 3 and 5) gets large tile for visual variety
      gridItems.push({
        userStory,
        size: 'large',
        gridClass: 'col-span-2'
      })
    } else {
      // Others get small tiles
      gridItems.push({
        userStory,
        size: 'small',
        gridClass: 'col-span-1'
      })
    }
  })

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {gridItems.map(({ userStory, size, gridClass }) => 
        renderUserStoryTile(userStory, size, gridClass)
      )}
    </div>
  )
}

// Bento Grid Component
function BentoGrid({ 
  projects, 
  onProjectClick 
}: { 
  projects: ProjectResponse[]
  onProjectClick: (projectId: string) => void
}) {
  // Organize projects by risk level
  const organizedProjects = useMemo(() => {
    const highRisk = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === 'high')
    const mediumRisk = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === 'medium')
    const lowRisk = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === 'low')

    return { highRisk, mediumRisk, lowRisk }
  }, [projects])

  // Render a project tile
  const renderProjectTile = (
    project: ProjectResponse, 
    size: 'large' | 'medium-vertical' | 'medium-square' | 'small',
    gridClass?: string
  ) => {
    const imageUrl = project.roadmap?.imageUrl
    const gradient = getProjectGradient(project._id || project.id || '')
    
    const sizeClasses = {
      large: gridClass || 'col-span-2',
      'medium-vertical': gridClass || 'col-span-1',
      'medium-square': gridClass || 'col-span-1',
      small: gridClass || 'col-span-1',
    }

    return (
      <button
        key={project._id || project.id}
        onClick={() => onProjectClick(project._id || project.id)}
        className={`${sizeClasses[size]} h-[32vw] bg-white rounded-[18px] shadow-soft overflow-hidden cursor-pointer hover:shadow-lg transition-all group block text-left`}
      >
        <div className={`w-full h-full relative overflow-hidden rounded-[18px] ${
          !imageUrl ? `bg-gradient-to-br ${gradient}` : ''
        }`}>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={project.name}
              fill
              className="object-cover scale-110 rounded-[18px]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10 rounded-b-[18px]">
            <p className="text-white font-bold text-2xl leading-tight line-clamp-2">
              {project.name}
            </p>
          </div>
        </div>
      </button>
    )
  }

  // Build the grid layout matching the bento-box pattern
  // High risk = Large (col-span-2), Medium risk = Medium (col-span-1), Low risk = Small (col-span-1)
  const gridItems: Array<{ project: ProjectResponse; size: 'large' | 'medium-vertical' | 'medium-square' | 'small'; gridClass: string }> = []
  
  // First, assign high risk projects to large tiles
  organizedProjects.highRisk.forEach((project, index) => {
    if (index === 0) {
      // First high risk gets large tile (col-span-2)
      gridItems.push({
        project,
        size: 'large',
        gridClass: 'col-span-2'
      })
    } else {
      // Additional high risk projects get medium tiles
      gridItems.push({
        project,
        size: 'medium-square',
        gridClass: 'col-span-1'
      })
    }
  })
  
  // Then, assign medium risk projects to medium tiles
  organizedProjects.mediumRisk.forEach((project, index) => {
    if (index === 0 && gridItems.length === 0) {
      // If no high risk, first medium gets large
      gridItems.push({
        project,
        size: 'large',
        gridClass: 'col-span-2'
      })
    } else {
      // Medium risk get square tiles (col-span-1)
      gridItems.push({
        project,
        size: 'medium-square',
        gridClass: 'col-span-1'
      })
    }
  })
  
  // Finally, assign low risk projects to small tiles
  organizedProjects.lowRisk.forEach((project) => {
    gridItems.push({
      project,
      size: 'small',
      gridClass: 'col-span-1'
    })
  })

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {gridItems.map(({ project, size, gridClass }) => 
        renderProjectTile(project, size, gridClass)
      )}
    </div>
  )
}

type DashboardTab = 'projects' | 'user-stories'

interface DashboardClientProps {
  projects?: ProjectResponse[]
  userRole?: string
  initialProjectId?: string
  initialProjectData?: GetProjectResponse
}

// User Story Detail View Component (separated to use hooks properly)
function UserStoryDetailView({
  userStory,
  canEdit,
  onEdit,
  onDelete,
  isDeleting,
}: {
  userStory: UserStoryResponse
  canEdit: boolean
  onEdit: (userStory: UserStoryResponse) => void
  onDelete: (userStoryId: string) => void
  isDeleting: boolean
}) {
  const userStoryId = userStory.id || userStory._id || ''
  const imageUrl = useUserStoryImage(userStoryId)
  const gradient = getProjectGradient(userStoryId)
  const linkedTicketsCount = userStory.linkedTicketIds?.length || 0

  return (
    <div className="p-4 pt-2">
      <div className="bg-white rounded-card shadow-soft overflow-hidden transition-all animate-fade-in">
        {/* User Story Header */}
        <div className={`h-64 relative overflow-hidden ${!imageUrl ? `bg-gradient-to-br ${gradient}` : ''}`}>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={userStory.name}
              fill
              className="object-cover scale-110"
              sizes="384px"
            />
          )}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit(userStory)}
                  className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors"
                  title="Edit user story"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(userStoryId)}
                  className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-red-500/50 transition-colors"
                  title="Delete user story"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10">
            <h1 className="text-white font-bold text-2xl leading-tight mb-2">
              {userStory.name}
            </h1>
            <p className="text-white text-sm opacity-90 mb-2">
              {userStory.role}
            </p>
            {linkedTicketsCount > 0 && (
              <span className="inline-block text-white text-xs bg-white/20 px-3 py-1 rounded-full">
                {linkedTicketsCount} linked ticket{linkedTicketsCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* User Story Details */}
        <div className="p-4">
          <div className="space-y-4 mb-4">
            <div>
              <p className="text-xs font-medium text-[#404040] uppercase tracking-wide mb-1">Goal</p>
              <p className="text-[#0d0d0d] text-sm">
                {userStory.goal || 'No goal specified.'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-[#404040] uppercase tracking-wide mb-1">Benefit</p>
              <p className="text-[#0d0d0d] text-sm">
                {userStory.benefit || 'No benefit specified.'}
              </p>
            </div>
          </div>
          
          {/* Demographics */}
          {userStory.demographics && Object.keys(userStory.demographics).length > 0 && (
            <div className="pt-4 border-t border-[#d9d9d9]">
              <p className="text-xs font-medium text-[#404040] uppercase tracking-wide mb-2">Demographics</p>
              <div className="flex flex-wrap gap-2">
                {userStory.demographics.age && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Age: {userStory.demographics.age}
                  </span>
                )}
                {userStory.demographics.location && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {userStory.demographics.location}
                  </span>
                )}
                {userStory.demographics.technical_skill && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {userStory.demographics.technical_skill}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Created By */}
          {userStory.createdBy && (
            <div className="pt-4 border-t border-[#d9d9d9] mt-4">
              <p className="text-xs text-[#404040]">
                Created by {userStory.createdBy.name} • {new Date(userStory.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardClient({ 
  projects: initialProjects = [], 
  userRole,
  initialProjectId,
  initialProjectData,
}: DashboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUserStoryModalOpen, setIsUserStoryModalOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectResponse[]>(initialProjects || [])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId || null)
  const [projectData, setProjectData] = useState<GetProjectResponse | null>(initialProjectData || null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)
  const [selectedUserStory, setSelectedUserStory] = useState<UserStoryResponse | null>(null)
  const [editingUserStory, setEditingUserStory] = useState<UserStoryResponse | null>(null)

  // Tab state with localStorage persistence
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardTabPreference')
      return (saved === 'projects' || saved === 'user-stories') ? saved : 'projects'
    }
    return 'projects'
  })

  // Save tab preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardTabPreference', activeTab)
    }
  }, [activeTab])

  // User stories hook
  const {
    userStories,
    isLoading: isLoadingUserStories,
    fetchUserStories,
    createUserStory,
    updateUserStory,
    deleteUserStory,
    assignUserStoryToTicket,
    unassignUserStoryFromTicket,
    isCreating: isCreatingUserStory,
    isUpdating: isUpdatingUserStory,
    isDeleting: isDeletingUserStory,
    isAssigning: isAssigningUserStory,
  } = useUserStories()

  // Fetch user stories on mount
  useEffect(() => {
    fetchUserStories()
  }, [fetchUserStories])

  // Auto-select first user story when switching to User Stories tab and no story is selected
  useEffect(() => {
    if (activeTab === 'user-stories' && !selectedUserStory && userStories.length > 0) {
      setSelectedUserStory(userStories[0])
    }
  }, [activeTab, selectedUserStory, userStories])

  // Check if user can create projects (PM or Admin only)
  const canCreateProject = userRole === ROLES.PM || userRole === ROLES.ADMIN
  const canEditUserStories = userRole === ROLES.PM || userRole === ROLES.ADMIN

  // Track current project data ID to avoid unnecessary fetches
  const currentProjectDataId = useRef<string | null>(null)

  // Initialize project data from props
  useEffect(() => {
    if (initialProjectId && initialProjectData) {
      setSelectedProjectId(initialProjectId)
      setProjectData(initialProjectData)
      currentProjectDataId.current = initialProjectId
      // Switch to Projects tab when a project is opened
      setActiveTab('projects')
    }
  }, [initialProjectId, initialProjectData])

  // Fetch project data
  const fetchProjectData = useCallback(async (projectId: string) => {
    // Don't fetch if we already have data for this project
    if (currentProjectDataId.current === projectId) {
      return
    }
    
    setIsLoadingProject(true)
    try {
      const response = await fetch(`/api/project/${projectId}`)
      const responseData = await response.json()
      
      if (response.ok && responseData.success) {
        setProjectData(responseData.data)
        currentProjectDataId.current = projectId
      } else {
        console.error('Error fetching project:', responseData.error)
        setProjectData(null)
        currentProjectDataId.current = null
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setProjectData(null)
      currentProjectDataId.current = null
    } finally {
      setIsLoadingProject(false)
    }
  }, [])

  // Extract project ID from pathname and sync with state
  useEffect(() => {
    const pathMatch = pathname?.match(/^\/project\/([^/]+)$/)
    if (pathMatch && pathMatch[1]) {
      const projectIdFromPath = pathMatch[1]
      if (projectIdFromPath !== selectedProjectId) {
        setSelectedProjectId(projectIdFromPath)
        // Switch to Projects tab when navigating to a project
        setActiveTab('projects')
        // Fetch project data if we don't have it from initial props
        if (!initialProjectData || (initialProjectData.project._id !== projectIdFromPath && initialProjectData.project.id !== projectIdFromPath)) {
          fetchProjectData(projectIdFromPath)
        } else {
          // Update ref if we have initial data
          currentProjectDataId.current = projectIdFromPath
        }
      }
    } else if (pathname === '/dashboard' && selectedProjectId) {
      // Don't clear selectedProjectId when on dashboard - let user switch tabs
      // Only clear if they explicitly go back
    }
  }, [pathname, selectedProjectId, initialProjectData, fetchProjectData])

  // Handle project click
  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId)
    setActiveTab('projects') // Switch to Projects tab when clicking a project
    router.push(`/project/${projectId}`)
  }

  // Get selected project for left container display
  const selectedProject = useMemo(() => {
    // Only show project if Projects tab is active
    if (activeTab !== 'projects') return null
    
    // If we have a selected project ID and project data, use that
    if (selectedProjectId && projectData) {
      return projectData.project
    }
    // If we have a selected project ID but no full data yet, try to find it in projects list
    if (selectedProjectId) {
      const found = projects.find(p => (p._id || p.id) === selectedProjectId)
      if (found) return found
    }
    // Otherwise, show first project or null
    return projects[0] || null
  }, [selectedProjectId, projectData, projects, activeTab])

  // Handle user story operations
  const handleCreateUserStory = async (data: CreateUserStoryRequest | UpdateUserStoryRequest) => {
    if (editingUserStory) {
      // Update existing user story
      await updateUserStory(editingUserStory.id || editingUserStory._id, data as UpdateUserStoryRequest)
      setEditingUserStory(null)
      setIsUserStoryModalOpen(false)
    } else {
      // Create new user story
      await createUserStory(data as CreateUserStoryRequest)
      setIsUserStoryModalOpen(false)
    }
    await fetchUserStories()
  }

  const handleDeleteUserStory = async (userStoryId: string) => {
    if (confirm('Are you sure you want to delete this user story? This will unlink it from all tickets.')) {
      const success = await deleteUserStory(userStoryId)
      if (success) {
        if (selectedUserStory && (selectedUserStory.id === userStoryId || selectedUserStory._id === userStoryId)) {
          setSelectedUserStory(null)
        }
        await fetchUserStories()
      }
    }
  }

  const handleEditUserStory = (userStory: UserStoryResponse) => {
    setEditingUserStory(userStory)
    setIsUserStoryModalOpen(true)
  }

  const handleUserStoryClick = (userStory: UserStoryResponse) => {
    setSelectedUserStory(userStory)
  }

  // Get selected user story for left container display
  const displayUserStory = useMemo(() => {
    if (activeTab !== 'user-stories') return null
    return selectedUserStory || null
  }, [activeTab, selectedUserStory])

  const handleLinkTicket = async (userStoryId: string, ticketId: string) => {
    await assignUserStoryToTicket(ticketId, userStoryId)
    await fetchUserStories()
    // Refresh selected user story if it's the one being updated
    if (selectedUserStory && (selectedUserStory.id === userStoryId || selectedUserStory._id === userStoryId)) {
      const updated = userStories.find(us => (us.id === userStoryId || us._id === userStoryId))
      if (updated) setSelectedUserStory(updated)
    }
  }

  const handleUnlinkTicket = async (userStoryId: string, ticketId: string) => {
    await unassignUserStoryFromTicket(ticketId, userStoryId)
    await fetchUserStories()
    // Refresh selected user story if it's the one being updated
    if (selectedUserStory && (selectedUserStory.id === userStoryId || selectedUserStory._id === userStoryId)) {
      const updated = userStories.find(us => (us.id === userStoryId || us._id === userStoryId))
      if (updated) setSelectedUserStory(updated)
    }
  }

  // Calculate project statistics
  const projectStats = useMemo(() => {
    if (!projectData || !projectData.features) {
      return null
    }
    
    const features = projectData.features
    
    // Helper function to count features by status (handles both DB and API formats)
    const countByStatus = (statusValues: string[]) => {
      return features.filter(f => statusValues.includes(f.status)).length
    }
    
    // Helper function to count features by priority (handles both DB and API formats)
    const countByPriority = (priorityValues: string[]) => {
      return features.filter(f => priorityValues.includes(f.priority)).length
    }
    
    return {
      totalTickets: features.length,
      byStatus: {
        backlog: countByStatus(['not_started', 'backlog']),
        inProgress: countByStatus(['in_progress', 'active']),
        blocked: countByStatus(['blocked']),
        complete: countByStatus(['complete']),
      },
      uniqueAssignees: new Set(
        features.filter(f => f.assignedTo).map(f => f.assignedTo)
      ).size,
      unassignedCount: features.filter(f => !f.assignedTo).length,
      byPriority: {
        p0: countByPriority(['P0', 'critical']),
        p1: countByPriority(['P1', 'high']),
        p2: countByPriority(['P2', 'medium']),
      },
    }
  }, [projectData])

  // Real-time subscription for projects
  useEffect(() => {
    // Ensure we always have an array
    if (Array.isArray(initialProjects)) {
      setProjects(initialProjects)
    } else {
      setProjects([])
    }

    const projectsChannel = supabase
      .channel('dashboard-projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        async () => {
          // Refresh projects list when changes occur
          try {
            const response = await fetch('/api/projects')
            const responseData = await response.json()
            
            if (response.ok && responseData.success) {
              // Handle wrapped response: { success: true, data: { projects: [...] } }
              const data = responseData.data
              // Ensure we always set an array
              if (Array.isArray(data?.projects)) {
                setProjects(data.projects)
              } else {
                setProjects([])
              }
            }
          } catch (error) {
            console.error('Error refreshing projects:', error)
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(projectsChannel)
    }
  }, [initialProjects])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Top Header */}
      <header className="bg-[#f5f5f5] border-b border-[#d9d9d9] h-16 flex items-center px-6">
        <div className="flex items-center gap-3 flex-1">
          {/* Bee Logo - Rounded Container - Clickable */}
          <button
            onClick={() => {
              setSelectedProjectId(null)
              router.push('/dashboard')
            }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 relative flex-shrink-0 rounded-md overflow-hidden">
              <Image
                src="/bee_logo.png"
                alt="ProductBee Logo"
                fill
                className="object-contain"
                sizes="24px"
              />
            </div>
            <span className="text-[#0d0d0d] text-sm font-medium">ProductBee</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="px-4 py-2 bg-[#a855f7] rounded-full text-white text-sm font-medium">
              {user.name || user.email}
            </div>
          )}
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 px-4 py-2 bg-[#d9d9d9] text-[#0d0d0d] rounded-full text-sm font-medium hover:bg-[#c9c9c9] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </a>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <aside className="w-96 bg-[#f2f2f2] border-r border-[#d9d9d9] flex flex-col overflow-y-auto">
          {/* Back Button - Show when project is selected and not on dashboard route */}
          {selectedProject && pathname !== '/dashboard' && activeTab === 'projects' && (
            <div className="p-4 pb-2">
              <button
                onClick={() => {
                  setSelectedProjectId(null)
                  router.push('/dashboard')
                }}
                className="flex items-center gap-2 px-4 py-2 text-[#404040] hover:text-[#0d0d0d] hover:bg-white rounded-full transition-colors w-full justify-start"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
            </div>
          )}
          
          {/* User Stories View in Left Container */}
          {activeTab === 'user-stories' && displayUserStory ? (
            <UserStoryDetailView
              userStory={displayUserStory}
              canEdit={canEditUserStories}
              onEdit={handleEditUserStory}
              onDelete={handleDeleteUserStory}
              isDeleting={isDeletingUserStory}
            />
          ) : activeTab === 'user-stories' && userStories.length > 0 && !displayUserStory ? (
            <div className="p-4">
              <div className="bg-white rounded-card shadow-soft p-6 text-center">
                <Users className="w-12 h-12 text-[#404040] mx-auto mb-4 opacity-50" />
                <p className="text-[#404040] text-sm mb-2">Select a user story</p>
                <p className="text-xs text-[#404040] opacity-75">
                  Click on a user story from the grid to view details
                </p>
              </div>
            </div>
          ) : activeTab === 'user-stories' && userStories.length === 0 ? (
            <div className="p-4">
              <div className="bg-white rounded-card shadow-soft p-6 text-center">
                <p className="text-[#404040] text-sm mb-4">
                  No user stories yet. Create your first user story to get started!
                </p>
              </div>
            </div>
          ) : selectedProject ? (
            <>
              {/* Project Details Card */}
              <div className="p-4 pt-2">
                <div className="bg-white rounded-card shadow-soft overflow-hidden transition-all animate-fade-in">
                  {/* Project Image/Background */}
                  {(() => {
                    const imageUrl = selectedProject.roadmap?.imageUrl
                    const gradient = getProjectGradient(selectedProject._id || selectedProject.id || '')
                    const riskLevel = selectedProject.roadmap?.riskLevel?.toLowerCase() || 'low'
                    return (
                      <>
                        <div className={`h-64 relative overflow-hidden ${!imageUrl ? `bg-gradient-to-br ${gradient}` : ''}`}>
                          {imageUrl && (
                            <Image
                              src={imageUrl}
                              alt={selectedProject.name}
                              fill
                              className="object-cover scale-110"
                              sizes="384px"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10">
                            <h1 className="text-white font-bold text-2xl leading-tight mb-2">
                              {selectedProject.name}
                            </h1>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <div className="p-4">
                          <p className="text-[#404040] text-sm mb-4 line-clamp-3">
                            {selectedProject.description || 'No description available.'}
                          </p>
                          
                          {/* Risk Level and Creator Pills */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                riskColors[riskLevel] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {riskLevel} risk
                            </span>
                            {selectedProject.createdBy && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {selectedProject.createdBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Project Statistics - Show when project is selected */}
              {projectStats && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-white rounded-card shadow-soft p-4">
                    <h3 className="text-sm font-semibold text-[#0d0d0d] mb-3">Project Statistics</h3>
                    <div className="space-y-3">
                      {/* Total Tickets */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#404040]">Total Tickets</span>
                        <span className="text-sm font-semibold text-[#0d0d0d]">
                          {projectStats.totalTickets}
                        </span>
                      </div>
                      
                      {/* Tickets by Status */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-[#404040] uppercase tracking-wide">
                          By Status
                        </div>
                        {[
                          { label: 'Backlog', count: projectStats.byStatus.backlog, color: 'text-gray-600' },
                          { label: 'In Progress', count: projectStats.byStatus.inProgress, color: 'text-blue-600' },
                          { label: 'Blocked', count: projectStats.byStatus.blocked, color: 'text-orange-600' },
                          { label: 'Complete', count: projectStats.byStatus.complete, color: 'text-green-600' },
                        ].map(({ label, count, color }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className={`text-xs ${color}`}>{label}</span>
                            <span className="text-xs font-medium text-[#0d0d0d]">{count}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Assignees */}
                      <div className="pt-2 border-t border-[#d9d9d9]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#404040]">Assigned To</span>
                          <span className="text-sm font-semibold text-[#0d0d0d]">
                            {projectStats.uniqueAssignees}
                          </span>
                        </div>
                        <div className="text-xs text-[#404040] mt-1">
                          {projectStats.unassignedCount} unassigned
                        </div>
                      </div>
                      
                      {/* Priority Breakdown */}
                      <div className="pt-2 border-t border-[#d9d9d9]">
                        <div className="text-xs font-medium text-[#404040] uppercase tracking-wide mb-2">
                          Priority
                        </div>
                        <div className="space-y-1">
                          {[
                            { label: 'P0', count: projectStats.byPriority.p0, color: 'text-red-600' },
                            { label: 'P1', count: projectStats.byPriority.p1, color: 'text-orange-600' },
                            { label: 'P2', count: projectStats.byPriority.p2, color: 'text-blue-600' },
                          ].map(({ label, count, color }) => (
                            <div key={label} className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${color}`}>{label}</span>
                              <span className="text-xs text-[#0d0d0d]">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : projects && projects.length > 0 ? (
            <>
              <div className="p-4">
                <div className="bg-white rounded-card shadow-soft overflow-hidden">
                  {/* Project Image/Background */}
                  {(() => {
                    const firstProject = projects[0]
                    const imageUrl = firstProject.roadmap?.imageUrl
                    const gradient = getProjectGradient(firstProject._id || firstProject.id || '')
                    const riskLevel = firstProject.roadmap?.riskLevel?.toLowerCase() || 'low'
                    return (
                      <>
                        <button
                          onClick={() => handleProjectClick(firstProject._id || firstProject.id)}
                          className="w-full"
                        >
                          <div className={`h-64 relative overflow-hidden cursor-pointer ${!imageUrl ? `bg-gradient-to-br ${gradient}` : ''}`}>
                            {imageUrl && (
                              <Image
                                src={imageUrl}
                                alt={firstProject.name}
                                fill
                                className="object-cover scale-110"
                                sizes="384px"
                              />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10">
                              <h1 className="text-white font-bold text-2xl leading-tight mb-2">
                                {firstProject.name}
                              </h1>
                            </div>
                          </div>
                        </button>
                        
                        {/* Description */}
                        <div className="p-4">
                          <p className="text-[#404040] text-sm mb-4 line-clamp-3">
                            {firstProject.description || 'No description available.'}
                          </p>
                          
                          {/* Risk Level and Creator Pills */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                riskColors[riskLevel] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {riskLevel} risk
                            </span>
                            {firstProject.createdBy && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {firstProject.createdBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Risk Level Filters */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {['high', 'medium', 'low'].map((risk) => {
                    const count = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === risk).length
                    return (
                      <button
                        key={risk}
                        onClick={() => {
                          // Find first project with this risk level and select it
                          const projectWithRisk = projects.find(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === risk)
                          if (projectWithRisk) {
                            handleProjectClick(projectWithRisk._id || projectWithRisk.id)
                          }
                        }}
                        className="px-4 py-3 rounded-full text-sm font-medium transition-colors bg-white border border-[#d9d9d9] text-[#404040] hover:bg-[#f5f5f5] capitalize"
                      >
                        {risk}
                        {count > 0 && <span className="ml-1">({count})</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-4">
              <div className="bg-white rounded-card shadow-soft p-6 text-center">
                <p className="text-[#404040] text-sm mb-4">
                  No projects yet. Create your first project to get started!
                </p>
              </div>
            </div>
          )}

          {/* Bottom Bar with ProductBee and Create Buttons */}
          <div className="mt-auto p-4 border-t border-[#d9d9d9] bg-white">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedProjectId(null)
                  router.push('/dashboard')
                }}
                className="text-[#a855f7] italic font-medium text-sm hover:underline"
              >
                ProductBee
              </button>
              <div className="flex items-center gap-2">
                {canEditUserStories && (
                  <button
                    onClick={() => {
                      setEditingUserStory(null)
                      setIsUserStoryModalOpen(true)
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-[#d9d9d9] text-[#0d0d0d] rounded-full text-sm font-medium hover:bg-[#c9c9c9] transition-colors"
                  >
                    <span className="text-lg">+</span>
                    User Story
                  </button>
                )}
                {canCreateProject && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-2 bg-[#d9d9d9] text-[#0d0d0d] rounded-full text-sm font-medium hover:bg-[#c9c9c9] transition-colors"
                  >
                    <span className="text-lg">+</span>
                    Project
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden bg-white flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-[#d9d9d9] bg-white flex-shrink-0">
            <div className="flex items-center px-4">
              <button
                onClick={() => {
                  setActiveTab('projects')
                  setSelectedUserStory(null)
                }}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium text-sm ${
                  activeTab === 'projects'
                    ? 'border-[#a855f7] text-[#a855f7]'
                    : 'border-transparent text-[#404040] hover:text-[#0d0d0d]'
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                Projects
              </button>
              <button
                onClick={() => {
                  setActiveTab('user-stories')
                  // Don't clear selectedProjectId - it will persist and show again when switching back to Projects tab
                }}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors font-medium text-sm ${
                  activeTab === 'user-stories'
                    ? 'border-[#a855f7] text-[#a855f7]'
                    : 'border-transparent text-[#404040] hover:text-[#0d0d0d]'
                }`}
              >
                <Users className="w-4 h-4" />
                User Stories
              </button>
            </div>
          </div>

          {/* Content Based on Tab */}
          {activeTab === 'projects' ? (
            <>
              {selectedProjectId && projectData && !isLoadingProject ? (
                <div className="flex-1 overflow-hidden animate-fade-in">
                  <ProjectDetailContent
                    projectId={selectedProjectId}
                    initialData={projectData}
                    userRole={userRole}
                  />
                </div>
              ) : selectedProjectId && isLoadingProject ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-[#404040]">Loading project...</div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4">
                  {projects && projects.length > 0 ? (
                    <div className="animate-fade-in">
                      <BentoGrid projects={projects} onProjectClick={handleProjectClick} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <div className="text-center animate-fade-in">
                        <p className="text-[#404040] text-lg mb-4">
                          {canCreateProject 
                            ? 'No projects yet. Create your first project to get started!'
                            : 'No projects available.'}
                        </p>
                        {canCreateProject && (
                          <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors shadow-soft"
                          >
                            <Plus className="w-5 h-5" />
                            Create Project
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* User Stories View in Right Container - Bento Grid */
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingUserStories && userStories.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a855f7] mx-auto mb-4"></div>
                    <p className="text-[#404040]">Loading user stories...</p>
                  </div>
                </div>
              ) : userStories.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <Users className="w-12 h-12 text-[#404040] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#0d0d0d] mb-2">No user stories yet</h3>
                    <p className="text-sm text-[#404040] mb-6">
                      Create user stories to define personas and link them to tickets across all your projects
                    </p>
                    {canEditUserStories && (
                      <button
                        onClick={() => {
                          setEditingUserStory(null)
                          setIsUserStoryModalOpen(true)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#a855f7] text-white rounded-full hover:bg-[#9333ea] transition-colors shadow-soft"
                      >
                        <Plus className="w-5 h-5" />
                        Create Your First User Story
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <UserStoriesBentoGrid 
                    userStories={userStories} 
                    onUserStoryClick={handleUserStoryClick}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          // Refresh projects after modal closes
          fetch('/api/projects')
            .then((res) => res.json())
            .then((responseData) => {
              // Handle wrapped response: { success: true, data: { projects: [...] } }
              if (responseData.success && responseData.data) {
                const data = responseData.data
                // Ensure we always set an array
                if (Array.isArray(data.projects)) {
                  setProjects(data.projects)
                } else {
                  setProjects([])
                }
              } else {
                setProjects([])
              }
            })
            .catch((error) => {
              console.error('Error refreshing projects:', error)
              setProjects([])
            })
        }}
      />

      <UserStoryForm
        isOpen={isUserStoryModalOpen}
        onClose={() => {
          setIsUserStoryModalOpen(false)
          setEditingUserStory(null)
        }}
        userStory={editingUserStory}
        onSubmit={handleCreateUserStory}
        isSubmitting={isCreatingUserStory || isUpdatingUserStory}
      />
    </div>
  )
}
