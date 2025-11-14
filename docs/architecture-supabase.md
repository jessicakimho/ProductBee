# AI Roadmap Dashboard – Supabase Architecture (Agent-Oriented)

**Project:** AI-Powered PM Roadmap Dashboard
**Goal:** Enable structured AI-mediated PM–Engineer collaboration with actionable timelines.

---

## 1️⃣ Tech Stack

* **Frontend:** Next.js 14+ (App Router), React 18+, TypeScript, Tailwind, Lucide React
* **Backend:** Next.js API Routes, Supabase/PostgreSQL, Auth0
* **AI Provider:** Google Gemini (gemini-2.0-flash-lite - default model)
* **Deployment:** Vercel + Supabase free tier
* **Real-time:** Supabase Realtime subscriptions for live updates

> **Agent Note:** Know role responsibilities: Viewer (read), Engineer (feedback), PM (approve/assign), Admin (full).

### Environment Variables

All environment variables are required. See `/ENV_TEMPLATE.md` for setup instructions.

**Auth0:**
- `AUTH0_SECRET` - Secret for session encryption
- `AUTH0_BASE_URL` - Base URL (e.g., `http://localhost:3000`)
- `AUTH0_ISSUER_BASE_URL` - Auth0 tenant URL
- `AUTH0_CLIENT_ID` - Auth0 application client ID
- `AUTH0_CLIENT_SECRET` - Auth0 application client secret

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key

**AI:**
- `GEMINI_API_KEY` - Google Gemini API key

> **Critical:** Never commit `.env.local` to version control. All variables must be set for the application to function.

---

## 2️⃣ Core File Ownership

| Agent        | Scope                                                                               |
| ------------ | ----------------------------------------------------------------------------------- |
| **Backend**  | `/app/api/**`, `/models/**`, `/lib/**`, `/types/**`, `/middleware.ts`               |
| **Frontend** | `/app/**/page.tsx`, `/components/**`, `/hooks/**`, `/public/**`, `/app/globals.css` |
| **Shared**   | `/types/**`, `/lib/constants.ts`                                                    |

> Only modify `package.json` or `.env` if explicitly allowed.

---

## 3️⃣ Supabase Models

### Type System Hierarchy

The codebase uses three layers of types:

1. **Database Types** (`/types/database.ts`) - Raw database schema (snake_case, DB enum values)
2. **Model Types** (`/models/**`) - Application models (camelCase, API enum values)
3. **API Types** (`/types/api.ts`) - Request/response types for API layer

**Example transformation:**
```ts
// Database (snake_case, DB values)
DatabaseFeature { status: 'backlog', priority: 'P0' }

// Model (camelCase, API values)
Feature { status: 'not_started', priority: 'critical' }

// API Response (camelCase, API values, with _id for compatibility)
FeatureResponse { status: 'not_started', priority: 'critical', _id: '...', id: '...' }
```

### BaseModel

All models extend `BaseModel`:

```ts
interface BaseModel { 
  id: string
  created_at: string
  updated_at?: string
}
```

### Model Definitions

**User** (`/models/User.ts`):
- `auth0_id`, `email`, `name`, `role`, `account_id`, `team_id`
- `specialization?` (Backend/Frontend/QA/DevOps)
- `vacation_dates?` (JSONB array: `[{start: string, end: string}]`)

**Project** (`/models/Project.ts`):
- `name`, `description`, `created_by`, `account_id`, `team_id`
- `roadmap` (JSONB: `{summary: string, riskLevel: 'low'|'medium'|'high'}`)

**Feature** (`/models/Feature.ts`):
- `project_id`, `account_id`, `title`, `description`
- `status` (API: `not_started|in_progress|blocked|complete`)
- `priority` (API: `critical|high|medium|low`)
- `dependencies?` (UUID array)
- `estimated_effort_weeks?`
- **Jira fields:** `assigned_to?`, `reporter?`, `story_points?`, `labels?`, `acceptance_criteria?`, `ticket_type?`
- **Timeline fields:** `start_date?`, `end_date?`, `duration?`

**Feedback** (`/models/Feedback.ts`):
- `project_id`, `feature_id`, `user_id`, `account_id`
- `type` (API: `comment|timeline_proposal`)
- `content`, `proposed_roadmap?`, `ai_analysis?`
- `status` (`pending|approved|rejected`)

