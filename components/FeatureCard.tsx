'use client'

import { AlertCircle, Clock } from 'lucide-react'

interface FeatureCardProps {
  feature: {
    _id: string
    title: string
    description: string
    priority: 'P0' | 'P1' | 'P2'
    effortEstimateWeeks: number
    status: 'backlog' | 'active' | 'blocked' | 'complete'
  }
  onClick: () => void
}

export default function FeatureCard({ feature, onClick }: FeatureCardProps) {
  const priorityStyles: Record<string, string> = {
    P0: 'bg-white/40',
    P1: 'bg-white/30',
    P2: 'bg-white/20',
  }

  return (
    <div
      onClick={onClick}
      className="card p-5 cursor-pointer transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-sm tracking-tight">
          {feature.title}
        </h4>
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
            priorityStyles[feature.priority] || 'bg-white/30'
          }`}
          style={{ color: 'var(--text-muted)' }}
        >
          {feature.priority}
        </span>
      </div>
      <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
        {feature.description}
      </p>
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>{feature.effortEstimateWeeks} weeks</span>
        </div>
        {feature.status === 'blocked' && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            <span>Blocked</span>
          </div>
        )}
      </div>
    </div>
  )
}

