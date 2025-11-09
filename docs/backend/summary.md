# ✅ Completed Features 

## 1. Backend Infrastructure

### BaseModel Pattern

All models extend:

```ts
interface BaseModel {
  id: string
  created_at: string
  updated_at?: string
}
```

### Models

`User`, `Project`, `Feature`, `Feedback`, `PendingChange`, `UserStory` with:

* account_id scoping
* roadmap data
* Jira-style ticket fields
* feedback analysis fields
* pending status change tracking (Phase 12)
* user story and persona tracking (Phase 11.5)

### Constants (`/lib/constants.ts`)

* Roles: admin, pm, engineer, viewer
* FeatureStatus
* PriorityLevels
* FeedbackStatus + Type
* RiskLevels
* Specializations
* TicketTypes
* PendingChangeStatus (Phase 12)
* UserStoryFields (Phase 11.5)
* DB mappings for all enums

### API Utilities (`/lib/api/`)

#### Permissions (`/lib/api/permissions.ts`)

**User Session:**
- `extractAccountIdFromSession(session): string` - Extract account_id from Auth0 session
- `getUserFromSession(session): Promise<User>` - Get or create user from session

**Role Checks:**
- `hasRole(user, requiredRoles): boolean` - Check if user has required role
- `requireRole(user, requiredRoles): void` - Throw if user doesn't have required role
- `isPMOrAdmin(user): boolean` - Check if user is PM or Admin
- `requirePMOrAdmin(user): void` - Throw if not PM or Admin

**Project Access:**
- `canViewProject(user, projectId): Promise<boolean>` - Check view access
- `canEditProject(user, projectId): Promise<boolean>` - Check edit access
- `canAssignTasks(user, projectId): Promise<boolean>` - Check task assignment permission
- `canApproveProposals(user, projectId): Promise<boolean>` - Check proposal approval permission
- `requireProjectAccess(user, projectId): Promise<void>` - Throw if no access
- `requireProjectEdit(user, projectId): Promise<void>` - Throw if cannot edit
- `requireTaskAssignment(user, projectId): Promise<void>` - Throw if cannot assign
- `requireProposalApproval(user, projectId): Promise<void>` - Throw if cannot approve

**Ownership:**
- `isOwner(user, resourceCreatedBy): boolean` - Check if user owns resource
- `requireOwnerOrAdmin(user, resourceCreatedBy): void` - Throw if not owner or admin

#### Validation (`/lib/api/validation.ts`)

**Basic Validation:**
- `validateUUID(id, fieldName): void` - Validate UUID format
- `validateRequired(data, fields[]): void` - Check required fields
- `validateEmail(email): void` - Validate email format
- `validateJsonBody<T>(request): Promise<T>` - Parse and validate JSON body
- `sanitizeString(input): string` - Basic XSS prevention (removes < >)

**Domain Validation:**
- `validateRole(role): void` - Validate user role
- `validateSpecialization(spec): void` - Validate engineer specialization
- `validateVacationDates(dates): void` - Validate vacation date ranges
- `validateFeatureStatus(status): void` - Validate feature status (DB format)
- `validateFeatureStatusApi(status): void` - Validate feature status (API format)
- `validatePriority(priority): void` - Validate priority (API format)
- `validateFeedbackType(type): void` - Validate feedback type (API format)
- `validateFeedbackStatus(status): void` - Validate feedback status
- `validateTicketType(type): void` - Validate Jira ticket type
- `validateStoryPoints(points): void` - Validate story points (non-negative integer)
- `validateLabels(labels): void` - Validate labels array
- `validateRiskLevel(level): void` - Validate risk level
- `validateUserStory(data): void` - Validate user story fields (Phase 11.5)
- `validateUserStoryDemographics(demographics): void` - Validate demographics object (Phase 11.5)

**Format Conversion (Critical for DB/API translation):**
- `priorityToDb(apiPriority): string` - Convert API priority to DB format (`critical` → `P0`)
- `priorityToApi(dbPriority): string` - Convert DB priority to API format (`P0` → `critical`)
- `statusToDb(apiStatus): string` - Convert API status to DB format (`not_started` → `backlog`)
- `statusToApi(dbStatus): string` - Convert DB status to API format (`backlog` → `not_started`)
- `feedbackTypeToDb(apiType): string` - Convert API feedback type to DB format (`timeline_proposal` → `proposal`)
- `feedbackTypeToApi(dbType): string` - Convert DB feedback type to API format (`proposal` → `timeline_proposal`)

