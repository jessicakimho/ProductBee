/**
 * Timeline calculation utilities for Gantt chart and project planning
 * Phase 7: Gantt Chart & Timeline View
 */

import type { Feature } from '@/models/Feature'

/**
 * Feature with calculated timeline data
 */
export interface FeatureWithTimeline extends Feature {
  startDate?: string | null
  endDate?: string | null
  duration?: number | null
  calculatedStartDate?: string | null
  calculatedEndDate?: string | null
  calculatedDuration?: number | null
  isOnCriticalPath?: boolean
  slackDays?: number
}

/**
 * Dependency chain information
 */
export interface DependencyChain {
  featureId: string
  chain: string[] // Array of feature IDs in dependency order
  depth: number // Depth in dependency tree
}

/**
 * Critical path information
 */
export interface CriticalPath {
  path: string[] // Array of feature IDs on critical path
  totalDuration: number // Total duration in days
  startDate: string // Project start date (ISO)
  endDate: string // Project end date (ISO)
}

/**
 * Timeline calculation result
 */
export interface TimelineCalculation {
  features: FeatureWithTimeline[]
  dependencyChains: DependencyChain[]
  criticalPath: CriticalPath | null
  milestones: Array<{
    date: string
    features: string[] // Feature IDs completing on this date
    description: string
  }>
  overlaps: Array<{
    feature1: string
    feature2: string
    overlapDays: number
  }>
}

/**
 * Calculate duration in days between two dates
 */
export function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Calculate end date from start date and duration
 */
export function calculateEndDate(startDate: string, durationDays: number): string {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + durationDays - 1) // -1 because start day counts as day 1
  return end.toISOString().split('T')[0]
}

/**
 * Calculate start date from end date and duration
 */
export function calculateStartDate(endDate: string, durationDays: number): string {
  const end = new Date(endDate)
  const start = new Date(end)
  start.setDate(start.getDate() - durationDays + 1) // +1 because end day counts as day 1
  return start.toISOString().split('T')[0]
}

/**
 * Check if two date ranges overlap
 */
export function checkOverlap(
  start1: string | null | undefined,
  end1: string | null | undefined,
  start2: string | null | undefined,
  end2: string | null | undefined
): number {
  if (!start1 || !end1 || !start2 || !end2) {
    return 0
  }

  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)

  // Check if ranges overlap
  if (s1 > e2 || s2 > e1) {
    return 0
  }

  // Calculate overlap
  const overlapStart = s1 > s2 ? s1 : s2
  const overlapEnd = e1 < e2 ? e1 : e2
  const overlapTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime())
  const overlapDays = Math.ceil(overlapTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both days

  return overlapDays
}

/**
 * Build dependency chains from features
 */
export function buildDependencyChains(features: Feature[]): DependencyChain[] {
  const chains: DependencyChain[] = []
  const featureMap = new Map<string, Feature>()
  features.forEach((f) => featureMap.set(f.id, f))

  // Build dependency graph
  const visited = new Set<string>()
  const visiting = new Set<string>()

  function buildChain(featureId: string, currentChain: string[]): string[] {
    if (visiting.has(featureId)) {
      // Circular dependency detected
      return currentChain
    }

    if (visited.has(featureId)) {
      return currentChain
    }

    visiting.add(featureId)
    const feature = featureMap.get(featureId)
    if (!feature) {
      visiting.delete(featureId)
      return currentChain
    }

    const newChain = [...currentChain, featureId]

    // Process dependencies
    if (feature.dependencies && feature.dependencies.length > 0) {
      for (const depId of feature.dependencies) {
        const depChain = buildChain(depId, newChain)
        if (depChain.length > newChain.length) {
          return depChain
        }
      }
    }

    visiting.delete(featureId)
    visited.add(featureId)
    return newChain
  }

  // Build chains for all features
  features.forEach((feature) => {
    if (!visited.has(feature.id)) {
      const chain = buildChain(feature.id, [])
      if (chain.length > 0) {
        chains.push({
          featureId: feature.id,
          chain,
          depth: chain.length - 1,
        })
      }
    }
  })

  return chains
}

/**
 * Calculate critical path using longest path algorithm
 */
