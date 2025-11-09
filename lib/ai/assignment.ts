/**
 * AI-powered assignment suggestion system
 * Phase 9: AI Smart Assignment Suggestions
 */

import { createServerClient } from '@/lib/supabase'
import { calculateUserWorkload, isUserOnVacation } from '@/lib/api/workload'
import { suggestAssignment as geminiSuggestAssignment } from '@/lib/gemini'
import type { AssignmentSuggestionResponse } from '@/lib/prompts/assignment'

/**
 * Engineer candidate for assignment
 */
export interface EngineerCandidate {
  id: string
  name: string
  email: string
  specialization: string | null
  currentTicketCount: number
  currentStoryPointCount: number
  isOnVacation: boolean
}

/**
 * Assignment suggestion result
 */
export interface AssignmentSuggestion {
  requiredSpecialization: 'Backend' | 'Frontend' | 'QA' | 'DevOps' | 'General' | null
  recommendations: Array<{
    engineerId: string
    engineerName: string
    reasoning: string
    confidenceScore: number
    matchFactors: {
      specializationMatch: boolean
      workloadSuitable: boolean
      pastExperience: boolean
    }
  }>
}

/**
 * Suggest the best engineer(s) for a given task
 * 
 * @param taskDescription - Description of the task to assign
 * @param taskTitle - Title of the task
 * @param taskLabels - Labels associated with the task
 * @param taskType - Type of ticket (feature, bug, epic, story)
 * @param accountId - Account ID for account isolation
 * @param projectId - Optional project ID to analyze project history
 * @returns Assignment suggestion with ranked recommendations
 */
export async function suggestAssignment(
  taskDescription: string,
  taskTitle: string,
  taskLabels?: string[],
  taskType?: string,
  accountId?: string,
  projectId?: string
): Promise<AssignmentSuggestion> {
  if (!accountId) {
    throw new Error('Account ID is required for assignment suggestions')
  }

  const supabase = createServerClient()

  // Get all available engineers in the account (exclude vacationing users)
  const { data: teamMembers, error: teamError } = await supabase
    .from('users')
    .select('*')
    .eq('account_id', accountId)
    .in('role', ['engineer', 'admin']) // Only engineers and admins can be assigned tasks
    .order('name', { ascending: true })

  if (teamError) {
    throw new Error('Failed to fetch team members')
  }

  if (!teamMembers || teamMembers.length === 0) {
    throw new Error('No engineers available in this account')
  }

  // Calculate workload and filter out vacationing users
  const engineerCandidates: EngineerCandidate[] = []
  for (const member of teamMembers) {
    const workload = await calculateUserWorkload(member.id, member.account_id)
    const vacationDates = (member.vacation_dates as Array<{ start: string; end: string }>) || []
    const onVacation = isUserOnVacation(vacationDates)

    // Exclude users on vacation
    if (onVacation) {
      continue
    }

    engineerCandidates.push({
      id: member.id,
      name: member.name,
      email: member.email,
      specialization: member.specialization || null,
      currentTicketCount: workload.ticketCount,
      currentStoryPointCount: workload.storyPointCount,
      isOnVacation: false,
    })
  }

  if (engineerCandidates.length === 0) {
    throw new Error('No available engineers (all are on vacation)')
  }

  // Get project history if projectId is provided
  let projectHistory: Array<{
    featureId: string
    title: string
    description: string
    assignedTo: string | null
    labels: string[]
    ticketType: string
  }> = []

  if (projectId) {
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('id, title, description, assigned_to, labels, ticket_type')
      .eq('project_id', projectId)
      .eq('account_id', accountId)
      .not('assigned_to', 'is', null) // Only get features that were assigned
      .order('created_at', { ascending: false })
      .limit(20) // Limit to last 20 assignments for context

    if (!featuresError && features) {
      projectHistory = features.map((f) => ({
        featureId: f.id,
        title: f.title,
        description: f.description,
        assignedTo: f.assigned_to,
        labels: f.labels || [],
        ticketType: f.ticket_type || 'feature',
      }))
    }
  }

  // Call Gemini to get AI-powered suggestions
  const suggestion = await geminiSuggestAssignment({
    taskDescription,
    taskTitle,
    taskLabels,
    taskType,
    availableEngineers: engineerCandidates,
    projectHistory: projectHistory.length > 0 ? projectHistory : undefined,
  })

  return suggestion
}

