'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Plus, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ROLES } from '@/lib/constants'
import ProjectCard from './ProjectCard'
import CreateProjectModal from '../modals/CreateProjectModal'
import type { ProjectResponse } from '@/types'

/* ---------------------- BENTO GRID COMPONENT ---------------------- */
function BentoGrid({ projects }: { projects: ProjectResponse[] }) {
  const organizedProjects = useMemo(() => {
    const highRisk = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === 'high')
    const mediumRisk = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === 'medium')
    const lowRisk = projects.filter(p => (p.roadmap?.riskLevel?.toLowerCase() || 'low') === 'low')
    return { highRisk, mediumRisk, lowRisk }
  }, [projects])

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
        <div
          className={`w-full h-full relative overflow-hidden rounded-[18px] ${
            !imageUrl ? `bg-gradient-to-br ${gradient}` : ''
          }`}
        >
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
            <p className="text-white font-medium line-clamp-2 text-sm">{project.name}</p>
          </div>
        </div>
      </a>
    )
  }

  const gridItems: Array<{ project: ProjectResponse; size: 'large' | 'medium-vertical' | 'medium-square' | 'small'; gridClass: string }> = []
  organizedProjects.highRisk.forEach((project, index) => {
    gridItems.push({
      project,
      size: index === 0 ? 'large' : 'medium-square',
      gridClass: index === 0 ? 'col-span-2' : 'col-span-1',
    })
  })
  organizedProjects.mediumRisk.forEach((project, index) => {
    gridItems.push({
      project,
      size: gridItems.length === 0 && index === 0 ? 'large' : 'medium-square',
      gridClass: gridItems.length === 0 && index === 0 ? 'col-span-2' : 'col-span-1',
    })
  })
  organizedProjects.lowRisk.forEach((project) => {
    gridItems.push({ project, size: 'small', gridClass: 'col-span-1' })
  })

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {gridItems.map(({ project, size, gridClass }) =>
        renderProjectTile(project, size, gridClass)
      )}
    </div>
  )
}

/* ---------------------- DASHBOARD CLIENT ---------------------- */
interface DashboardClientProps {
  projects?: ProjectResponse[]
  userRole?: string
}

export default function DashboardClient({
  projects: initialProjects = [],
  userRole,
}: DashboardClientProps) {
  const { user, isLoading } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState<ProjectResponse[]>(initialProjects || [])
  const canCreateProject = userRole === ROLES.PM || userRole === ROLES.ADMIN

  // Realtime updates
  useEffect(() => {
    if (Array.isArray(initialProjects)) setProjects(initialProjects)
    else setProjects([])

    const projectsChannel = supabase
      .channel('dashboard-projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async () => {
        try {
          const response = await fetch('/api/projects')
          const responseData = await response.json()
          if (response.ok && responseData.success) {
            const data = responseData.data
            setProjects(Array.isArray(data?.projects) ? data.projects : [])
          }
        } catch (error) {
          console.error('Error refreshing projects:', error)
        }
      })
      .subscribe()

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
      {/* Header */}
      <header className="bg-[#f5f5f5] border-b border-[#d9d9d9] h-16 flex items-center px-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-6 h-6 relative flex-shrink-0 rounded-md overflow-hidden">
            <Image src="/bee_logo.png" alt="ProductBee Logo" fill className="object-contain" sizes="24px" />
          </div>
          <span className="text-[#0d0d0d] text-sm font-medium">ProductBee.</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-96 bg-[#f2f2f2] border-r border-[#d9d9d9] flex flex-col overflow-y-auto">
          {/* Username dropdown on hover */}
          {user && (
            <div className="p-4 pb-0">
              <div className="bg-white rounded-[16px] shadow-soft p-4 flex flex-col items-center gap-3">
                {/* Username dropdown that stays open when hovering over menu */}
                <div className="flex justify-end w-full">
                  <div className="relative inline-block group">
                    {/* The hover wrapper keeps dropdown open while moving to it */}
                    <div className="flex flex-col items-end">
                      <button className="flex items-center gap-2 px-4 py-2 bg-[#a855f7]/10 text-[#a855f7] rounded-full text-sm font-medium hover:bg-[#a855f7]/20 transition">
                        {user.name || user.email}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-[#e5e5e5] rounded-[12px] shadow-lg opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all duration-150 ease-out pointer-events-none group-hover:pointer-events-auto z-50">
                        <a
                          href="/api/auth/logout"
                          className="block px-4 py-2 text-sm text-[#a855f7] hover:bg-[#f5f5f5] rounded-[12px]"
                        >
                          Log out
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project cards */}
          <div className="flex-1 p-4 space-y-4">
            {projects?.length ? (
              projects.map((project) => (
                <ProjectCard key={project._id || project.id} project={project} />
              ))
            ) : (
              <div className="bg-white rounded-card shadow-soft p-6 text-center">
                <p className="text-[#404040] text-sm mb-4">
                  No projects yet. Create your first project to get started!
                </p>
              </div>
            )}
          </div>

          {/* Sidebar bottom */}
          <div className="mt-auto p-4 border-t border-[#d9d9d9] bg-white flex items-center justify-between">
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
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-white">
          {/* Project button in white container, matching sidebar username card */}
          <div className="p-4 border-[#e5e5e5]">
            <div className="bg-white rounded-[16px] shadow-soft p-4 flex-start">
              <button className="flex items-center gap-2 px-5 py-2 bg-[#a855f7]/10 text-[#a855f7] rounded-full text-sm font-medium hover:bg-[#a855f7]/20 transition">
                Projects
              </button>
            </div>
          </div>


          <div className="p-8">
            {projects?.length ? (
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

      {/* Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          fetch('/api/projects')
            .then((res) => res.json())
            .then((responseData) => {
              if (responseData.success && responseData.data) {
                const data = responseData.data
                setProjects(Array.isArray(data.projects) ? data.projects : [])
              } else setProjects([])
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