export function calculateCriticalPath(features: Feature[]): CriticalPath | null {
  if (features.length === 0) {
    return null
  }

  const featureMap = new Map<string, FeatureWithTimeline>()
  features.forEach((f) => {
    featureMap.set(f.id, {
      ...f,
      calculatedStartDate: f.start_date || null,
      calculatedEndDate: f.end_date || null,
      calculatedDuration: f.duration || null,
    })
  })

  // Calculate durations from effort estimates if not set
  featureMap.forEach((feature) => {
    if (!feature.calculatedDuration && feature.estimated_effort_weeks) {
      feature.calculatedDuration = (feature.estimated_effort_weeks ?? 1) * 7 // Convert weeks to days
    }
  })

  // Find features with no dependencies (start nodes)
  const startFeatures = Array.from(featureMap.values()).filter(
    (f) => !f.dependencies || f.dependencies.length === 0
  )

  if (startFeatures.length === 0) {
    return null
  }

  // Calculate earliest start and end dates for each feature
  const earliestStart = new Map<string, number>()
  const earliestEnd = new Map<string, number>()

  function calculateEarliestTimes(featureId: string): number {
    if (earliestEnd.has(featureId)) {
      return earliestEnd.get(featureId)!
    }

    const feature = featureMap.get(featureId)
    if (!feature) {
      return 0
    }

    // Calculate earliest start (max of dependency end dates)
    let earliestStartTime = 0
    if (feature.dependencies && feature.dependencies.length > 0) {
      for (const depId of feature.dependencies) {
        const depEnd = calculateEarliestTimes(depId)
        earliestStartTime = Math.max(earliestStartTime, depEnd)
      }
    }

    earliestStart.set(featureId, earliestStartTime)

    // Calculate earliest end
    const duration = feature.calculatedDuration || (feature.estimated_effort_weeks ?? 1) * 7
    const earliestEndTime = earliestStartTime + duration
    earliestEnd.set(featureId, earliestEndTime)

    return earliestEndTime
  }

  // Calculate earliest times for all features
  featureMap.forEach((_, featureId) => {
    calculateEarliestTimes(featureId)
  })

  // Find project end date (max of all end dates)
  const projectEndTime = Math.max(...Array.from(earliestEnd.values()))
  if (projectEndTime === 0) {
    return null
  }

  // Calculate latest start and end dates (backward pass)
  const latestStart = new Map<string, number>()
  const latestEnd = new Map<string, number>()

  // Find features with no dependents (end nodes)
  const dependents = new Map<string, string[]>()
  featureMap.forEach((feature) => {
    if (feature.dependencies) {
      feature.dependencies.forEach((depId) => {
        if (!dependents.has(depId)) {
          dependents.set(depId, [])
        }
        dependents.get(depId)!.push(feature.id)
      })
    }
  })

  const endFeatures = Array.from(featureMap.keys()).filter(
    (featureId) => !dependents.has(featureId) || dependents.get(featureId)!.length === 0
  )

  function calculateLatestTimes(featureId: string): number {
    if (latestStart.has(featureId)) {
      return latestStart.get(featureId)!
    }

    const feature = featureMap.get(featureId)
    if (!feature) {
      return projectEndTime
    }

    // Calculate latest end (min of dependent start dates, or project end)
    const featureDependents = dependents.get(featureId) || []
    let latestEndTime = projectEndTime

    if (featureDependents.length > 0) {
      for (const dependentId of featureDependents) {
        const depStart = calculateLatestTimes(dependentId)
        const depFeature = featureMap.get(dependentId)
        const depDuration = depFeature?.calculatedDuration || (depFeature?.estimated_effort_weeks ?? 1) * 7
        latestEndTime = Math.min(latestEndTime, depStart - depDuration)
      }
    }

    latestEnd.set(featureId, latestEndTime)

    // Calculate latest start
    const duration = feature.calculatedDuration || (feature.estimated_effort_weeks ?? 1) * 7
    const latestStartTime = latestEndTime - duration
    latestStart.set(featureId, latestStartTime)

    return latestStartTime
  }

  // Calculate latest times for all features
  featureMap.forEach((_, featureId) => {
    calculateLatestTimes(featureId)
  })

  // Find critical path (features where earliest start = latest start and earliest end = latest end)
  const criticalPath: string[] = []
  featureMap.forEach((_, featureId) => {
    const es = earliestStart.get(featureId) || 0
    const ls = latestStart.get(featureId) || 0
    const ee = earliestEnd.get(featureId) || 0
    const le = latestEnd.get(featureId) || 0

    if (es === ls && ee === le) {
      criticalPath.push(featureId)
    }
  })

  // Sort critical path by earliest start
  criticalPath.sort((a, b) => {
    const esA = earliestStart.get(a) || 0
    const esB = earliestStart.get(b) || 0
    return esA - esB
  })

  if (criticalPath.length === 0) {
    return null
  }

  // Convert to dates (using today as project start)
  const projectStartDate = new Date()
  projectStartDate.setHours(0, 0, 0, 0)

  const startDateStr = projectStartDate.toISOString().split('T')[0]
  const endDate = new Date(projectStartDate)
  endDate.setDate(endDate.getDate() + projectEndTime)
  const endDateStr = endDate.toISOString().split('T')[0]

  return {
    path: criticalPath,
    totalDuration: projectEndTime,
    startDate: startDateStr,
    endDate: endDateStr,
  }
}

