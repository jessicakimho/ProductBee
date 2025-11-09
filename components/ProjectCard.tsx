'use client'

import Link from 'next/link'
import { Calendar, AlertCircle } from 'lucide-react'

interface ProjectCardProps {
  project: {
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
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const riskStyles: Record<string, string> = {
    low: 'bg-white/60',
    medium: 'bg-white/40',
    high: 'bg-white/20',
  }

  return (
    <Link href={`/project/${project._id}`}>
      <div className="card p-8 cursor-pointer transition-all hover:shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-semibold tracking-tight">
            {project.name}
          </h3>
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              riskStyles[project.roadmap.riskLevel.toLowerCase()] || 'bg-white/60'
            }`}
            style={{ color: 'var(--text-muted)' }}
          >
            {project.roadmap.riskLevel}
          </span>
        </div>
        <p className="mb-6 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
          {project.description}
        </p>
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
          {project.createdBy && (
            <span>By {project.createdBy.name}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

