/**
 * Assignment suggestion prompts for Gemini API
 * Phase 9: AI Smart Assignment Suggestions
 */

export interface AssignmentSuggestionInput {
  taskDescription: string
  taskTitle: string
  taskLabels?: string[]
  taskType?: string
  availableEngineers: Array<{
    id: string
    name: string
    specialization: string | null
    currentTicketCount: number
    currentStoryPointCount: number
    isOnVacation: boolean
  }>
  projectHistory?: Array<{
    featureId: string
    title: string
    description: string
    assignedTo: string | null
    labels: string[]
    ticketType: string
  }>
}

/**
 * Generate prompt for assignment suggestion
 */
export function getAssignmentSuggestionPrompt(input: AssignmentSuggestionInput): string {
  const engineersList = input.availableEngineers
    .map((eng) => {
      const vacationStatus = eng.isOnVacation ? ' (ON VACATION - EXCLUDE)' : ''
      return `- ${eng.name} (ID: ${eng.id})
    - Specialization: ${eng.specialization || 'Not specified'}
    - Current workload: ${eng.currentTicketCount} tickets, ${eng.currentStoryPointCount} story points${vacationStatus}`
    })
    .join('\n')

  const projectHistoryText = input.projectHistory && input.projectHistory.length > 0
    ? `\n\nProject History (past assignments for context):
${input.projectHistory
  .map((f) => `- "${f.title}": ${f.description.substring(0, 100)}... (Assigned to: ${f.assignedTo || 'Unassigned'}, Labels: ${f.labels.join(', ') || 'None'}, Type: ${f.ticketType})`)
  .join('\n')}`
    : ''

  return `You are an AI assistant helping a Product Manager assign a task to the best available engineer.

TASK TO ASSIGN:
Title: ${input.taskTitle}
Description: ${input.taskDescription}
Type: ${input.taskType || 'feature'}
Labels: ${input.taskLabels?.join(', ') || 'None'}${projectHistoryText}

AVAILABLE ENGINEERS:
${engineersList}

Your task:
1. Analyze the task description and infer the required specialization (Backend, Frontend, QA, DevOps, or general)
2. Consider each engineer's:
   - Specialization match
   - Current workload (tickets and story points)
   - Vacation status (EXCLUDE engineers on vacation)
3. Rank the top 3 engineers with reasoning
4. Provide a confidence score (0-100) for the top recommendation

Return ONLY valid JSON in this exact format:
{
  "requiredSpecialization": "Backend" | "Frontend" | "QA" | "DevOps" | "General" | null,
  "recommendations": [
    {
      "engineerId": "uuid",
      "engineerName": "string",
      "reasoning": "string (explain why this engineer is a good fit)",
      "confidenceScore": number (0-100),
      "matchFactors": {
        "specializationMatch": boolean,
        "workloadSuitable": boolean,
        "pastExperience": boolean
      }
    }
  ]
}

IMPORTANT:
- EXCLUDE engineers who are on vacation (isOnVacation: true)
- Prioritize specialization match when available
- Consider workload balance (don't overload engineers)
- Use project history to infer past experience patterns
- Return exactly 3 recommendations (or fewer if fewer engineers are available)
- Sort by confidence score (highest first)

Return ONLY valid JSON, no markdown formatting, no code blocks.`
}

/**
 * Parse and validate assignment suggestion response from Gemini
 */
export interface AssignmentSuggestionResponse {
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

export function parseAssignmentSuggestionResponse(response: string): AssignmentSuggestionResponse {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response from AI: response is not a string')
  }

  // Clean up the response (remove markdown code blocks if present)
  let cleanedText = response.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/```\n?/g, '')
  }

  try {
    const suggestion = JSON.parse(cleanedText)

    // Validate the structure
    if (!suggestion || typeof suggestion !== 'object') {
      throw new Error('Invalid suggestion structure: not an object')
    }

    // Validate requiredSpecialization
    const validSpecializations = ['Backend', 'Frontend', 'QA', 'DevOps', 'General', null]
    if (!validSpecializations.includes(suggestion.requiredSpecialization)) {
      throw new Error('Invalid requiredSpecialization')
    }

    // Validate recommendations array
    if (!Array.isArray(suggestion.recommendations)) {
      throw new Error('Invalid suggestion structure: recommendations is not an array')
    }

    // Validate each recommendation
    suggestion.recommendations.forEach((rec: any, index: number) => {
      if (!rec.engineerId || typeof rec.engineerId !== 'string') {
        throw new Error(`Invalid recommendation at index ${index}: missing or invalid engineerId`)
      }
      if (!rec.engineerName || typeof rec.engineerName !== 'string') {
        throw new Error(`Invalid recommendation at index ${index}: missing or invalid engineerName`)
      }
      if (!rec.reasoning || typeof rec.reasoning !== 'string') {
        throw new Error(`Invalid recommendation at index ${index}: missing or invalid reasoning`)
      }
      if (typeof rec.confidenceScore !== 'number' || rec.confidenceScore < 0 || rec.confidenceScore > 100) {
        throw new Error(`Invalid recommendation at index ${index}: confidenceScore must be a number between 0 and 100`)
      }
      if (!rec.matchFactors || typeof rec.matchFactors !== 'object') {
        throw new Error(`Invalid recommendation at index ${index}: missing or invalid matchFactors`)
      }
      if (typeof rec.matchFactors.specializationMatch !== 'boolean') {
        throw new Error(`Invalid recommendation at index ${index}: matchFactors.specializationMatch must be boolean`)
      }
      if (typeof rec.matchFactors.workloadSuitable !== 'boolean') {
        throw new Error(`Invalid recommendation at index ${index}: matchFactors.workloadSuitable must be boolean`)
      }
      if (typeof rec.matchFactors.pastExperience !== 'boolean') {
        throw new Error(`Invalid recommendation at index ${index}: matchFactors.pastExperience must be boolean`)
      }
    })

    return suggestion
  } catch (error: any) {
    console.error('[Parse Assignment Suggestion] Error parsing response:', error)
    console.error('[Parse Assignment Suggestion] Response text:', cleanedText.substring(0, 500))
    throw new Error(`Failed to parse assignment suggestion response from AI: ${error.message}`)
  }
}