#### Errors (`/lib/api/errors.ts`)

**Error Class:**
- `APIError` - Custom error class with statusCode and code

**Predefined Errors:**
- `APIErrors.unauthorized()` - 401 UNAUTHORIZED
- `APIErrors.forbidden(message?)` - 403 FORBIDDEN
- `APIErrors.notFound(resource?)` - 404 NOT_FOUND
- `APIErrors.badRequest(message)` - 400 BAD_REQUEST
- `APIErrors.internalError(message?)` - 500 INTERNAL_ERROR

**Helpers:**
- `handleError(error): Response` - Convert error to JSON response
- `successResponse<T>(data, status?): Response` - Create success response

### Prompts (`/lib/prompts/`)

* roadmap, feedback, comparison, assignment

### Gemini Integration (`/lib/gemini.ts`)

* `generateRoadmap`
* `analyzeProposal`
* `compareRoadmaps`
* `suggestAssignment`

### Types

API responses, DB schema, roadmap types, feedback types, team types.

---

## 2. Error Handling Enhancements

* Centralized error formatting
* Preserved error messages
* Gemini error patterns handled
* Validation on AI JSON structure
* API-consistent response wrapper:

```ts
{ success: boolean; data?: T; error?: string; code?: string }
```

---

## 3. API Routes

### Projects

* `GET /api/projects`
* `GET /api/project/:id`

### Roadmap

* `POST /api/roadmap/generate`

### Features

* `PATCH /api/feature/:id`
* `POST /api/feature/create`

### Feedback

* `POST /api/feedback/create`
* `POST /api/feedback/approve`
* `POST /api/feedback/reject`

### Team / User

* `GET /api/user/profile` / `PATCH /api/user/profile`
* `GET /api/team/members`
* `GET /api/team/members/available`

### Assignment

* `POST /api/feature/suggest-assignee`

---

## 4. Account Isolation & Permissions (Phase 4)

### Account Isolation

* Added `account_id` to all tables
* Extracted from Auth0 session metadata
* All queries filtered by `account_id`
* All routes enforce scoping

### Permission System

* Viewer → read only
* Engineer → feedback create
* PM → edit project, assign tasks, approve proposals
* Admin → full access
* New helpers: `canViewProject`, `canEditProject`, `canAssignTasks`, `canApproveProposals`

---

## 5. User Roles & Team Management (Phase 5)

* Specialization (Backend, Frontend, QA, DevOps)
* Vacation date ranges (JSONB)
* Workload metrics dynamically computed
* Endpoints: `/api/user/profile`, `/api/team/members`

---

## 6. Jira-Style Ticket Model (Phase 6)

Feature fields added:

* `assigned_to`, `reporter`
* `story_points`
* `labels`
* `acceptance_criteria`
* `ticket_type` (feature/bug/epic/story)

Validation: TicketType, StoryPoints, Labels

Roadmap AI now outputs Jira-style fields.

---

## 7. Timeline Engine & Gantt (Phase 7)

Feature timeline fields:

* `start_date`, `end_date`, `duration`

### Timeline Utilities (`/lib/api/timeline.ts`)

**Main Function:**
- `calculateTimeline(features: Feature[]): TimelineCalculation` - Complete timeline calculation

**Core Functions:**
- `calculateDuration(startDate, endDate): number` - Calculate days between dates
- `calculateEndDate(startDate, durationDays): string` - Calculate end date from start + duration
- `calculateStartDate(endDate, durationDays): string` - Calculate start date from end + duration
- `checkOverlap(start1, end1, start2, end2): number` - Calculate overlap days between two date ranges

**Dependency Analysis:**
- `buildDependencyChains(features): DependencyChain[]` - Build dependency chains from features
  - Detects circular dependencies
  - Calculates chain depth
  - Returns array of chains with feature IDs in order

**Critical Path:**
- `calculateCriticalPath(features): CriticalPath | null` - Calculate critical path using longest path algorithm
  - Uses forward pass (earliest start/end) and backward pass (latest start/end)
  - Identifies features where earliest = latest (critical path)
  - Returns path array, total duration, start/end dates

**Milestones:**
- `calculateMilestones(features): Milestone[]` - Calculate milestones from feature completion dates
  - Groups features by completion date
  - Returns array with date, feature IDs, and description

