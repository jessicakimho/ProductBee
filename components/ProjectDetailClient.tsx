'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import FeatureCard from './FeatureCard'
import FeatureModal from './FeatureModal'

interface Feature {
  _id: string
  title: string
  description: string
  priority: 'P0' | 'P1' | 'P2'
  effortEstimateWeeks: number
  status: 'backlog' | 'active' | 'blocked' | 'complete'
}

interface Feedback {
  _id: string
  type: 'comment' | 'proposal'
  content: string
  aiAnalysis?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  userId: {
    name: string
    email: string
  }
}

interface Project {
  _id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: string
  }
  createdBy?: {
    name: string
    email: string
  }
}

interface ProjectDetailClientProps {
  projectData: {
    project: Project
    features: Feature[]
    feedbackByFeature: Record<string, Feedback[]>
  }
  userRole?: string
}

export default function ProjectDetailClient({
  projectData: initialData,
  userRole,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const { user } = useUser()
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [projectData, setProjectData] = useState(initialData)

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/project/${projectData.project._id}`)
      if (response.ok) {
        const data = await response.json()
        setProjectData(data)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature)
  }

  const handleFeatureUpdate = async (featureId: string, updates: Partial<Feature>) => {
    try {
      const response = await fetch(`/api/feature/${featureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await refreshData()
      }
    } catch (error) {
      console.error('Error updating feature:', error)
    }
  }

  const handleDrop = async (featureId: string, newStatus: Feature['status']) => {
    await handleFeatureUpdate(featureId, { status: newStatus })
  }

  const columns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'active', title: 'In Progress' },
    { id: 'blocked', title: 'Blocked' },
    { id: 'complete', title: 'Complete' },
  ]

  const getFeaturesByStatus = (status: string) => {
    return projectData.features.filter((f) => f.status === status)
  }

  const riskStyles: Record<string, string> = {
    low: 'bg-white/60',
    medium: 'bg-white/40',
    high: 'bg-white/20',
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center h-20 gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
        <div className="mb-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight mb-3">
                {projectData.project.name}
              </h1>
              <p style={{ color: 'var(--text-muted)' }}>
                {projectData.project.description}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                riskStyles[projectData.project.roadmap.riskLevel.toLowerCase()] ||
                'bg-white/60'
              }`}
              style={{ color: 'var(--text-muted)' }}
            >
              {projectData.project.roadmap.riskLevel} Risk
            </span>
          </div>

          <div className="card p-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 tracking-tight">
              <AlertCircle className="w-5 h-5" />
              Roadmap Summary
            </h2>
            <p className="whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
              {projectData.project.roadmap.summary}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">
            Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => {
            const features = getFeaturesByStatus(column.id)
            return (
              <div
                key={column.id}
                className="card p-6"
              >
                <h3 className="font-semibold mb-6 tracking-tight">
                  {column.title} ({features.length})
                </h3>
                <div className="space-y-4 min-h-[200px]">
                  {features.map((feature) => (
                    <FeatureCard
                      key={feature._id}
                      feature={feature}
                      onClick={() => handleFeatureClick(feature)}
                    />
                  ))}
                  {features.length === 0 && (
                    <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                      No features
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {selectedFeature && (
        <FeatureModal
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          feature={selectedFeature}
          projectId={projectData.project._id}
          feedback={
            projectData.feedbackByFeature[selectedFeature._id] || []
          }
          userRole={userRole}
          onFeatureUpdate={refreshData}
        />
      )}
    </div>
  )
}

