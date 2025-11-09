# Phase 10: Feedback & Proposal System

## Overview
Implemented a comprehensive feedback and proposal system that enables engineers to provide comments and timeline proposals on features, with AI-powered analysis to help PMs make informed decisions.

## Implementation Details

### 1. Feedback Model
**Location:** `/models/Feedback.ts`

The Feedback model extends `BaseModel` and includes:
- `project_id`: Reference to the project
- `feature_id`: Reference to the feature being discussed
- `account_id`: Account isolation (enforced on all queries)
- `type`: Either `'comment'` or `'timeline_proposal'` (stored as `'proposal'` in DB)
- `content`: The feedback text content
- `status`: `'pending'`, `'approved'`, `'rejected'`, or `'discussion'`
- `analysis`: Optional AI-generated analysis object with:
  - `requires_timeline_change`: Boolean flag
  - `suggested_action`: String description
  - `affected_features`: Array of feature IDs
  - `reasoning`: Explanation of the analysis

### 2. AI Prompts

#### Feedback Analysis Prompt
**Location:** `/lib/prompts/feedback.ts`

The `getProposalAnalysisPrompt()` function generates prompts for analyzing engineer proposals. It:
- Takes the proposal content and original roadmap summary
- Returns a structured JSON analysis with:
  - Summary of the proposal
  - Timeline impact description
  - Recommended roadmap adjustments

The `parseProposalAnalysisResponse()` function handles parsing and validation of AI responses, including cleanup of markdown code blocks.

#### Roadmap Comparison Prompt
**Location:** `/lib/prompts/comparison.ts`

The `getRoadmapComparisonPrompt()` function compares original vs proposed roadmaps:
- Takes both roadmap objects
- Returns only the changed features as a JSON array
- Maintains the same structure as the original features array

The `parseRoadmapComparisonResponse()` function handles parsing with markdown cleanup.

### 3. Gemini Integration

#### analyzeProposal()
**Location:** `/lib/gemini.ts`

Function that analyzes engineer proposals using Gemini AI:
- Takes proposal content and original roadmap
- Uses the feedback analysis prompt
- Returns structured analysis with timeline impact and recommendations
- Includes error handling for API failures

#### compareRoadmaps()
**Location:** `/lib/gemini.ts`

Function that compares original and proposed roadmaps:
- Uses the comparison prompt
- Returns array of changed features
- Used during proposal approval to identify what needs updating

### 4. API Endpoints

#### POST /api/feedback/create
**Location:** `/app/api/feedback/create/route.ts`

Creates a new feedback entry (comment or proposal):
- **Permissions:** All authenticated users can create feedback
- **Account Isolation:** Enforced - users can only create feedback for features in their account
- **AI Analysis:** Automatically analyzes proposals using `analyzeProposal()` when type is `'proposal'`
- **Validation:**
  - Validates projectId, featureId, type, and content
  - Verifies project and feature exist and belong to user's account
  - Ensures feature belongs to the specified project
- **Response:** Returns formatted feedback object with user information

**Request Body:**
```typescript
{
  projectId: string
  featureId: string
  type: 'comment' | 'timeline_proposal'
  content: string
  proposedRoadmap?: any // Optional, for timeline proposals
}
```

#### POST /api/feedback/approve
**Location:** `/app/api/feedback/approve/route.ts`

Approves a feedback proposal:
- **Permissions:** PM or Admin role required
- **Account Isolation:** Enforced - users can only approve proposals in their account
- **Validation:**
  - Verifies feedback exists and belongs to user's account
  - Ensures feedback is a proposal type
  - Ensures feedback status is 'pending'
  - Checks user has permission to approve (PM/Admin)
- **AI Comparison:** If proposed roadmap exists, uses `compareRoadmaps()` to identify changes
- **Response:** Returns updated feedback with 'approved' status

**Request Body:**
```typescript
{
  feedbackId: string
}
```

#### POST /api/feedback/reject
**Location:** `/app/api/feedback/reject/route.ts`

Rejects a feedback proposal:
- **Permissions:** PM or Admin role required
- **Account Isolation:** Enforced - users can only reject proposals in their account
- **Validation:**
  - Verifies feedback exists and belongs to user's account
  - Ensures feedback status is 'pending'
  - Checks user has permission to reject (PM/Admin)
- **Response:** Returns updated feedback with 'rejected' status

**Request Body:**
```typescript
{
  feedbackId: string
}
```

### 5. Account Isolation

All feedback endpoints enforce account isolation:
- All queries filter by `account_id` from the user's session
- Users cannot access, create, approve, or reject feedback from other accounts
- Project and feature lookups are scoped to the user's account
- Permission checks also verify account access

### 6. Permission Enforcement

- **Create Feedback:** All authenticated users can create feedback
- **Approve/Reject:** Only PM and Admin roles can approve/reject proposals
- Uses `requireProposalApproval()` from `/lib/api/permissions.ts` to enforce PM/Admin role requirement

## Database Schema

The feedback table includes:
- `id`: UUID primary key
- `project_id`: Foreign key to projects
- `feature_id`: Foreign key to features
- `user_id`: Foreign key to users (creator)
- `account_id`: Account isolation field
- `type`: 'comment' or 'proposal'
- `content`: Text content
- `proposed_roadmap`: JSONB field for timeline proposals
- `ai_analysis`: Text field storing JSON stringified analysis
- `status`: 'pending', 'approved', or 'rejected'
- `created_at`: Timestamp

## Error Handling

All endpoints use consistent error handling:
- Validation errors return 400 Bad Request
- Not found errors return 404 Not Found
- Permission errors return 403 Forbidden
- AI analysis failures are logged but don't block feedback creation
- All errors use the centralized `handleError()` utility

## Type Safety

All endpoints use TypeScript types from `/types/api.ts`:
- `CreateFeedbackRequest`
- `CreateFeedbackResponse`
- `ApproveFeedbackRequest`
- `ApproveFeedbackResponse`
- `RejectFeedbackRequest`
- `RejectFeedbackResponse`

## Integration Points

- **Projects:** Feedback is linked to projects and features
- **Users:** Feedback includes creator information
- **AI:** Uses Gemini API for proposal analysis and roadmap comparison
- **Permissions:** Integrates with permission system for role-based access

## Future Enhancements

Potential improvements:
1. Real-time notifications when feedback is created/approved/rejected
2. Email notifications for PMs when proposals are submitted
3. More detailed roadmap comparison with feature-by-feature diff
4. Feedback threads/replies for discussion
5. Feedback templates for common proposal types
6. Analytics on proposal approval/rejection rates

