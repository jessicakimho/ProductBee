# Phase 11.5: User Stories & Personas

**Status:** Backend Complete ✅  
**Dependencies:** Phase 11 (AI Chatbot for Ticket Generation)  
**Completed:** 2024

## Overview

Phase 11.5 enables PMs to create, edit, delete, and link user stories to tickets, with AI-powered alignment checking. User stories help ensure that tickets are aligned with user needs and goals, improving product quality and user satisfaction.

## Database Schema

### `user_stories` Table

Created via migration: `/supabase/migration_add_user_stories.sql`

```sql
CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  goal TEXT NOT NULL,
  benefit TEXT NOT NULL,
  demographics JSONB,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_user_stories_project_id` - Fast lookup by project
- `idx_user_stories_account_id` - Account isolation
- `idx_user_stories_created_by` - User lookup

**Key Features:**
- CASCADE delete when project is deleted
- Account isolation via `account_id`
- JSONB demographics for flexible persona data
- Timestamps for created_at and updated_at

### `ticket_user_story` Join Table

Many-to-many relationship between tickets (features) and user stories.

```sql
CREATE TABLE ticket_user_story (
  ticket_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  user_story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (ticket_id, user_story_id)
);
```

**Indexes:**
- `idx_ticket_user_story_ticket_id` - Fast lookup by ticket
- `idx_ticket_user_story_user_story_id` - Fast lookup by user story
- `idx_ticket_user_story_account_id` - Account isolation

**Key Features:**
- Composite primary key prevents duplicate links
- CASCADE delete when ticket or user story is deleted
- Account isolation via `account_id`

## Models

### UserStory Model (`/models/UserStory.ts`)

```ts
export interface UserStoryDemographics {
  age?: string
  location?: string
  technical_skill?: string
  [key: string]: any // Allow additional demographic fields
}

export interface UserStory extends BaseModel {
  project_id: string
  account_id: string
  name: string
  role: string
  goal: string
  benefit: string
  demographics?: UserStoryDemographics | null
  created_by: string
  updated_at?: string
}
```

**Fields:**
- `name` - User story name (e.g., "As a customer")
- `role` - User role (e.g., "I want to reset my password")
- `goal` - User goal (e.g., "So that I can regain access to my account")
- `benefit` - Business/user benefit (e.g., "Reduces support tickets")
- `demographics` - Optional persona demographics (age, location, technical_skill, etc.)

## Constants

### USER_STORY_FIELDS (`/lib/constants.ts`)

```ts
export const USER_STORY_FIELDS = {
  NAME: 'name',
  ROLE: 'role',
  GOAL: 'goal',
  BENEFIT: 'benefit',
  DEMOGRAPHICS: 'demographics',
} as const
```

Note: User stories don't have status enums like features. The constants document the required fields.

## API Endpoints

### POST `/api/user-story`

Create a new user story for a project.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "projectId": "uuid",
  "name": "As a customer",
  "role": "I want to reset my password",
  "goal": "So that I can regain access to my account",
  "benefit": "Reduces support tickets and improves user experience",
  "demographics": {
    "age": "25-45",
    "location": "North America",
    "technical_skill": "intermediate"
  }
}
```

**Validation:**
- `projectId` (required) - Valid UUID, must belong to user's account
- `name` (required) - Non-empty string
- `role` (required) - Non-empty string
- `goal` (required) - Non-empty string
- `benefit` (required) - Non-empty string
- `demographics` (optional) - Object with any key-value pairs

**Response:**
```json
{
  "success": true,
  "data": {
    "userStory": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "name": "As a customer",
      "role": "I want to reset my password",
      "goal": "So that I can regain access to my account",
      "benefit": "Reduces support tickets and improves user experience",
      "demographics": { ... },
      "createdBy": {
        "_id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": null,
      "linkedTicketIds": []
    }
  }
}
```

**Implementation Details:**
- Validates all required fields
- Enforces account isolation
- Verifies project exists and belongs to user's account
- Sets `created_by` to current user
- Returns formatted response with creator info

### PUT `/api/user-story/:id`

Update an existing user story.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "name": "As a customer",
  "role": "I want to reset my password",
  "goal": "So that I can regain access to my account",
  "benefit": "Reduces support tickets and improves user experience",
  "demographics": {
    "age": "25-45",
    "location": "North America",
    "technical_skill": "intermediate"
  }
}
```

**Validation:**
- All fields are optional (only provided fields are updated)
- If provided, fields must be valid (non-empty strings)
- `demographics` can be null to remove demographics

**Response:**
```json
{
  "success": true,
  "data": {
    "userStory": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "name": "As a customer",
      "role": "I want to reset my password",
      "goal": "So that I can regain access to my account",
      "benefit": "Reduces support tickets and improves user experience",
      "demographics": { ... },
      "createdBy": { ... },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z",
      "linkedTicketIds": ["ticket-uuid-1", "ticket-uuid-2"]
    }
  }
}
```