/**
 * Calculate milestones from feature completion dates
 */
export function calculateMilestones(features: FeatureWithTimeline[]): Array<{
  date: string
  features: string[]
  description: string
}> {
  const milestones: Map<string, string[]> = new Map()

  features.forEach((feature) => {
    const endDate = feature.endDate || feature.calculatedEndDate
    if (endDate) {
      if (!milestones.has(endDate)) {
        milestones.set(endDate, [])
      }
      milestones.get(endDate)!.push(feature.id)
    }
  })

  return Array.from(milestones.entries())
    .map(([date, featureIds]) => ({
      date,
      features: featureIds,
      description: `${featureIds.length} feature${featureIds.length > 1 ? 's' : ''} completing`,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Calculate overlaps between features
 */
export function calculateOverlaps(features: FeatureWithTimeline[]): Array<{
  feature1: string
  feature2: string
  overlapDays: number
}> {
  const overlaps: Array<{ feature1: string; feature2: string; overlapDays: number }> = []

  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      const f1 = features[i]
      const f2 = features[j]

      const start1 = f1.startDate || f1.calculatedStartDate
      const end1 = f1.endDate || f1.calculatedEndDate
      const start2 = f2.startDate || f2.calculatedStartDate
      const end2 = f2.endDate || f2.calculatedEndDate

      const overlap = checkOverlap(start1, end1, start2, end2)
      if (overlap > 0) {
        overlaps.push({
          feature1: f1.id,
          feature2: f2.id,
          overlapDays: overlap,
        })
      }
    }
  }

  return overlaps
}

/**
 * Calculate complete timeline for a set of features
 */
export function calculateTimeline(features: Feature[]): TimelineCalculation {
  // Convert to features with timeline
  const featuresWithTimeline: FeatureWithTimeline[] = features.map((f) => ({
    ...f,
    calculatedStartDate: f.start_date || null,
    calculatedEndDate: f.end_date || null,
    calculatedDuration: f.duration || null,
  }))

  // Calculate durations from effort estimates if not set
  featuresWithTimeline.forEach((feature) => {
    if (!feature.calculatedDuration && feature.estimated_effort_weeks) {
      feature.calculatedDuration = (feature.estimated_effort_weeks ?? 1) * 7 // Convert weeks to days
    }
  })

  // Build dependency chains
  const dependencyChains = buildDependencyChains(features)

  // Calculate critical path
  const criticalPath = calculateCriticalPath(features)

  // Calculate milestones
  const milestones = calculateMilestones(featuresWithTimeline)

  // Calculate overlaps
  const overlaps = calculateOverlaps(featuresWithTimeline)

  // Mark features on critical path
  if (criticalPath) {
    featuresWithTimeline.forEach((feature) => {
      feature.isOnCriticalPath = criticalPath.path.includes(feature.id)
    })
  }

  // Sort features by start date
  featuresWithTimeline.sort((a, b) => {
    const dateA = a.startDate || a.calculatedStartDate || ''
    const dateB = b.startDate || b.calculatedStartDate || ''
    return dateA.localeCompare(dateB)
  })

  return {
    features: featuresWithTimeline,
    dependencyChains,
    criticalPath,
    milestones,
    overlaps,
  }
}