**UserStory** (`/models/UserStory.ts`):
- `project_id?` (optional - user stories are global, account-scoped)
- `account_id`, `name`, `role`, `goal`, `benefit`
- `demographics?` (JSONB object)
- `created_by`, `created_at`, `updated_at`

**PendingChange** (`/models/PendingChange.ts`):
- `feature_id`, `proposed_by`, `account_id`
- `from_status`, `to_status`
- `status` (`pending|approved|rejected`)
- `rejection_reason?`

> **Agent Note:** Understand relationships: Project → Feature → Feedback. User stories are global (account-scoped) and can optionally be associated with a project. Always use conversion functions when reading/writing to database. See Constants section for format mappings.

---

## 4️⃣ API Patterns

### Route Structure

All API routes are in `/app/api/**`:
- `/api/projects` - List all projects
- `/api/project/[id]` - Get single project with features and feedback
- `/api/roadmap/generate` - AI-generated roadmap
- `/api/feature/[id]` - Update feature
- `/api/feature/create` - Create feature
- `/api/feature/suggest-assignee` - AI assignment suggestions
- `/api/feedback/create` - Create feedback/proposal
- `/api/feedback/approve` - Approve proposal (PM/Admin only)
- `/api/feedback/reject` - Reject proposal (PM/Admin only)
- `/api/user/profile` - Get/update user profile
- `/api/team/members` - Get team members
- `/api/team/members/available` - Get available team members (excludes vacation)

### Standard Error Handling Pattern

All API routes follow this pattern:

```ts
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'

export async function GET(request: NextRequest) {
  try {
    // ... your logic
    return successResponse(data)
  } catch (error) {
    return handleError(error)
  }
}
```

### Error Response Format

All errors return this structure:

```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

**Error Codes:**
- `UNAUTHORIZED` (401) - Not authenticated
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `BAD_REQUEST` (400) - Invalid request data
- `INTERNAL_ERROR` (500) - Server error

**Success Response Format:**

```json
{
  "success": true,
  "data": { /* response data */ }
}
```

### Account Isolation Pattern

**Every database query must filter by `account_id`:**

```ts
const user = await getUserFromSession(session)
const supabase = createServerClient()

// ✅ CORRECT - Always filter by account_id
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

The `extractAccountIdFromSession()` function (in `/lib/api/permissions.ts`) extracts `account_id` from Auth0 session in this order:
1. `session.user.app_metadata.account_id` (preferred)
2. `session.user.user_metadata.account_id` (fallback)
3. `session.user.org_id` (if using Auth0 Organizations)
4. Generated from `auth0_id` + email domain (development fallback)

> **Critical:** All queries must include `.eq('account_id', user.account_id)` to enforce account isolation.

### Permission Checks

Use permission helpers from `/lib/api/permissions.ts`:

```ts
import { getUserFromSession, requireProjectAccess, requirePMOrAdmin } from '@/lib/api/permissions'

const user = await getUserFromSession(session)
requirePMOrAdmin(user) // Throws if not PM or Admin
await requireProjectAccess(user, projectId) // Throws if no access
```

**Available Permission Functions:**
- `canViewProject(user, projectId)` - Check view access
- `canEditProject(user, projectId)` - Check edit access
- `canAssignTasks(user, projectId)` - Check task assignment permission
- `canApproveProposals(user, projectId)` - Check proposal approval permission
- `requireProjectAccess(user, projectId)` - Throw if no access
- `requireProjectEdit(user, projectId)` - Throw if cannot edit
- `requireTaskAssignment(user, projectId)` - Throw if cannot assign
- `requireProposalApproval(user, projectId)` - Throw if cannot approve

### Validation Pattern

Always validate request data:

```ts
import { validateJsonBody, validateRequired, validateUUID } from '@/lib/api/validation'

const body = await validateJsonBody<RequestType>(request)
validateRequired(body, ['field1', 'field2'])
validateUUID(body.id, 'ID')
```

> All endpoints enforce **account isolation** and **role-based permissions**.

---

## 5️⃣ Prompts & AI Integration

### AI Module Structure

**Main module:** `/lib/gemini.ts`
- Uses Google Gemini API (`@google/generative-ai`)
- Default model: `gemini-2.0-flash-lite`
- All functions handle errors and return structured data