**Overlaps:**
- `calculateOverlaps(features): Overlap[]` - Calculate overlaps between all feature pairs
  - Returns array of feature pairs with overlap days

**TimelineCalculation Interface:**
```ts
{
  features: FeatureWithTimeline[]
  dependencyChains: DependencyChain[]
  criticalPath: CriticalPath | null
  milestones: Milestone[]
  overlaps: Overlap[]
}
```

Project endpoint now returns full timeline graph with all calculations.

---

## 8. Team Workload & Availability (Phase 8)

### Workload Calculation (`/lib/api/workload.ts`)

**Function:**
- `calculateUserWorkload(userId, accountId): WorkloadMetrics` - Calculate user workload
  - Queries features where `assigned_to = userId`
  - Filters by `account_id` for account isolation
  - Excludes completed features (`status != 'complete'`)
  - Returns `{ ticketCount: number, storyPointCount: number }`

**Vacation Check:**
- `isUserOnVacation(vacationDates): boolean` - Check if user is currently on vacation
  - Checks if today falls within any vacation date range
  - Returns `true` if user is on vacation today

**Endpoints:**
* `/api/team/members` - Returns all members with workload metrics
* `/api/team/members/available` - Filters out users currently on vacation

---

## 9. AI Smart Assignment Suggestions (Phase 9)

* Gemini-powered ranking of best assignees
* Inputs: task, specialization, workload, vacation, team context
* Output: ranked list + reasoning + confidence
* Endpoint: `/api/feature/suggest-assignee`

---

## 10. Feedback & Proposal System (Phase 10)

* Feedback types: `comment`, `timeline_proposal`
* AI analysis generated automatically
* PM/Admin approval & rejection workflows
* Roadmap diffs computed via Gemini on approval

---

## 11. AI-Powered Chatbot for Ticket Generation (Phase 11)

### Chat Types (`/types/chat.ts`)

* `ChatMessage` - Message in conversation history (role, content, timestamp)
* `ChatContext` - Chat context with projectId, conversationHistory, generatedTickets
* `SuggestedTicket` - AI-suggested ticket with all fields and confidence score
* `ChatResponse` - AI response with message and suggested tickets

### Chatbot Prompts (`/lib/prompts/chatbot.ts`)

* `getChatbotPrompt()` - Generate conversational prompt for ticket generation
* `parseChatbotResponse()` - Parse and validate AI chatbot response
* Supports conversational commands: "add auth to sprint 2", "change priority of ticket 3"
* References existing features in project context
* Suggests assignments based on engineer availability

### Gemini Integration (`/lib/gemini.ts`)

* `chatWithAI()` - Chat with AI for conversational ticket generation
* Accepts conversation history + new message
* Returns AI response + updated ticket suggestions
* Handles errors gracefully with descriptive messages

### API Routes

**`POST /api/chat/generate-tickets`**
* Accepts: projectId, message, conversationHistory (from localStorage)
* Returns: AI response, suggested tickets (array), confidence scores
* Requires: PM/Admin permissions
* Enforces: Account isolation
* Features:
  - Understands conversational commands
  - References existing features
  - Suggests appropriate assignments
  - Maintains conversation context

**`POST /api/chat/apply-tickets`**
* Accepts: projectId, tickets[] (from chat suggestions)
* Bulk creates tickets with AI-suggested assignments
* Returns: created ticket IDs
* Requires: PM/Admin permissions
* Enforces: Account isolation
* Features:
  - Bulk creates multiple tickets in single operation
  - Automatically suggests assignments if not provided
  - Validates dependencies against existing features
  - Creates tickets with all Jira-style fields

---

## 12. Drag-and-Drop with Two-Way Confirmation (Phase 12)

### PendingChange Model (`/models/PendingChange.ts`)

* `feature_id` - Feature UUID
* `proposed_by` - User ID who proposed the change
* `from_status` - Current status (DB format)
* `to_status` - Proposed status (DB format)
* `status` - Pending change status: `pending`, `approved`, `rejected`
* `account_id` - Account isolation
* `rejection_reason` - Optional reason for rejection

### Database Schema

**`pending_changes` Table:**
* Created via migration: `/supabase/migration_add_pending_changes.sql`
* Indexes on: `feature_id`, `account_id`, `proposed_by`, `status`, `created_at`
* CASCADE delete when feature is deleted
* Status validation via CHECK constraint

### Constants

