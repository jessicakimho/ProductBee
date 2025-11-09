'use client'

import { useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { Plus, LogOut } from 'lucide-react'
import ProjectCard from './ProjectCard'
import CreateProjectModal from './CreateProjectModal'

interface Project {
  _id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: string
  }
  createdAt: string
  createdBy?: {
    name: string
    email: string
  }
}

interface DashboardClientProps {
  projects: Project[]
}

export default function DashboardClient({ projects: initialProjects }: DashboardClientProps) {
  const { user, isLoading } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projects, setProjects] = useState(initialProjects)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-3xl font-semibold tracking-tight">
              ProductBee
            </h1>
            <div className="flex items-center gap-6">
              {user && (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {user.name || user.email}
                </span>
              )}
              <a
                href="/api/auth/logout"
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-colors hover:opacity-80"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-4xl font-semibold tracking-tight">
            Projects
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 card p-12">
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              No projects yet. Create your first project to get started!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