**Available Functions:**
- `generateRoadmap(projectName, projectDescription)` - Generate project roadmap
- `analyzeProposal(proposalContent, originalRoadmap)` - Analyze engineer proposals
- `compareRoadmaps(originalRoadmap, proposedRoadmap)` - Compare roadmap changes
- `suggestAssignment(input)` - AI-powered assignee suggestions

### Prompt Modules

**Prompts directory:** `/lib/prompts/`
- `roadmap.ts` - Roadmap generation prompts
- `feedback.ts` - Proposal analysis prompts
- `comparison.ts` - Roadmap comparison prompts
- `assignment.ts` - Assignment suggestion prompts

### Error Handling

All AI functions handle:
- API key errors
- Rate limiting/quota errors
- Model availability errors
- Response blocking
- Empty responses

Errors are converted to `APIErrors.internalError()` with descriptive messages.

### Usage Pattern

```ts
import { generateRoadmap } from '@/lib/gemini'

try {
  const roadmapData = await generateRoadmap(projectName, projectDescription)
  // roadmapData contains: { summary, riskLevel, features: [...] }
} catch (error) {
  // Error already formatted as APIError
  throw error
}
```

> Agent note: use prompts modularly; roadmap generation, feedback analysis, or assignee suggestions rely on these. Always handle AI errors gracefully.

---

## 6️⃣ Frontend Patterns

### Server vs Client Components

**Server Components** (`/app/**/page.tsx`):
- Fetch data directly from Supabase using `createServerClient()`
- Handle authentication and session management
- Pass data as props to client components
- Cannot use hooks, state, or browser APIs

**Client Components** (`'use client'` directive):
- Handle interactivity, state, and user input
- Use hooks for data fetching and mutations
- Can use browser APIs and event handlers
- Must be in `/components/**` or marked with `'use client'`

### Component Organization

Feature-based structure in `/components/`:
- `/dashboard/` - `DashboardClient.tsx`, `ProjectCard.tsx`
- `/project/` - `ProjectDetailClient.tsx`, `FeatureCard.tsx`, `FeatureModal.tsx`, `GanttView.tsx`, `ViewToggle.tsx`
- `/feedback/` - `FeedbackThread.tsx`, `ProposalApprovalView.tsx`
- `/modals/` - `CreateProjectModal.tsx`
- `/onboarding/` - `OnboardingForm.tsx`
- `/team/` - `TeamMembersList.tsx`

### Custom Hooks

All hooks are in `/hooks/`:
- `useProject.ts` - `useProjects()`, `useProject(projectId)` - Real-time project data
- `useFeature.ts` - `updateFeature()`, `updateFeatureStatus()`, `updateFeaturePriority()`, `createFeature()`
- `useFeedback.ts` - `createFeedback()`, `approveFeedback()`, `rejectFeedback()`
- `useUserProfile.ts` - `fetchProfile()`, `updateProfile()`
- `useTeamMembers.ts` - `fetchTeamMembers()`

### API Response Handling

**All API responses are wrapped:**
```ts
{
  success: boolean,
  data?: T,
  error?: string,
  code?: string
}
```

**Standard pattern in hooks:**
```ts
const response = await fetch('/api/endpoint')
const responseData = await response.json()

if (!response.ok || !responseData.success) {
  throw new Error(responseData.error || 'Request failed')
}

const data = responseData.data // Unwrap the data
```

### Real-time Subscriptions

Supabase real-time is used for live updates. Example from `useProject`:

```ts
const channel = supabase
  .channel('projects-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'projects',
  }, () => {
    fetchProjects() // Refresh on change
  })
  .subscribe()

// Cleanup
return () => {
  supabase.removeChannel(channel)
}
```

> **Important:** Always clean up subscriptions in `useEffect` return function to prevent memory leaks.

> Agents need to know **component hierarchy + hooks** for data access and updates.

---

## 7️⃣ Documentation Guidelines

* **All endpoints documented**: `/docs/api.md`
* **Agent-specific summaries**: `/docs/frontend/summary.md`, `/docs/backend/summary.md`
* **Development phases & architecture**: `/docs/phases.md`, `/docs/architecture-supabase.md`

> Agents must reference docs for API conventions, naming, and role rules.

---

## 8️⃣ Constants & Permissions

### Constants Structure

All constants are defined in `/lib/constants.ts`. **Critical:** The database uses different values than the API layer.

**Roles:**
```ts
ROLES = { ADMIN: 'admin', PM: 'pm', ENGINEER: 'engineer', VIEWER: 'viewer' }
```