* `PENDING_CHANGE_STATUS` - `PENDING`, `APPROVED`, `REJECTED`

### API Routes

**`POST /api/feature/:id/propose-status-change`**
* Proposes a status change for a feature
* Creates pending change record with status "pending"
* Permissions: Engineers, PMs, Admins (Viewers cannot propose)
* Validation: New status must differ from current, only one pending change per feature
* Returns: PendingChangeResponse with proposer info

**`POST /api/feature/:id/approve-status-change`**
* Approves a pending status change and applies it to the feature
* Updates pending change status to "approved"
* Updates feature status to proposed status
* Permissions: PM or Admin only
* Includes rollback logic if feature update fails
* Returns: Updated pending change and feature

**`POST /api/feature/:id/reject-status-change`**
* Rejects a pending status change
* Updates pending change status to "rejected"
* Stores optional rejection reason
* Does not modify feature status
* Permissions: PM or Admin only
* Returns: Rejected pending change with reason

**`GET /api/project/:id/pending-changes`**
* Returns all pending status changes for features in a project
* Used for notification counters and approval UI
* Permissions: All authenticated users
* Filters by project's features via account isolation
* Returns only pending changes (status = "pending")
* Includes proposer user information
* Ordered by creation date (newest first)

### Type Definitions (`/types/api.ts`)

* `ProposeStatusChangeRequest` - Request to propose status change
* `PendingChangeResponse` - Pending change with proposer info
* `ProposeStatusChangeResponse` - Response with pending change
* `ApproveStatusChangeRequest` - Request to approve change
* `ApproveStatusChangeResponse` - Response with approved change and updated feature
* `RejectStatusChangeRequest` - Request to reject change (with optional reason)
* `RejectStatusChangeResponse` - Response with rejected change
* `GetPendingChangesResponse` - Response with array of pending changes

### Security & Permissions

* Account isolation enforced on all endpoints
* Permission matrix: Engineers/PMs/Admins can propose, only PMs/Admins can approve/reject
* Validation: Status validation, UUID validation, feature existence checks
* Prevents duplicate pending changes per feature

### Format Conversion

* Status values converted between API and DB formats using `statusToDb()` and `statusToApi()`
* API format: `not_started`, `in_progress`, `blocked`, `complete`
* DB format: `backlog`, `active`, `blocked`, `complete`

### Real-time Support

* `pending_changes` table enabled for Supabase Realtime
* Frontend can subscribe to pending changes for live updates

### Workflow

1. Engineer/PM proposes change → Creates pending change record
2. PM/Admin reviews → Lists pending changes via GET endpoint
3. PM/Admin approves → Updates pending change and feature status
4. PM/Admin rejects → Updates pending change status with optional reason

---

## 11.5. User Stories & Personas (Phase 11.5)

### UserStory Model (`/models/UserStory.ts`)

* `project_id` - Project UUID
* `account_id` - Account isolation
* `name` - User story name (e.g., "As a customer")
* `role` - User role (e.g., "I want to reset my password")
* `goal` - User goal (e.g., "So that I can regain access to my account")
* `benefit` - Business/user benefit (e.g., "Reduces support tickets")
* `demographics` - Optional persona demographics (JSONB)
* `created_by` - User ID who created the user story

### Database Schema

**`user_stories` Table:**
* Created via migration: `/supabase/migration_add_user_stories.sql`
* Indexes on: `project_id`, `account_id`, `created_by`
* CASCADE delete when project is deleted
* JSONB demographics for flexible persona data

**`ticket_user_story` Join Table:**
* Many-to-many relationship between tickets (features) and user stories
* Composite primary key: `(ticket_id, user_story_id)`
* CASCADE delete when ticket or user story is deleted
* Account isolation via `account_id`

### Constants

* `USER_STORY_FIELDS` - Field names: `NAME`, `ROLE`, `GOAL`, `BENEFIT`, `DEMOGRAPHICS`

### API Routes

**`POST /api/user-story`**
* Create a new user story for a project
* Permissions: PM or Admin only
* Validation: All required fields (name, role, goal, benefit)
* Returns: UserStoryResponse with creator info

**`PUT /api/user-story/:id`**
* Update an existing user story
* Permissions: PM or Admin only
* Partial updates supported (only provided fields updated)
* Returns: Updated UserStoryResponse with linked ticket IDs

