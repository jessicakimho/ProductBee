'use client'

import Link from 'next/link'
import { Calendar, AlertCircle } from 'lucide-react'
/*jhebfjhf*/
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
  const riskColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  return (
    <Link href={`/project/${project._id}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {project.name}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              riskColors[project.roadmap.riskLevel.toLowerCase()] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {project.roadmap.riskLevel}
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {project.description}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
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

