'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import type { ProjectResponse } from '@/types'

interface ProjectCardProps {
  project: ProjectResponse
}

// Generate a gradient color based on project ID for visual variety
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

// Risk level color mapping for pills
const riskColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const riskLevel = project.roadmap?.riskLevel?.toLowerCase() || 'low'
  const gradient = getProjectGradient(project._id || project.id || '')
  const imageUrl = project.roadmap?.imageUrl

  return (
    <Link href={`/project/${project._id || project.id}`}>
      <div className="bg-white rounded-card shadow-soft overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
        {/* Image/Background Section */}
        <div className={`h-48 relative overflow-hidden ${!imageUrl ? `bg-gradient-to-br ${gradient}` : ''}`}>
          {/* Met Museum Image */}
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={project.name}
              fill
              className="object-cover scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
          
          {/* Back arrow icon in top right */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
          
          {/* Title overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10">
            <h3 className="text-white font-bold text-lg leading-tight">
              {project.name}
            </h3>
          </div>
        </div>

        {/* Description Section */}
        <div className="p-4">
          <p className="text-[#404040] text-sm line-clamp-3 mb-3">
            {project.description || 'No description available.'}
          </p>
          
          {/* Risk Level and Creator Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                riskColors[riskLevel] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {project.roadmap?.riskLevel || 'Low'} Risk
            </span>
            {project.createdBy && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {project.createdBy.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