**`DELETE /api/user-story/:id`**
* Delete a user story
* Permissions: PM or Admin only
* CASCADE delete removes all ticket-user story links
* Returns: Success message

**`GET /api/user-story/project/:id`**
* Get all user stories for a project
* Permissions: All authenticated users
* Returns: Array of UserStoryResponse with linked ticket IDs
* Ordered by creation date (newest first)

**`POST /api/feature/:id/assign-user-story`**
* Link a user story to a ticket (feature)
* Permissions: PM or Admin only
* Validation: User story must belong to same project as ticket
* Returns: Success message with ticket and user story IDs

**`DELETE /api/feature/:id/assign-user-story`**
* Unlink a user story from a ticket (feature)
* Permissions: PM or Admin only
* Returns: Success message with ticket and user story IDs

**`POST /api/feature/:id/check-alignment`**
* Check how well a ticket aligns with user stories using AI analysis
* Permissions: All authenticated users
* Uses Gemini AI to analyze alignment
* Returns: Alignment score (0-100), suggestions, matched user stories, AI analysis
* If no user stories exist, returns score of 0 with suggestion to create user stories

### Type Definitions (`/types/api.ts`)

* `UserStoryResponse` - User story with creator info and linked ticket IDs
* `CreateUserStoryRequest` - Request to create user story
* `UpdateUserStoryRequest` - Request to update user story (all fields optional)
* `GetUserStoriesResponse` - Response with array of user stories
* `AssignUserStoryToTicketRequest` - Request to link user story to ticket
* `AssignUserStoryToTicketResponse` - Response with success message
* `UnassignUserStoryFromTicketRequest` - Request to unlink user story from ticket
* `UnassignUserStoryFromTicketResponse` - Response with success message
* `CheckTicketAlignmentRequest` - Request to check alignment (no body, uses ticket ID)
* `TicketAlignmentResponse` - Response with alignment score, suggestions, matched user stories, AI analysis

### AI Integration

**Alignment Check (`/lib/prompts/alignment.ts`):**
* Uses Gemini AI to analyze ticket alignment with user stories
* Input: Ticket title, description, acceptance criteria, array of user stories
* Output: Alignment score (0-100), suggestions, matched user stories with relevance scores, AI analysis
* Integrated via `checkTicketAlignment()` function in `/lib/gemini.ts`

### Security & Permissions

* Account isolation enforced on all endpoints
* Permission matrix: Viewers/Engineers can view and check alignment, only PMs/Admins can create/update/delete/link
* Validation: UUID validation, required field validation, project relationship validation
* User story must belong to same project as ticket when linking

### Real-time Support

* `user_stories` table enabled for Supabase Realtime
* `ticket_user_story` table enabled for Supabase Realtime
* Frontend can subscribe to user stories and ticket-user story links for live updates

### Workflow

1. PM creates user story → Calls POST /api/user-story
2. PM links user story to ticket → Calls POST /api/feature/:id/assign-user-story
3. PM/Engineer checks alignment → Calls POST /api/feature/:id/check-alignment
4. PM updates user story → Calls PUT /api/user-story/:id
5. PM deletes user story → Calls DELETE /api/user-story/:id (CASCADE removes links)

### Validation Functions

* `validateUserStory(data): void` - Validate user story fields (name, role, goal, benefit)
* `validateUserStoryDemographics(demographics): void` - Validate demographics object

---

# ✅ Key Implementation Patterns (Keep for Agent Alignment)

### Error Handling

```ts
try {
  return successResponse(data)
} catch (err) {
  return handleError(err)
}
```

### Validation

```ts
const body = await validateJsonBody<T>(req)
validateRequired(body, ['field'])
validateUUID(body.id, 'ID')
```

### Permission Checks

```ts
const user = await getUserFromSession(session)
requirePMOrAdmin(user)
await requireProjectAccess(user, projectId)
```

### Account Isolation Pattern

**Every database query must filter by account_id:**

```ts
const user = await getUserFromSession(session)
const supabase = createServerClient()

// ✅ CORRECT
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('account_id', user.account_id)

// ❌ WRONG - Missing account_id filter
const { data } = await supabase
  .from('projects')
  .select('*')
```

**Account ID Extraction:**
- Extracted from Auth0 session metadata in this order:
  1. `session.user.app_metadata.account_id` (preferred)
  2. `session.user.user_metadata.account_id` (fallback)
  3. `session.user.org_id` (if using Auth0 Organizations)
  4. Generated from `auth0_id` + email domain (development fallback)