**Feature Status (API format vs DB format):**
```ts
// API format (what frontend sends/receives)
FEATURE_STATUS = { 
  NOT_STARTED: 'not_started', 
  IN_PROGRESS: 'in_progress', 
  BLOCKED: 'blocked', 
  COMPLETE: 'complete' 
}

// DB format (what database stores)
DB_FEATURE_STATUS = { 
  BACKLOG: 'backlog',      // Maps to NOT_STARTED
  ACTIVE: 'active',        // Maps to IN_PROGRESS
  BLOCKED: 'blocked',      // Maps to BLOCKED
  COMPLETE: 'complete'     // Maps to COMPLETE
}
```

**Priority Levels (API format vs DB format):**
```ts
// API format (what frontend sends/receives)
PRIORITY_LEVELS = { 
  CRITICAL: 'critical', 
  HIGH: 'high', 
  MEDIUM: 'medium', 
  LOW: 'low' 
}

// DB format (what database stores)
DB_PRIORITY_LEVELS = { 
  P0: 'P0',  // Maps to CRITICAL
  P1: 'P1',  // Maps to HIGH
  P2: 'P2'   // Maps to MEDIUM and LOW
}
```

**Feedback Types (API format vs DB format):**
```ts
// API format (what frontend sends/receives)
FEEDBACK_TYPE = { 
  COMMENT: 'comment', 
  TIMELINE_PROPOSAL: 'timeline_proposal' 
}

// DB format (what database stores)
DB_FEEDBACK_TYPE = { 
  COMMENT: 'comment', 
  PROPOSAL: 'proposal'  // Maps to TIMELINE_PROPOSAL
}
```

**Other Constants:**
```ts
FEEDBACK_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', DISCUSSION: 'discussion' }
RISK_LEVELS = { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' }
SPECIALIZATIONS = { BACKEND: 'Backend', FRONTEND: 'Frontend', QA: 'QA', DEVOPS: 'DevOps' }
TICKET_TYPES = { FEATURE: 'feature', BUG: 'bug', EPIC: 'epic', STORY: 'story' }
```

### Format Conversion Functions

**Always use conversion functions** from `/lib/api/validation.ts` when working with database:

```ts
// API → DB conversions
priorityToDb('critical')  // Returns 'P0'
statusToDb('not_started') // Returns 'backlog'
feedbackTypeToDb('timeline_proposal') // Returns 'proposal'

// DB → API conversions
priorityToApi('P0')  // Returns 'critical'
statusToApi('backlog') // Returns 'not_started'
feedbackTypeToApi('proposal') // Returns 'timeline_proposal'
```

> **Critical Gotcha:** Never hardcode DB values in API routes. Always use conversion functions to prevent bugs.

---

## 9️⃣ Middleware & Authentication

### Auth0 Middleware

**File:** `/middleware.ts`

Protects routes using Auth0 Edge middleware:

```ts
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/:path*',
    '/api/projects/:path*',
    '/api/project/:path*',
    '/api/roadmap/:path*',
    '/api/feedback/:path*',
    '/api/feature/:path*',
    '/api/user-story/:path*',
  ],
}
```

**Protected Routes:**
- All `/dashboard/**` pages
- All `/project/**` pages
- All API routes (except `/api/auth/**`):
  - `/api/projects/**`
  - `/api/project/**`
  - `/api/roadmap/**`
  - `/api/feedback/**`
  - `/api/feature/**`
  - `/api/user-story/**`
  - `/api/user/**`
  - `/api/team/**`

**Unprotected Routes:**
- `/` (home page)
- `/api/auth/**` (Auth0 callback/logout)
- `/onboarding` (accessible to authenticated users)

**Middleware Protection Strategy:**
- All API routes requiring authentication are protected via middleware matcher
- Auth0 session is validated before route handlers execute
- Unauthenticated requests are automatically redirected to login
- Account isolation and role-based permissions are enforced in API route handlers

### Session Management

Sessions are managed by Auth0 SDK:
- Stored in HTTP-only cookies
- Automatically refreshed
- Accessible via `getSession()` in API routes and server components

### Error Handling

Auth0 errors are handled elegantly:
- **Automatic Error Handling:** The Auth0 SDK automatically catches and handles authentication errors
- **Error Redirects:** Errors redirect to `/api/auth/error` with error details
- **Common Errors:**
  - `access_denied` - User denied authorization
  - `login_required` - User needs to log in
  - `invalid_request` - Invalid request parameters
