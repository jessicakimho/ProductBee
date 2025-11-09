'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ROLES } from '@/lib/constants'
import CreateProjectModal from '../modals/CreateProjectModal'
import type { ProjectResponse } from '@/types'

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

// Bento Grid Component
function BentoGrid({ projects }: { projects: ProjectResponse[] }) {
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
      <a
        key={project._id || project.id}
        href={`/project/${project._id || project.id}`}
        className={`${sizeClasses[size]} h-[32vw] bg-white rounded-[18px] shadow-soft overflow-hidden cursor-pointer hover:shadow-lg transition-all group block`}
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
      </a>
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

interface DashboardClientProps {
  projects?: ProjectResponse[]
  userRole?: string
}

export default function DashboardClient({ projects: initialProjects = [], userRole }: DashboardClientProps) {
  const { user, isLoading } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectResponse[]>(initialProjects || [])

  // Check if user can create projects (PM or Admin only)
  const canCreateProject = userRole === ROLES.PM || userRole === ROLES.ADMIN

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
          <span className="text-[#0d0d0d] text-sm">Is...</span>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="px-4 py-2 bg-[#a855f7] rounded-full text-white text-sm font-medium">
              {user.name || user.email}
            </div>
          )}
          <span className="text-[#0d0d0d] text-sm font-medium">Aviary</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <aside className="w-96 bg-[#f2f2f2] border-r border-[#d9d9d9] flex flex-col overflow-y-auto">
          {/* Project Details Card */}
          {projects && projects.length > 0 ? (
            <>
              <div className="p-4">
                <div className="bg-white rounded-card shadow-soft overflow-hidden">
                  {/* Project Image/Background */}
                  {(() => {
                    const firstProject = projects[0]
                    const imageUrl = firstProject.roadmap?.imageUrl
                    const gradient = getProjectGradient(firstProject._id || firstProject.id || '')
                    return (
                      <>
                        <a href={`/project/${firstProject._id || firstProject.id}`}>
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
                        </a>
                        
                        {/* Description */}
                        <div className="p-4">
                          <p className="text-[#404040] text-sm mb-4 line-clamp-3">
                            {firstProject.description || 'No description available.'}
                          </p>
                          
                          {/* Risk Level and Creator Pills */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                riskColors[(firstProject.roadmap?.riskLevel?.toLowerCase() || 'low')] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {firstProject.roadmap?.riskLevel || 'Low'} Risk
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
                  {['High', 'Medium', 'Low'].map((risk) => {
                    const riskLower = risk.toLowerCase()
                    const count = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === riskLower).length
                    return (
                      <button
                        key={risk}
                        className="px-4 py-3 rounded-full text-sm font-medium transition-colors bg-white border border-[#d9d9d9] text-[#404040] hover:bg-[#f5f5f5]"
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

          {/* Bottom Bar with ProductBee and Create Button */}
          <div className="mt-auto p-4 border-t border-[#d9d9d9] bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[#a855f7] italic font-medium text-sm">ProductBee</span>
              {canCreateProject && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#d9d9d9] text-[#0d0d0d] rounded-full text-sm font-medium hover:bg-[#c9c9c9] transition-colors"
                >
                  <span className="text-lg">+</span>
                  Project
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-4">
            {projects && projects.length > 0 ? (
              <BentoGrid projects={projects} />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
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
    </div>
  )
}