### Format Conversion Pattern

**Always use conversion functions when reading/writing to database:**

```ts
// Reading from database
const dbStatus = feature.status // 'backlog'
const apiStatus = statusToApi(dbStatus) // 'not_started'

// Writing to database
const apiPriority = body.priority // 'critical'
const dbPriority = priorityToDb(apiPriority) // 'P0'
await supabase.from('features').update({ priority: dbPriority })
```

**Critical:** Never hardcode DB values. Always use conversion functions.

### AI Integration Patterns

**Gemini Module (`/lib/gemini.ts`):**
- Default model: `gemini-2.0-flash-lite`
- All functions handle errors and return structured data

**Error Handling:**
- API key errors → `APIErrors.internalError('Invalid or missing Gemini API key...')`
- Rate limiting → `APIErrors.internalError('Gemini API quota exceeded...')`
- Model errors → `APIErrors.internalError('Gemini model not available...')`
- Response blocking → Error with `blockedReason`
- Empty responses → Error with descriptive message

**Usage Pattern:**
```ts
import { generateRoadmap } from '@/lib/gemini'

try {
  const roadmapData = await generateRoadmap(projectName, projectDescription)
  // Use roadmapData
} catch (error) {
  // Error already formatted as APIError
  return handleError(error)
}
```

**Chat Pattern (Phase 11):**
```ts
import { chatWithAI } from '@/lib/gemini'
import type { ChatMessage } from '@/types/chat'

const chatResponse = await chatWithAI({
  projectId: 'uuid',
  projectName: 'Project Name',
  projectDescription: 'Project description',
  message: 'Add authentication feature',
  conversationHistory: [] as ChatMessage[],
  existingFeatures: [],
  availableEngineers: [],
})
// chatResponse contains: message, suggestedTickets, confidenceScores
```

## Common Patterns

### Complete API Route Pattern

```ts
import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requirePMOrAdmin, requireProjectAccess } from '@/lib/api/permissions'
import { validateJsonBody, validateRequired, validateUUID } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { statusToDb, priorityToDb } from '@/lib/api/validation'

export async function POST(request: NextRequest) {
  try {
    // 1. Get session and user
    const session = await getSession()
    const user = await getUserFromSession(session)

    // 2. Validate permissions
    requirePMOrAdmin(user)

    // 3. Validate request body
    const body = await validateJsonBody<RequestType>(request)
    validateRequired(body, ['field1', 'field2'])
    validateUUID(body.projectId, 'Project ID')

    // 4. Check project access
    await requireProjectAccess(user, body.projectId)

    // 5. Get Supabase client
    const supabase = createServerClient()

    // 6. Convert API format to DB format
    const dbStatus = statusToDb(body.status)
    const dbPriority = priorityToDb(body.priority)

    // 7. Query with account isolation
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('account_id', user.account_id)
      .eq('id', body.id)

    if (error || !data) {
      throw APIErrors.notFound('Resource')
    }

    // 8. Return success response
    return successResponse({ data })
  } catch (error) {
    return handleError(error)
  }
}
```

### Update Pattern with Format Conversion

```ts
// Get feature from DB (DB format)
const { data: feature } = await supabase
  .from('features')
  .select('*')
  .eq('id', featureId)
  .eq('account_id', user.account_id)
  .single()

// Convert to API format for response
const apiFeature = {
  ...feature,
  status: statusToApi(feature.status),
  priority: priorityToApi(feature.priority),
}

// Update with conversion
const updates = {
  status: statusToDb(body.status),
  priority: priorityToDb(body.priority),
}
await supabase.from('features').update(updates).eq('id', featureId)
```

## Gotchas & Common Mistakes

1. **Forgetting account_id filter** - Always include `.eq('account_id', user.account_id)` in queries
2. **Hardcoding DB values** - Never use `'backlog'` or `'P0'` directly. Use conversion functions
3. **Missing format conversion** - Always convert between DB and API formats
4. **Not validating permissions** - Always check permissions before allowing operations
5. **Missing error handling** - Always wrap in try/catch and use `handleError()`
6. **Not validating request body** - Always validate with `validateJsonBody()` and `validateRequired()`
7. **Using wrong validation function** - Use `validateFeatureStatusApi()` for API format, `validateFeatureStatus()` for DB format
8. **Not checking project access** - Always use `requireProjectAccess()` before accessing project resources
