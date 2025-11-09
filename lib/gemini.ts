import { GoogleGenerativeAI } from '@google/generative-ai'
import { getRoadmapPrompt, parseRoadmapResponse } from './prompts/roadmap'
import { getProposalAnalysisPrompt, parseProposalAnalysisResponse } from './prompts/feedback'
import { getRoadmapComparisonPrompt, parseRoadmapComparisonResponse } from './prompts/comparison'
import { getAssignmentSuggestionPrompt, parseAssignmentSuggestionResponse, type AssignmentSuggestionInput } from './prompts/assignment'
import { APIErrors } from './api/errors'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable inside .env.local')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

/**
 * Get Gemini model instance
 * Defaults to gemini-pro, but can be overridden for different models
 * gemini-2.0-flash-lite now
 */
function getModel(modelName: string = 'gemini-2.0-flash-lite') {
  return genAI.getGenerativeModel({ model: modelName })
}

/**
 * Generate roadmap from project name and description
 */
export async function generateRoadmap(projectName: string, projectDescription: string) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables')
    }

    // Validate input
    if (!projectName || !projectDescription) {
      throw new Error('Project name and description are required')
    }

    const model = getModel()
    const prompt = getRoadmapPrompt({ projectName, projectDescription })
    
    console.log('[Gemini] Generating roadmap for project:', projectName)
    console.log('[Gemini] Prompt length:', prompt.length)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    
    // Check if response was blocked
    if (response.blockedReason) {
      throw new Error(`Response was blocked: ${response.blockedReason}`)
    }
    
    const text = response.text()
    
    if (!text || text.length === 0) {
      throw new Error('Empty response from Gemini API')
    }
    
    console.log('[Gemini] Received response, length:', text.length)
    console.log('[Gemini] Response preview:', text.substring(0, 200))
    
    return parseRoadmapResponse(text)
  } catch (error: any) {
    console.error('[Gemini] Error generating roadmap:', error)
    console.error('[Gemini] Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      statusMessage: error?.statusMessage,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
    })
    
    // Handle specific Gemini API errors
    if (error?.message?.includes('API key')) {
      throw APIErrors.internalError('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.')
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      throw APIErrors.internalError('Gemini API quota exceeded or rate limited. Please try again later.')
    }
    
    if (error?.message?.includes('model')) {
      throw APIErrors.internalError('Gemini model not available. Please check your API access.')
    }
    
    // Preserve the original error message if it's informative
    const errorMessage = error?.message || 'Failed to generate roadmap'
    throw APIErrors.internalError(`Failed to generate roadmap: ${errorMessage}`)
  }
}

/**
 * Analyze engineer proposal and its impact on timeline
 */
export async function analyzeProposal(proposalContent: string, originalRoadmap: any) {
  try {
    const model = getModel()
    const prompt = getProposalAnalysisPrompt({
      proposalContent,
      originalRoadmap,
    })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return parseProposalAnalysisResponse(text)
  } catch (error) {
    console.error('Error analyzing proposal:', error)
    throw APIErrors.internalError('Failed to analyze proposal')
  }
}

/**
 * Compare original roadmap with proposed roadmap
 * Returns array of changed features
 */
export async function compareRoadmaps(originalRoadmap: any, proposedRoadmap: any) {
  try {
    const model = getModel()
    const prompt = getRoadmapComparisonPrompt({
      originalRoadmap,
      proposedRoadmap,
    })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    return parseRoadmapComparisonResponse(text)
  } catch (error) {
    console.error('Error comparing roadmaps:', error)
    throw APIErrors.internalError('Failed to compare roadmaps')
  }
}

/**
 * Suggest assignment for a task using AI
 * Phase 9: AI Smart Assignment Suggestions
 */
export async function suggestAssignment(input: AssignmentSuggestionInput) {
  try {
    const model = getModel()
    const prompt = getAssignmentSuggestionPrompt(input)
    
    console.log('[Gemini] Generating assignment suggestion for task:', input.taskTitle)
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    
    // Check if response was blocked
    if (response.blockedReason) {
      throw new Error(`Response was blocked: ${response.blockedReason}`)
    }
    
    const text = response.text()
    
    if (!text || text.length === 0) {
      throw new Error('Empty response from Gemini API')
    }
    
    console.log('[Gemini] Received assignment suggestion response')
    
    return parseAssignmentSuggestionResponse(text)
  } catch (error: any) {
    console.error('[Gemini] Error generating assignment suggestion:', error)
    console.error('[Gemini] Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      statusMessage: error?.statusMessage,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
    })
    
    // Handle specific Gemini API errors
    if (error?.message?.includes('API key')) {
      throw APIErrors.internalError('Invalid or missing Gemini API key. Please check your GEMINI_API_KEY environment variable.')
    }
    
    if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      throw APIErrors.internalError('Gemini API quota exceeded or rate limited. Please try again later.')
    }
    
    if (error?.message?.includes('model')) {
      throw APIErrors.internalError('Gemini model not available. Please check your API access.')
    }
    
    // Preserve the original error message if it's informative
    const errorMessage = error?.message || 'Failed to generate assignment suggestion'
    throw APIErrors.internalError(`Failed to generate assignment suggestion: ${errorMessage}`)
  }
}