- **Server-side Logging:** All errors are logged server-side for debugging
- **User-friendly Messages:** Users see appropriate error messages via the error page

**Implementation:** See `/app/api/auth/[...auth0]/route.ts` for error handling configuration.

### User Creation Flow

1. User authenticates via Auth0
2. `getUserFromSession()` checks if user exists in database
3. If not exists, creates user with:
   - `auth0_id` from session
   - `account_id` from Auth0 metadata (or generated fallback)
   - Default role: `viewer`
4. User redirected to onboarding if role is `viewer` or engineer without specialization

## 🔟 Real-time Setup

### Supabase Realtime Configuration

**Required Setup:**
1. Enable Realtime in Supabase Dashboard: Database → Replication
2. Enable for tables: `projects`, `features`, `feedback` (currently used in frontend)
3. Run SQL to add tables to publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE features;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
```

**Note:** The schema.sql also enables real-time for `pending_changes`, `user_stories`, and `ticket_user_story`, but these are not currently used in frontend subscriptions. You can remove them from the publication if not needed:

```sql
-- Optional: Remove unused real-time tables
ALTER PUBLICATION supabase_realtime DROP TABLE pending_changes;
ALTER PUBLICATION supabase_realtime DROP TABLE user_stories;
ALTER PUBLICATION supabase_realtime DROP TABLE ticket_user_story;
```

**Important:** If you run a fresh `schema.sql`, these ALTER statements are included. If you're updating an existing database, you must run these statements manually.

### Subscription Patterns

**Client-side subscriptions** (in hooks):
```ts
const channel = supabase
  .channel('unique-channel-name')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'table_name',
    filter: 'column=eq.value' // Optional filter
  }, (payload) => {
    // Handle change
  })
  .subscribe()
```

**Always cleanup:**
```ts
useEffect(() => {
  // ... subscription setup
  return () => {
    supabase.removeChannel(channel)
  }
}, [dependencies])
```

## 1️⃣1️⃣ Status Tracking (Dev Setup)

* Core structure, models, constants, API modules created ✅
* Prompts refactored & modularized ✅
* Components reorganized by feature ✅
* TypeScript types organized ✅
* Docs structure created ✅
* Account isolation implemented ✅
* Real-time subscriptions working ✅
* Timeline utilities implemented ✅
* Workload calculation implemented ✅

> Agents should verify initialization and refer to docs for updates or onboarding.

---

## 1️⃣2️⃣ Validation Patterns

### Available Validation Functions

All validation functions are in `/lib/api/validation.ts`:

**Basic Validation:**
- `validateUUID(id, fieldName)` - Validate UUID format
- `validateRequired(data, fields[])` - Check required fields
- `validateEmail(email)` - Validate email format
- `validateJsonBody<T>(request)` - Parse and validate JSON body

**Domain Validation:**
- `validateRole(role)` - Validate user role
- `validateSpecialization(spec)` - Validate engineer specialization
- `validateVacationDates(dates)` - Validate vacation date ranges
- `validateFeatureStatus(status)` - Validate feature status (DB format)
- `validateFeatureStatusApi(status)` - Validate feature status (API format)
- `validatePriority(priority)` - Validate priority (API format)
- `validateFeedbackType(type)` - Validate feedback type (API format)
- `validateFeedbackStatus(status)` - Validate feedback status
- `validateTicketType(type)` - Validate Jira ticket type
- `validateStoryPoints(points)` - Validate story points (non-negative integer)
- `validateLabels(labels)` - Validate labels array
- `validateRiskLevel(level)` - Validate risk level

**Format Conversion:**
- `priorityToDb(apiPriority)` - Convert API priority to DB format
- `priorityToApi(dbPriority)` - Convert DB priority to API format
- `statusToDb(apiStatus)` - Convert API status to DB format
- `statusToApi(dbStatus)` - Convert DB status to API format
- `feedbackTypeToDb(apiType)` - Convert API feedback type to DB format
- `feedbackTypeToApi(dbType)` - Convert DB feedback type to API format

### Usage Example

```ts
import { validateJsonBody, validateRequired, validateUUID, validatePriority } from '@/lib/api/validation'

