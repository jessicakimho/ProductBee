/**
 * Alignment check prompts for Gemini API
 * Phase 11.5: User Stories & Personas
 */

export interface AlignmentCheckInput {
  ticketTitle: string
  ticketDescription: string
  ticketAcceptanceCriteria?: string | null
  userStories: Array<{
    id: string
    name: string
    role: string
    goal: string
    benefit: string
    demographics?: {
      age?: string
      location?: string
      technical_skill?: string
      [key: string]: any
    } | null
  }>
}

/**
 * Generate prompt for ticket alignment check
 */
export function getAlignmentCheckPrompt(input: AlignmentCheckInput): string {
  const userStoriesText = input.userStories
    .map(
      (us, index) => `
User Story ${index + 1}:
- Name: ${us.name}
- Role: ${us.role}
- Goal: ${us.goal}
- Benefit: ${us.benefit}
${us.demographics ? `- Demographics: ${JSON.stringify(us.demographics)}` : ''}
`
    )
    .join('\n')

  return `Analyze how well a ticket aligns with user stories. Return a JSON object with the following structure:
{
  "alignmentScore": number, // 0-100 score indicating how well the ticket aligns with user stories
  "suggestions": string[], // Array of suggestions for improving alignment
  "matchedUserStories": [
    {
      "userStoryId": string,
      "userStoryName": string,
      "relevanceScore": number, // 0-100 score for this specific user story
      "reasons": string[] // Array of reasons why this user story is relevant
    }
  ],
  "aiAnalysis": string // Detailed analysis of the alignment
}

Ticket Information:
- Title: ${input.ticketTitle}
- Description: ${input.ticketDescription}
${input.ticketAcceptanceCriteria ? `- Acceptance Criteria: ${input.ticketAcceptanceCriteria}` : ''}

User Stories:
${userStoriesText}

Analyze the ticket and determine:
1. How well the ticket aligns with the user stories
2. Which user stories are most relevant to this ticket
3. What suggestions can be made to improve alignment
4. Any gaps between the ticket and user stories

Return ONLY valid JSON, no markdown formatting, no code blocks.`
}

/**
 * Parse and validate alignment check response from Gemini
 */
export function parseAlignmentCheckResponse(response: string): any {
  // Clean up the response (remove markdown code blocks if present)
  let cleanedText = response.trim()

  // Remove markdown code blocks
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  try {
    const parsed = JSON.parse(cleanedText)

    // Validate structure
    if (typeof parsed.alignmentScore !== 'number' || parsed.alignmentScore < 0 || parsed.alignmentScore > 100) {
      throw new Error('Invalid alignmentScore: must be a number between 0 and 100')
    }

    if (!Array.isArray(parsed.suggestions)) {
      throw new Error('Invalid suggestions: must be an array')
    }

    if (!Array.isArray(parsed.matchedUserStories)) {
      throw new Error('Invalid matchedUserStories: must be an array')
    }

    if (typeof parsed.aiAnalysis !== 'string') {
      throw new Error('Invalid aiAnalysis: must be a string')
    }

    // Validate matchedUserStories structure
    for (const match of parsed.matchedUserStories) {
      if (!match.userStoryId || !match.userStoryName) {
        throw new Error('Invalid matchedUserStory: missing userStoryId or userStoryName')
      }
      if (typeof match.relevanceScore !== 'number' || match.relevanceScore < 0 || match.relevanceScore > 100) {
        throw new Error('Invalid relevanceScore: must be a number between 0 and 100')
      }
      if (!Array.isArray(match.reasons)) {
        throw new Error('Invalid reasons: must be an array')
      }
    }

    return parsed
  } catch (error) {
    console.error('[Alignment Check] Error parsing response:', error)
    console.error('[Alignment Check] Response text:', cleanedText.substring(0, 500))
    throw new Error(`Failed to parse alignment check response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