**Implementation Details:**
- Partial updates supported (only provided fields updated)
- Updates `updated_at` timestamp
- Includes linked ticket IDs in response
- Enforces account isolation

### DELETE `/api/user-story/:id`

Delete a user story. Also removes all ticket-user story links via CASCADE.

**Permissions:** PM or Admin only

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User story deleted successfully"
  }
}
```

**Implementation Details:**
- Deletes user story
- CASCADE delete removes all ticket-user story links
- Enforces account isolation

### GET `/api/user-story/project/:id`

Get all user stories for a project.

**Permissions:** All authenticated users (project must belong to user's account)

**Response:**
```json
{
  "success": true,
  "data": {
    "userStories": [
      {
        "_id": "uuid",
        "id": "uuid",
        "projectId": "uuid",
        "name": "As a customer",
        "role": "I want to reset my password",
        "goal": "So that I can regain access to my account",
        "benefit": "Reduces support tickets and improves user experience",
        "demographics": { ... },
        "createdBy": { ... },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": null,
        "linkedTicketIds": ["ticket-uuid-1", "ticket-uuid-2"]
      }
    ]
  }
}
```

**Implementation Details:**
- Returns all user stories for the project
- Includes linked ticket IDs for each user story
- Ordered by creation date (newest first)
- Enforces account isolation

### POST `/api/feature/:id/assign-user-story`

Link a user story to a ticket (feature).

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "userStoryId": "uuid"
}
```

**Validation:**
- `userStoryId` (required) - Valid UUID
- User story must belong to the same project as the ticket
- User story and ticket must belong to user's account

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User story linked to ticket successfully",
    "ticketId": "uuid",
    "userStoryId": "uuid"
  }
}
```

**Implementation Details:**
- Creates link in `ticket_user_story` table
- Verifies user story belongs to same project as ticket
- Prevents duplicate links (composite primary key)
- Enforces account isolation

### DELETE `/api/feature/:id/assign-user-story`

Unlink a user story from a ticket (feature).

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "userStoryId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User story unlinked from ticket successfully",
    "ticketId": "uuid",
    "userStoryId": "uuid"
  }
}
```

**Implementation Details:**
- Deletes link from `ticket_user_story` table
- Enforces account isolation

### POST `/api/feature/:id/check-alignment`

Check how well a ticket aligns with user stories using AI analysis.

