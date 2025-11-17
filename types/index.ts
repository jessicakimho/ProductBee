/**
 * Type definitions - Central export for all types
 */

export * from './api'
export * from './database'
// Export feedback types with aliases to avoid conflicts with roadmap types
export type {
  RoadmapFeature as FeedbackRoadmapFeature,
  RoadmapResponse as FeedbackRoadmapResponse,
  ProposalAnalysis as FeedbackProposalAnalysis,
  RoadmapComparison,
} from './feedback'
// Export roadmap types with aliases to avoid conflicts with feedback types
export type {
  RoadmapFeature as RoadmapRoadmapFeature,
  RoadmapResponse as RoadmapRoadmapResponse,
  ProposalAnalysis as RoadmapProposalAnalysis,
} from './roadmap'
// For backward compatibility, re-export the original names from roadmap
export type { RoadmapFeature, RoadmapResponse, ProposalAnalysis } from './roadmap'
// Chat types removed - chat feature deprecated