const body = await validateJsonBody<UpdateFeatureRequest>(request)
validateRequired(body, ['status'])
validateUUID(body.id, 'Feature ID')
if (body.priority) {
  validatePriority(body.priority)
}
```

## 1️⃣3️⃣ Vercel Deployment

### Environment Variables Setup

**In Vercel Dashboard:**
1. Go to your project settings → Environment Variables
2. Add all required environment variables (see `/ENV_TEMPLATE.md`)
3. Set environment-specific values:
   - **Production:** Use your production domain (e.g., `https://your-app.vercel.app`)
   - **Preview:** Vercel automatically provides preview URLs
   - **Development:** Use `http://localhost:3000`

**Required Variables for Vercel:**
```env
AUTH0_SECRET=<generate with: openssl rand -hex 32>
AUTH0_BASE_URL=https://your-app.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### Auth0 Production Configuration

**Update Auth0 Application Settings:**
1. Go to Auth0 Dashboard → Applications → Your App
2. Update **Allowed Callback URLs:**
   ```
   https://your-app.vercel.app/api/auth/callback, http://localhost:3000/api/auth/callback
   ```
3. Update **Allowed Logout URLs:**
   ```
   https://your-app.vercel.app, http://localhost:3000
   ```
4. Update **Allowed Web Origins:**
   ```
   https://your-app.vercel.app
   ```

**Important:** After deploying to Vercel, update `AUTH0_BASE_URL` in Vercel environment variables to match your production URL.

### Next.js Configuration for Vercel

The current `next.config.js` is optimized for Vercel:
- React Strict Mode enabled
- Image optimization configured
- No additional configuration needed

Vercel automatically:
- Detects Next.js projects
- Runs `npm run build` on deployment
- Handles serverless function routing
- Provides edge middleware support

### Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] Auth0 callback/logout URLs updated for production domain
- [ ] `AUTH0_BASE_URL` matches production domain
- [ ] Supabase project is active and accessible
- [ ] Database schema is deployed
- [ ] Real-time is enabled for required tables
- [ ] Test authentication flow in production
- [ ] Verify API routes are accessible

### Error Handling in Production

Auth0 errors are handled automatically:
- Authentication errors redirect to `/api/auth/error`
- Errors are logged server-side for debugging
- Users see user-friendly error messages
- No custom error pages required (handled by Auth0 SDK)

## 1️⃣4️⃣ Troubleshooting

### Common Issues

**1. Account Isolation Not Working**
- Check that `account_id` is set in Auth0 metadata
- Verify `extractAccountIdFromSession()` is being called
- Ensure all queries include `.eq('account_id', user.account_id)`

**2. Real-time Not Updating**
- Verify Realtime is enabled in Supabase Dashboard
- Check that tables are added to `supabase_realtime` publication
- Ensure subscriptions are properly cleaned up (no memory leaks)

**3. Format Conversion Errors**
- Never use DB values directly in API responses
- Always use conversion functions (`statusToApi`, `priorityToApi`, etc.)
- Check constants file for correct mappings

**4. Permission Errors**
- Verify user role is set correctly in database
- Check that permission helpers are being called
- Ensure `getUserFromSession()` is called before permission checks

**5. AI Generation Failing**
- Verify `GEMINI_API_KEY` is set
- Check API quota/rate limits
- Review error messages for specific issues

**6. Type Errors**
- Ensure you're using correct type layer (Database vs Model vs API)
- Check that conversion functions match expected types
- Verify constants match between frontend and backend

**7. Row Level Security (RLS)**
- RLS is intentionally disabled - authorization is handled in API layer
- This is the recommended approach when using Auth0 with Supabase
- All queries must filter by `account_id` to enforce account isolation
- Permission checks are handled in Next.js API routes, not at database level
- If you see RLS-related errors, ensure RLS is disabled in schema.sql

### Debugging Tips

- Check browser console for client-side errors
- Check server logs for API route errors
- Use Supabase Dashboard to inspect database directly
- Verify environment variables are loaded correctly
- Test API routes directly with curl/Postman

**✅ Agent Takeaways:**

1. Know your **role and permissions**.
2. Use **models and constants** for creating/updating resources.
3. Always use **format conversion functions** when working with database.
4. Access data via **API routes**, respecting account isolation.
5. Reference **prompts and AI modules** for roadmap or feedback tasks.
6. Follow **documentation guidelines** for API usage, component structure, and phases.
7. **Never hardcode DB values** - always use conversion functions.
8. **Always filter by account_id** in database queries.