**Permissions:** All authenticated users (ticket must belong to user's account)

**Response:**
```json
{
  "success": true,
  "data": {
    "alignmentScore": 85,
    "suggestions": [
      "Consider adding acceptance criteria that matches the user story goal",
      "The ticket description could better reflect the user benefit"
    ],
    "matchedUserStories": [
      {
        "userStoryId": "uuid",
        "userStoryName": "As a customer",
        "relevanceScore": 90,
        "reasons": [
          "Ticket directly addresses the user story goal",
          "Acceptance criteria align with user story benefit"
        ]
      }
    ],
    "aiAnalysis": "The ticket shows strong alignment with the user story 'As a customer'. The description and acceptance criteria directly address the user's goal of resetting their password. The ticket would benefit from more explicit mention of the user benefit (reducing support tickets)."
  }
}
```

**Implementation Details:**
- Fetches all user stories for the ticket's project
- Calls Gemini AI to analyze alignment
- Returns alignment score (0-100)
- Provides suggestions for improving alignment
- Matches ticket to relevant user stories with relevance scores
- Returns AI-generated analysis
- If no user stories exist, returns score of 0 with suggestion to create user stories

## AI Integration

### Alignment Check Prompt (`/lib/prompts/alignment.ts`)

The alignment check uses Gemini AI to analyze ticket alignment with user stories.

**Input:**
- Ticket title, description, acceptance criteria
- Array of user stories with name, role, goal, benefit, demographics

**Output:**
- Alignment score (0-100)
- Suggestions for improving alignment
- Matched user stories with relevance scores and reasons
- AI analysis text

**Prompt Structure:**
- Analyzes ticket against all user stories
- Determines relevance of each user story
- Provides actionable suggestions
- Generates detailed analysis

### Gemini Integration (`/lib/gemini.ts`)

```ts
export async function checkTicketAlignment(input: AlignmentCheckInput)
```

- Uses `gemini-2.0-flash-lite` model
- Handles API errors gracefully
- Validates response structure
- Returns structured alignment data

## Type Definitions

### API Types (`/types/api.ts`)

```ts
export interface UserStoryResponse {
  _id: string
  id: string
  projectId: string
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
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt?: string
  linkedTicketIds?: string[]
}

export interface CreateUserStoryRequest {
  projectId: string
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
}

export interface UpdateUserStoryRequest {
  name?: string
  role?: string
  goal?: string
  benefit?: string
  demographics?: {
    age?: string
    location?: string
    technical_skill?: string
    [key: string]: any
  } | null
}

export interface TicketAlignmentResponse {
  alignmentScore: number // 0-100
  suggestions: string[]
  matchedUserStories: Array<{
    userStoryId: string
    userStoryName: string
    relevanceScore: number // 0-100
    reasons: string[]
  }>
  aiAnalysis: string
}
```

## Security & Permissions

### Account Isolation

All endpoints enforce account isolation:
- All queries filter by `account_id`
- User stories are scoped to account
- Ticket-user story links are scoped to account
- Users can only see/manage user stories in their account

### Permission Matrix

| Action | Viewer | Engineer | PM | Admin |
|--------|--------|----------|----|----|
| View user stories | ✅ | ✅ | ✅ | ✅ |
| Create user story | ❌ | ❌ | ✅ | ✅ |
| Update user story | ❌ | ❌ | ✅ | ✅ |
| Delete user story | ❌ | ❌ | ✅ | ✅ |
| Link user story to ticket | ❌ | ❌ | ✅ | ✅ |
| Unlink user story from ticket | ❌ | ❌ | ✅ | ✅ |
| Check ticket alignment | ✅ | ✅ | ✅ | ✅ |

### Validation

- UUID validation for all IDs
- Required field validation (name, role, goal, benefit)
- User story demographics validation (object with string/number/null values)
- Project existence and access checks
- User story-project relationship validation
- Ticket-project relationship validation

## Error Handling

All endpoints use standard error handling:
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Insufficient permissions or account mismatch
- `404 NOT_FOUND` - Project, user story, or ticket not found
- `400 BAD_REQUEST` - Invalid request data (missing fields, invalid UUID, user story belongs to different project)
- `500 INTERNAL_ERROR` - Database error or AI service error

## Real-time Support

The `user_stories` and `ticket_user_story` tables are enabled for Supabase Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_user_story;
```

Frontend can subscribe to user stories and ticket-user story links for live updates without polling.

## Workflow

1. **PM creates user story:**
   - Calls `POST /api/user-story`
   - Creates user story with name, role, goal, benefit, demographics
   - User story is linked to project

2. **PM links user story to ticket:**
   - Calls `POST /api/feature/:id/assign-user-story`
   - Creates link between ticket and user story
   - Ticket can have multiple user stories

3. **PM/Engineer checks alignment:**
   - Calls `POST /api/feature/:id/check-alignment`
   - AI analyzes ticket against all user stories in project
   - Returns alignment score, suggestions, and matched user stories

4. **PM updates user story:**
   - Calls `PUT /api/user-story/:id`
   - Updates user story fields
   - Linked tickets are unaffected

5. **PM deletes user story:**
   - Calls `DELETE /api/user-story/:id`
   - Deletes user story
   - CASCADE delete removes all ticket-user story links

## Testing Considerations

- Test user story CRUD operations
- Test ticket-user story linking/unlinking
- Test alignment check with various ticket descriptions
- Test permission enforcement (Viewers/Engineers cannot create/update/delete)
- Test account isolation (users cannot see other account's user stories)
- Test project relationship validation (user story must belong to same project as ticket)
- Test AI alignment check with no user stories
- Test real-time subscriptions
- Test demographics validation (optional field, flexible structure)

## Files Modified/Created

### Created
- `/models/UserStory.ts` - UserStory model
- `/app/api/user-story/route.ts` - Create endpoint
- `/app/api/user-story/[id]/route.ts` - Update and delete endpoints
- `/app/api/user-story/project/[id]/route.ts` - List endpoint
- `/app/api/feature/[id]/assign-user-story/route.ts` - Link/unlink endpoints
- `/app/api/feature/[id]/check-alignment/route.ts` - Alignment check endpoint
- `/lib/prompts/alignment.ts` - Alignment check prompt
- `/supabase/migration_add_user_stories.sql` - Database migration

### Modified
- `/lib/constants.ts` - Added `USER_STORY_FIELDS`
- `/lib/api/validation.ts` - Added user story validation functions
- `/lib/gemini.ts` - Added `checkTicketAlignment()` function
- `/types/api.ts` - Added user story API types
- `/types/database.ts` - Added database types for user stories
- `/docs/api.md` - Added API documentation

## Future Enhancements

- User story templates for common personas
- Bulk import/export of user stories
- User story versioning/history
- User story tags/categories
- User story metrics (how many tickets linked, alignment scores over time)
- Integration with roadmap generation (AI considers user stories when generating features)
- User story prioritization
- User story dependencies
- User story acceptance criteria templates

