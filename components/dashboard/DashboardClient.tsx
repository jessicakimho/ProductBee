'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Plus, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ROLES } from '@/lib/constants'
import ProjectCard from './ProjectCard'
import CreateProjectModal from '../modals/CreateProjectModal'
import type { ProjectResponse } from '@/types'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ProductBee
            </h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user.name || user.email}
                </span>
              )}
              <a
                href="/api/auth/logout"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h2>
          {canCreateProject && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          )}
        </div>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {canCreateProject 
                ? 'No projects yet. Create your first project to get started!'
                : 'No projects available.'}
            </p>
            {canCreateProject && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects && projects.map((project) => (
              <ProjectCard key={project._id || project.id} project={project} />
            ))}
          </div>
        )}
      </main>

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

