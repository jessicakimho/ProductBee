# **1. Component Organization**

**Location:** `/components/`

Feature-based structure:

* `/dashboard/` → DashboardClient, ProjectCard
* `/project/` → ProjectDetailClient, FeatureCard, FeatureModal
* `/feedback/` → FeedbackThread
* `/modals/` → CreateProjectModal

**Benefits:** Clean separation, scalable, consistent imports.
**Updated imports:** Dashboard page → DashboardClient, Project page → ProjectDetailClient.

---

# **2. Custom React Hooks**

**Location:** `/hooks/`

### `useProject.ts`

**`useProjects()`** - Fetch all projects with real-time updates

```ts
const { projects, isLoading, error, refetch } = useProjects()
```

**Features:**
- Fetches projects on mount
- Sets up Supabase real-time subscription for `projects` table
- Automatically refetches when changes occur
- Returns loading and error states
- Provides `refetch()` function for manual refresh

**Real-time Setup:**
```ts
useEffect(() => {
  fetchProjects()
  
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
  
  return () => {
    supabase.removeChannel(channel) // Cleanup
  }
}, [fetchProjects])
```

**`useProject(projectId)`** - Fetch single project with features and feedback

```ts
const { projectData, isLoading, error, refetch } = useProject(projectId)
```

**Features:**
- Fetches project, features, and feedback
- Sets up real-time subscriptions for both `features` and `feedback` tables
- Filters subscriptions by `project_id`
- Automatically refetches when features or feedback change
- Returns full project data with timeline information

**Real-time Setup:**
```ts
const featuresChannel = supabase
  .channel(`project-${projectId}-features`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'features',
    filter: `project_id=eq.${projectId}`,
  }, () => {
    fetchProject()
  })
  .subscribe()
```

**Error Handling:**
- Checks `response.ok` and `responseData.success`
- Throws error with message from `responseData.error`
- Sets error state for UI display

### `useFeature.ts`

**Functions:**
- `updateFeature(featureId, updates)` - Update any feature fields
- `updateFeatureStatus(featureId, status)` - Update status only
- `updateFeaturePriority(featureId, priority)` - Update priority only
- `createFeature(featureData)` - Create new feature

**Pattern:**
```ts
const { updateFeature, isUpdating, isCreating } = useFeature()

const handleUpdate = async () => {
  const result = await updateFeature(featureId, {
    status: 'in_progress',
    priority: 'high'
  })
  // result is FeatureResponse | null
  // Toast notifications handled automatically
}
```

**Error Handling:**
- Checks for 403 (permission errors) and shows user-friendly message
- Checks for 404 (not found) and shows appropriate error
- All errors shown via toast notifications
- Returns `null` on error, `FeatureResponse` on success

**Toast Notifications:**
- Success: "Feature updated successfully"
- Permission error: "You do not have permission to update this feature. Viewers have read-only access."
- Not found: "Feature not found or you do not have access to it."

### `useFeedback.ts`

**Functions:**
- `createFeedback(feedbackData)` - Create comment or proposal
- `approveFeedback(feedbackId)` - Approve proposal (PM/Admin only)
- `rejectFeedback(feedbackId)` - Reject proposal (PM/Admin only)

**Pattern:**
```ts
const { createFeedback, approveFeedback, isSubmitting, isApproving } = useFeedback()

const handleSubmit = async () => {
  const result = await createFeedback({
    projectId,
    featureId,
    type: 'comment',
    content: 'Feedback text'
  })
}
```

**Error Handling:**
- Permission errors (403) show role-specific messages
- "Only PMs and Admins can approve proposals..."
- Toast notifications for all operations
- Returns `null` on error, `FeedbackResponse` on success

**States:**
- `isSubmitting` - Creating feedback
- `isApproving` - Approving proposal
- `isRejecting` - Rejecting proposal

### `useUserProfile.ts`

**Functions:**
- `fetchProfile()` - Fetch current user's profile
- `updateProfile(updates)` - Update profile (role, specialization, vacation dates)

**Pattern:**
```ts
const { profile, loading, fetchProfile, updateProfile } = useUserProfile()

useEffect(() => {
  fetchProfile()
}, [])

const handleUpdate = async () => {
  await updateProfile({
    role: 'engineer',
    specialization: 'Backend',
    vacationDates: [{ start: '2024-12-20', end: '2024-12-31' }]
  })
}
```

**Features:**
- Manages profile state internally
- Shows toast notifications
- Handles errors gracefully

### `useTeamMembers.ts`

**Function:**
- `fetchTeamMembers()` - Fetch all team members in account

**Pattern:**
```ts
const { members, loading, error, refetch } = useTeamMembers()
// Automatically fetches on mount
```

**Features:**
- Fetches on mount
- Returns loading and error states
- Provides `refetch()` for manual refresh
- Shows toast on error

**Benefits:** Centralized logic, reusable, consistent error/UI flow, real-time support.

---

# **3. TypeScript Types**

**Location:** `/types/`

### Structure

* `index.ts` — unified exports
* `database.ts` — BaseModel, User, Project, Feature, Feedback
* `api.ts` — all request/response types
* `feedback.ts` — analysis + feedback models
* `roadmap.ts` — roadmap feature structures

### Response Types

* `ProjectResponse`, `FeatureResponse`, `FeedbackResponse`
* Includes `_id` + `id` compatibility.

**Benefits:** Strong type safety, clean refactoring, ideal DX.

---

# **4. API Response Wrapper Fix**

## Standard API Response Handling Pattern

Backend wraps everything with:

```ts
{ success: boolean, data?: T, error?: string, code?: string }
```

### Standard Pattern in Hooks

```ts
const response = await fetch('/api/endpoint')
const responseData = await response.json()

if (!response.ok || !responseData.success) {
  throw new Error(responseData.error || 'Request failed')
}

const data = responseData.data // Unwrap the data
```

### Complete Example

```ts
async function fetchData() {
  try {
    setIsLoading(true)
    setError(null)
    
    const response = await fetch('/api/endpoint')
    const responseData = await response.json()
    
    // Check HTTP status and success flag
    if (!response.ok || !responseData.success) {
      // Handle specific error codes
      if (response.status === 403) {
        throw new Error('Permission denied')
      }
      if (response.status === 404) {
        throw new Error('Resource not found')
      }
      throw new Error(responseData.error || 'Request failed')
    }
    
    // Unwrap data
    const data = responseData.data
    setData(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An error occurred'
    setError(message)
    toast.error(message)
  } finally {
    setIsLoading(false)
  }
}
```

### Error Code Handling

```ts
if (responseData.code === 'FORBIDDEN') {
  // Handle permission error
} else if (responseData.code === 'NOT_FOUND') {
  // Handle not found
} else if (responseData.code === 'BAD_REQUEST') {
  // Handle validation error
}
```

**Files updated:**
CreateProjectModal, useProject, useFeature, useFeedback, DashboardClient, FeedbackThread, useUserProfile, useTeamMembers.

**Endpoints fixed:**
`/api/roadmap/generate`, `/api/projects`, `/api/project/[id]`, `/api/feature/[id]`, `/api/feedback/*`, `/api/user/profile`, `/api/team/members`

---

# **5. Server/Client Component Patterns**

### **Server components**

* Fetch data (Supabase)
* Handle session + permissions
* Pass props to client components

### **Client components**

* Interactivity
* Hooks for mutations
* Local state
* Real-time updates

**Clear separation:** Server = fetching/auth; Client = UI & logic; Hooks = operations.

---

# **6. Constants Integration**

## Using Constants in Components

**Location:** `/lib/constants.ts`

**Available Constants:**
- `ROLES` - User roles (ADMIN, PM, ENGINEER, VIEWER)
- `FEATURE_STATUS` - Feature status (NOT_STARTED, IN_PROGRESS, BLOCKED, COMPLETE)
- `PRIORITY_LEVELS` - Priority levels (CRITICAL, HIGH, MEDIUM, LOW)
- `FEEDBACK_STATUS` - Feedback status (PENDING, APPROVED, REJECTED, DISCUSSION)
- `FEEDBACK_TYPE` - Feedback types (COMMENT, TIMELINE_PROPOSAL)
- `SPECIALIZATIONS` - Engineer specializations (BACKEND, FRONTEND, QA, DEVOPS)
- `RISK_LEVELS` - Risk levels (LOW, MEDIUM, HIGH)
- `TICKET_TYPES` - Ticket types (FEATURE, BUG, EPIC, STORY)

### Usage Pattern

```ts
import { ROLES, FEATURE_STATUS, PRIORITY_LEVELS } from '@/lib/constants'

// Check role
if (user.role === ROLES.PM || user.role === ROLES.ADMIN) {
  // Show edit button
}

// Check status
if (feature.status === FEATURE_STATUS.IN_PROGRESS) {
  // Show in-progress badge
}

// Priority comparison
if (feature.priority === PRIORITY_LEVELS.CRITICAL) {
  // Show critical indicator
}
```

### Display Values

```ts
// Get display label
const statusLabel = {
  [FEATURE_STATUS.NOT_STARTED]: 'Not Started',
  [FEATURE_STATUS.IN_PROGRESS]: 'In Progress',
  [FEATURE_STATUS.BLOCKED]: 'Blocked',
  [FEATURE_STATUS.COMPLETE]: 'Complete',
}[feature.status]
```

### Dropdown Options

```ts
const priorityOptions = Object.values(PRIORITY_LEVELS).map(priority => ({
  value: priority,
  label: priority.charAt(0).toUpperCase() + priority.slice(1)
}))
```

**Can be used in:** ProjectCard, FeatureCard, FeatureModal, ProjectDetailClient, FeedbackThread, useFeature, useFeedback, OnboardingForm, TeamMembersList.

**Note:** Some components still use magic strings → planned migration. Always prefer constants over string literals.

---

# **7. Real-time Features**

## Real-time Subscription Patterns

**Supabase Realtime:**
- Projects auto-update
- Kanban features auto-move
- Feedback live updates
- Multi-user sync

### Standard Subscription Pattern

```ts
useEffect(() => {
  // Fetch initial data
  fetchData()
  
  // Set up subscription
  const channel = supabase
    .channel('unique-channel-name')
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'table_name',
      filter: 'column=eq.value' // Optional: filter by specific value
    }, (payload) => {
      // Handle change
      console.log('Change:', payload)
      fetchData() // Refresh data
    })
    .subscribe()
  
  // Cleanup subscription
  return () => {
    supabase.removeChannel(channel)
  }
}, [dependencies])
```

### Filtered Subscriptions

**Filter by project:**
```ts
.filter(`project_id=eq.${projectId}`)
```

**Filter by account (if needed):**
```ts
.filter(`account_id=eq.${accountId}`)
```

### Multiple Subscriptions

```ts
useEffect(() => {
  const channel1 = supabase.channel('channel-1')...
  const channel2 = supabase.channel('channel-2')...
  
  return () => {
    supabase.removeChannel(channel1)
    supabase.removeChannel(channel2)
  }
}, [])
```

### Error Handling

```ts
channel
  .on('postgres_changes', {...}, callback)
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('Subscribed')
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Subscription error')
    }
  })
```

**Important:** Always clean up subscriptions in `useEffect` return function to prevent memory leaks.

Implemented inside `useProjects()` and `useProject()` hooks.

---

# **8. Architecture Compliance**

✅ Feature-based components
✅ Server fetch → client UI separation
✅ TypeScript everywhere
✅ Realtime syncing
✅ Correct API wrapper handling
⚠️ Improve constants usage
⚠️ Improve loading & error UI

---

# **9. Phase 4 — Account Isolation & Permissions**

### **Server Pages Updated**

* `/app/dashboard/page.tsx`

  * Uses `getUserFromSession()`
  * Filters by `account_id`
  * Passes role to DashboardClient
* `/app/project/[id]/page.tsx`

  * Uses `canViewProject()`
  * Account filtering
  * Passes role to client component

### **Role-Based UI**

DashboardClient:

* Create Project only for PM/Admin

ProjectDetailClient:

* Computes `canEdit`, `canApprove`
* Viewers = read-only

FeatureModal:

* Viewer restrictions
* Approve/Reject → PM/Admin only

FeatureCard:

* Accepts permission props

### **Permission-Aware Hooks**

useFeature & useFeedback handle 403 errors with helpful toasts.

### **Constants**

All role checks now use `ROLES` enum.

### **Viewer UX**

Read-only UI + explanations.

---

# **10. Phase 5 — User Roles & Team Management**

### **Hooks**

`useUserProfile.ts`

* `fetchProfile()`
* `updateProfile()`
* Includes workload + vacation fields

`useTeamMembers.ts`

* Fetch all members in account

### **Onboarding Flow**

`/app/onboarding/page.tsx` — server
`OnboardingForm.tsx` — client

* Role selection: PM / Engineer / Viewer
* Engineers must pick specialization
* Redirect logic:

  * Viewers → onboarding
  * Engineers w/o specialization → onboarding
* Always accessible for updates

### **Team Members**

`TeamMembersList.tsx`

* Role badges
* Specialization badges
* Workload metrics
* Vacation indicators
* Responsive, modern UI

`/app/team/page.tsx` — server component

### **Integration**

* GET/PATCH `/api/user/profile`
* GET `/api/team/members`
* Uses ROLES + SPECIALIZATIONS constants
* Type-safe API calls

### **UI/UX**

* Clean onboarding
* Error/validation states
* Badges, cards, responsive grid
* Dark mode friendly

**Status:** ✅ Phase 5 fully completed.

---

# **Testing Recommendations**

* Component rendering
* Realtime updates
* API integration
* Types compile cleanly
* Mobile responsiveness
* Error flows
* Loading states

---

# **Known Issues**

1. `'proposal'` vs `'timeline_proposal'` type mismatch
2. Some places still use string literals instead of constants

---

# **11. Permission-Based UI Patterns**

## Showing/Hiding UI Based on Role

```ts
import { ROLES } from '@/lib/constants'

// Simple check
{user.role === ROLES.PM && <CreateProjectButton />}

// Multiple roles
{(user.role === ROLES.PM || user.role === ROLES.ADMIN) && <EditButton />}

// Helper function
const canEdit = user.role === ROLES.PM || user.role === ROLES.ADMIN
{canEdit && <EditButton />}
```

## Disabling Actions

```ts
<button 
  disabled={user.role === ROLES.VIEWER}
  onClick={handleUpdate}
>
  Update Feature
</button>
```

## Conditional Rendering

```ts
{user.role === ROLES.VIEWER ? (
  <ReadOnlyView />
) : (
  <EditableView />
)}
```

## Permission Props Pattern

```ts
interface FeatureCardProps {
  feature: FeatureResponse
  canEdit: boolean
  canApprove: boolean
}

function FeatureCard({ feature, canEdit, canApprove }: FeatureCardProps) {
  return (
    <div>
      {canEdit && <EditButton />}
      {canApprove && <ApproveButton />}
    </div>
  )
}
```

# **12. Loading States**

## Loading Patterns

```ts
// In hook
const { data, isLoading, error } = useProject(projectId)

// In component
{isLoading ? (
  <LoadingSkeleton />
) : error ? (
  <ErrorMessage error={error} />
) : (
  <ProjectContent data={data} />
)}
```

## Skeleton Loaders

```ts
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}
```

## Button Loading States

```ts
<button disabled={isUpdating}>
  {isUpdating ? 'Updating...' : 'Update'}
</button>
```

# **13. Error Boundaries**

## Error Handling in Components

```ts
try {
  await updateFeature(featureId, updates)
} catch (error) {
  // Error already handled in hook with toast
  // Component can show additional UI if needed
  setLocalError(error.message)
}
```

## Error Display

```ts
{error && (
  <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
    {error}
  </div>
)}
```

# **14. Component Hierarchy & Data Flow**

## Server → Client → Hooks Flow

```
Server Component (page.tsx)
  ↓ (fetches data, passes props)
Client Component (ComponentClient.tsx)
  ↓ (uses hooks for mutations)
Custom Hooks (useFeature, useFeedback)
  ↓ (calls API)
API Routes
```

## Example Flow

```ts
// Server Component
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  const user = await getUserFromSession(session)
  const project = await getProject(params.id)
  
  return <ProjectDetailClient project={project} user={user} />
}

// Client Component
'use client'
export function ProjectDetailClient({ project, user }) {
  const { updateFeature } = useFeature()
  // Use hooks for mutations
}
```

# **Common Mistakes**

1. **Forgetting to unwrap API response** - Always check `responseData.success` and use `responseData.data`
2. **Not cleaning up subscriptions** - Always return cleanup function in `useEffect`
3. **Using magic strings instead of constants** - Always use constants from `/lib/constants.ts`
4. **Not handling loading states** - Always show loading indicators during async operations
5. **Not handling errors** - Always catch errors and show user-friendly messages
6. **Missing permission checks** - Always check user role before showing actions
7. **Not using type-safe hooks** - Always use typed hooks instead of direct fetch calls
8. **Forgetting to handle 403 errors** - Always show permission-specific error messages

# **12. Phase 11 — AI-Powered Chatbot for Ticket Generation**

## **Components Created**

### **ChatInterface** (`/components/project/ChatInterface.tsx`)

Persistent chat panel for AI-powered ticket generation:

* **Features:**
  - Collapsible bottom-right drawer (minimizable)
  - Message history display with user/assistant messages
  - Input field with "Generate Tickets" button
  - Auto-scroll to latest message
  - Loading indicator while generating
  - Dark mode support

* **Props:**
  - `projectId: string` - Project ID for chat context
  - `isOpen: boolean` - Controls chat visibility
  - `onClose: () => void` - Close handler
  - `onTicketsGenerated?: (ticketCount: number) => void` - Callback when tickets are generated

* **UI:**
  - Fixed position bottom-right drawer
  - Minimizable (collapses to header only)
  - Message bubbles with timestamps
  - Bot and user avatars
  - Responsive design

### **TicketGenerationControls** (`/components/project/TicketGenerationControls.tsx`)

Controls for managing AI-generated ticket suggestions:

* **Features:**
  - Generation mode selector: "Generate All" / "One at a Time" / "None"
  - Ticket selection with checkboxes
  - Ticket preview with priority, effort, labels, confidence scores
  - Bulk apply selected tickets
  - Skeleton loaders during generation
  - Staggered fade-in animations for tickets

* **Props:**
  - `projectId: string` - Project ID
  - `onTicketsApplied?: (ticketIds: string[]) => void` - Callback when tickets are applied

* **UI:**
  - Mode selector buttons
  - Scrollable ticket list (max height)
  - Priority badges with color coding
  - Confidence score display
  - Apply/Dismiss actions

## **Hooks Created**

### **useChat** (`/hooks/useChat.ts`)

Hook for managing AI chat functionality:

* **Functions:**
  - `generateTickets(message: string): Promise<ChatResponse | null>` - Generate tickets via chat
  - `applyTickets(tickets: SuggestedTicket[]): Promise<string[] | null>` - Bulk create tickets
  - `loadChatHistory(): ChatMessage[]` - Load history from localStorage
  - `saveChatHistory(history: ChatMessage[]): void` - Save history to localStorage
  - `clearChatHistory(): void` - Clear history

* **State:**
  - `isGenerating: boolean` - Generation in progress
  - `isApplying: boolean` - Applying tickets in progress
  - `conversationHistory: ChatMessage[]` - Chat message history
  - `suggestedTickets: SuggestedTicket[]` - AI-suggested tickets

* **localStorage Management:**
  - Key: `chat-history-${projectId}`
  - Max 50 messages (prunes oldest)
  - Automatic save/load on mount

## **Integration**

### **ProjectDetailClient Updates**

* Added "Modify with AI" button in roadmap summary section (PM/Admin only)
* Added "AI Chat" button in features header (PM/Admin only)
* Integrated `TicketGenerationControls` component (shows above features list)
* Integrated `ChatInterface` component (bottom-right drawer)
* Auto-refresh project data when tickets are applied

### **Styling**

* Added fade-in animation to `globals.css`:
  - `@keyframes fade-in` - Smooth fade-in with slight upward motion
  - `.animate-fade-in` - Utility class for animations

## **Features Implemented**

✅ **Chat Interface:**
- Persistent chat panel (collapsible sidebar/drawer)
- Message history display
- Input field with "Generate Tickets" button
- Auto-scroll to latest message
- Loading indicators

✅ **Ticket Generation Controls:**
- Mode selector: "Generate All" / "One at a Time" / "None"
- Ticket selection UI
- Pending tickets queue display
- Bulk apply functionality

✅ **Lazy Loading:**
- Skeleton loaders when generation starts
- Staggered fade-in animations (150ms delay between tickets)
- Smooth transitions
- Consistent timing from first ticket

✅ **localStorage Management:**
- Chat history persistence (`chat-history-${projectId}`)
- Max 50 messages (auto-prune oldest)
- Automatic load on component mount
- Clear on project deletion (manual)

✅ **UI Integration:**
- "Modify with AI" button on project page
- "AI Chat" button in features header
- Permission-based visibility (PM/Admin only)
- Real-time project refresh after ticket creation

## **Patterns Used**

* **Hook Pattern:** `useChat` follows same pattern as `useFeature`, `useFeedback`
* **Component Organization:** Feature-based structure in `/components/project/`
* **State Management:** React hooks with localStorage persistence
* **Animation:** CSS keyframes with Tailwind utilities
* **Error Handling:** Toast notifications via `react-hot-toast`
* **Type Safety:** Full TypeScript types from `/types/chat.ts`

## **Testing Recommendations**

* Test chat UI interactions (send message, view history)
* Test localStorage persistence (refresh page, verify history)
* Test ticket generation UI (mode selection, ticket preview)
* Test lazy loading animations (skeleton → fade-in)
* Test chat history management (pruning, clearing)
* Test on mobile devices (responsive drawer)
* Test permission enforcement (Viewer cannot access)

---

# **Phase 12: Drag-and-Drop with Two-Way Confirmation**

**Status:** Complete ✅  
**Dependencies:** Phase 6 (Jira-Style Tickets), Phase 10 (Feedback System)

## **Overview**

Phase 12 implements drag-and-drop functionality for moving features between status columns with a two-way confirmation system. Engineers and PMs can propose status changes by dragging cards, but changes require approval from PMs or Admins before being applied.

## **Components Created**

### **PendingChangesNotification** (`/components/project/PendingChangesNotification.tsx`)

Small counter badge that displays the number of pending status changes.

**Features:**
- Shows count of pending approvals
- Displays red badge with number (max 99+)
- Click handler to open PendingChangesList modal
- Hidden when count is 0
- Styled with Tailwind (bell icon, badge)

**Props:**
```ts
interface PendingChangesNotificationProps {
  count: number
  onClick: () => void
}
```

### **PendingChangesList** (`/components/modals/PendingChangesList.tsx`)

Modal that displays all pending status changes with approve/reject functionality.

**Features:**
- Shows all pending status changes for a project
- Each item displays: "User X wants to move Feature Y from A → B"
- Approve / Reject buttons for each change
- Optional reason field for rejection
- Loading states during approval/rejection
- Status labels (Backlog, In Progress, Blocked, Complete)
- Timestamp display

**Props:**
```ts
interface PendingChangesListProps {
  isOpen: boolean
  onClose: () => void
  pendingChanges: PendingChangeResponse[]
  features: FeatureResponse[]
  onApprove: (featureId: string, pendingChangeId: string) => Promise<void>
  onReject: (featureId: string, pendingChangeId: string, reason?: string) => Promise<void>
  isApproving: boolean
  isRejecting: boolean
}
```

## **Hooks Created**

### **usePendingChanges** (`/hooks/usePendingChanges.ts`)

Hook for managing pending status changes.

**Functions:**
- `fetchPendingChanges(projectId)` - Fetch all pending changes for a project
- `proposeStatusChange(featureId, newStatus)` - Propose a status change
- `approveStatusChange(featureId, pendingChangeId)` - Approve a pending change
- `rejectStatusChange(featureId, pendingChangeId, reason?)` - Reject a pending change

**Returns:**
```ts
interface UsePendingChangesReturn {
  pendingChanges: PendingChangeResponse[]
  isLoading: boolean
  error: string | null
  count: number
  fetchPendingChanges: (projectId: string) => Promise<void>
  proposeStatusChange: (featureId: string, newStatus: string) => Promise<PendingChangeResponse | null>
  approveStatusChange: (featureId: string, pendingChangeId: string) => Promise<boolean>
  rejectStatusChange: (featureId: string, pendingChangeId: string, reason?: string) => Promise<boolean>
  isProposing: boolean
  isApproving: boolean
  isRejecting: boolean
}
```

**Features:**
- Automatic error handling with toast notifications
- Loading states for each operation
- Automatic state updates after operations
- Account isolation (handled by API)

## **Integration**

### **ProjectDetailClient Updates**

* Added drag-and-drop support using `@dnd-kit/core` and `@dnd-kit/sortable`
* Integrated `PendingChangesNotification` component (header)
* Integrated `PendingChangesList` modal
* Added `usePendingChanges` hook
* Implemented optimistic UI updates
* Added drag overlay for visual feedback
* Disabled dragging for features with pending changes

### **Drag-and-Drop Implementation**

**Libraries Used:**
- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable list support
- `@dnd-kit/utilities` - Utility functions (CSS transforms)

**Components:**
- `DndContext` - Main drag-and-drop context
- `SortableContext` - Sortable list context
- `DraggableFeatureCard` - Draggable feature card wrapper
- `DroppableColumn` - Droppable status column
- `DragOverlay` - Drag overlay for visual feedback

**Features:**
- Optimistic UI updates (immediate visual feedback)
- Ghost card shows in new column during drag
- Original card shows "Pending approval" badge after drag
- Cards with pending changes cannot be dragged
- Keyboard and pointer sensor support
- Collision detection with `closestCenter`

### **FeatureCard Updates**

* Added `pendingChangeId` prop
* Shows yellow border when pending change exists
* Displays "Pending" badge with clock icon
* Styled with Tailwind (yellow background, border)

### **Optimistic UI Updates**

When a user drags a feature to a new column:
1. Optimistic update immediately moves card to new column
2. API call proposes status change
3. If successful, card shows "Pending" badge
4. If failed, card reverts to original column
5. Real-time updates refresh data when change is approved/rejected

### **Rejection Handling**

When a status change is rejected:
1. Pending change is removed from list
2. Feature card reverts to original column (via data refresh)
3. Toast notification shows rejection message
4. Optional rejection reason is displayed

## **Features Implemented**

✅ **Drag-and-Drop:**
- Install `@dnd-kit/core` and related packages
- Make Kanban columns draggable
- Optimistic UI updates (immediate visual feedback)
- Ghost card shows in new column
- Original card shows "Pending approval" badge

✅ **Pending Changes Notification:**
- Small counter badge on project header
- Shows count of pending approvals
- Click opens PendingChangesList modal

✅ **Pending Changes List:**
- Shows all pending status changes
- Each item: "User X wants to move Feature Y from A → B"
- Approve / Reject buttons
- Reason field for rejection

✅ **Rejection Handling:**
- Revert card to original column (via data refresh)
- Show toast: "Change rejected by [User]"
- Display rejection reason if provided

✅ **Permission Enforcement:**
- Viewers cannot drag cards
- Only PMs and Admins can approve/reject
- Engineers and PMs can propose changes

## **Patterns Used**

* **Hook Pattern:** `usePendingChanges` follows same pattern as `useFeature`, `useFeedback`
* **Component Organization:** Feature-based structure in `/components/project/` and `/components/modals/`
* **State Management:** React hooks with real-time updates
* **Animation:** CSS transitions via `@dnd-kit/utilities`
* **Error Handling:** Toast notifications via `react-hot-toast`
* **Type Safety:** Full TypeScript types from `/types/api.ts`
* **Optimistic Updates:** Immediate UI feedback with rollback on error

## **Testing Recommendations**

* Test drag-and-drop functionality (drag card between columns)
* Test optimistic UI updates (immediate visual feedback)
* Test approval/rejection UI (buttons, modals)
* Test notification badge (count, click handler)
* Test animation on rejection (card revert)
* Test permission enforcement (Viewers cannot drag)
* Test on mobile devices (touch support)
* Test keyboard navigation (accessibility)

---

# **Phase 11.5: User Stories & Personas (Frontend)**

**Status:** Complete ✅  
**Dependencies:** Phase 11.5 Backend (User Stories & Personas)

## **Components Created**

### **UserStoriesTab** (`/components/project/UserStoriesTab.tsx`)

Main component for the User Stories view. Displays a list of user stories with CRUD functionality.

**Features:**
- List of user stories in a responsive grid layout (1/2/3 columns)
- Create new user story button (PM/Admin only)
- Empty state with call-to-action
- Loading and error states
- Integration with `useUserStories` hook

### **UserStoryCard** (`/components/project/UserStoryCard.tsx`)

Displays a single user story with all details and linked tickets.

**Features:**
- User story details (name, role, goal, benefit)
- Demographics display (age, location, technical skill) with badges
- Linked tickets list with unlink functionality
- Link ticket dropdown (PM/Admin only)
- Edit and delete buttons (PM/Admin only)
- Created by and timestamp display

### **UserStoryForm** (`/components/project/UserStoryForm.tsx`)

Modal form for creating and editing user stories.

**Features:**
- Create and edit modes
- Required fields: name, role, goal, benefit
- Optional demographics: age, location, technical skill
- Form validation
- Loading states during submission
- Responsive modal design

### **TicketAlignmentCheck** (`/components/project/TicketAlignmentCheck.tsx`)

AI-powered alignment checker for tickets against user stories.

**Features:**
- Check alignment button
- Alignment score display (0-100) with color coding
- AI analysis text
- Matched user stories with relevance scores
- Improvement suggestions
- Loading states during alignment check
- Empty state when no user stories exist

**Score Interpretation:**
- 80-100%: Well Aligned (green)
- 60-79%: Moderate (yellow)
- 0-59%: Needs Improvement (red)

## **Hooks Created**

### **useUserStories** (`/hooks/useUserStories.ts`)

Hook for managing user stories CRUD operations and AI alignment checking.

**Functions:**
- `fetchUserStories(projectId)` - Fetch all user stories for a project
- `createUserStory(data)` - Create a new user story
- `updateUserStory(userStoryId, data)` - Update an existing user story
- `deleteUserStory(userStoryId)` - Delete a user story
- `assignUserStoryToTicket(ticketId, userStoryId)` - Link a user story to a ticket
- `unassignUserStoryFromTicket(ticketId, userStoryId)` - Unlink a user story from a ticket
- `checkTicketAlignment(projectId, ticketId)` - Check ticket alignment with user stories

**Local Caching:**
- Stores last 50 user stories per project in memory cache
- Cache key: `projectId`
- Cache is used for instant display, with background refresh
- Cache is updated on create, update, and delete operations

## **Integration**

### **ViewToggle Component Update**

Updated to include a "User Stories" tab option:

```ts
export type ViewType = 'gantt' | 'backlog' | 'user-stories'
```

**Changes:**
- Added "User Stories" button with Users icon
- Updated view type to include 'user-stories'
- Maintains localStorage persistence for view preference

### **ProjectDetailClient Integration**

Updated to support User Stories view:

**Changes:**
- Added `UserStoriesTab` import
- Updated view state initialization to support 'user-stories'
- Added conditional rendering for User Stories tab
- View toggle displayed in User Stories view
- Features list hidden when User Stories view is active

### **FeatureModal Integration**

Added AI alignment check to ticket detail modal:

**Changes:**
- Added `TicketAlignmentCheck` component
- Displayed after Assignment section
- Shows alignment score, AI analysis, matched user stories, and suggestions
- Available to all users (not just PM/Admin)

## **Features Implemented**

✅ **User Stories Tab:**
- Added User Stories tab on project page (switchable with roadmap/tickets)
- Responsive grid layout for user stories
- Empty state with call-to-action

✅ **User Stories UI:**
- List of user stories with edit/delete buttons
- Add new user story form (fields: name, role, goal, benefit, demographics)
- Link/unlink tickets via dropdown

✅ **AI Validation UI:**
- Show alignment suggestions for tickets
- Alignment score with color coding
- Matched user stories with relevance scores
- Improvement suggestions

✅ **Local State Caching:**
- Store last 50 user stories per project in cache for performance
- Instant display from cache
- Background refresh to update cache

## **Patterns Used**

* **Hook Pattern:** `useUserStories` follows same pattern as `useFeature`, `useFeedback`
* **Component Organization:** Feature-based structure in `/components/project/`
* **State Management:** React hooks with local caching
* **Type Safety:** Full TypeScript types from `/types/api.ts`
* **Permission-Based UI:** Conditional rendering based on user role

## **Files Created/Modified**

### **Created**
- `/hooks/useUserStories.ts` - User stories hook
- `/components/project/UserStoriesTab.tsx` - Main user stories view
- `/components/project/UserStoryCard.tsx` - User story card component
- `/components/project/UserStoryForm.tsx` - User story form modal
- `/components/project/TicketAlignmentCheck.tsx` - AI alignment checker
- `/docs/features/frontend/phase11.5-user-stories.md` - Feature documentation

### **Modified**
- `/components/project/ViewToggle.tsx` - Added User Stories tab option
- `/components/project/ProjectDetailClient.tsx` - Integrated User Stories tab
- `/components/project/FeatureModal.tsx` - Added alignment check component

## **Testing Recommendations**

* Test user stories CRUD operations (create, read, update, delete)
* Test ticket linking/unlinking flow
* Test AI alignment checking
* Test permission enforcement (Viewer cannot create/edit/delete)
* Test tab switching between views
* Test responsive design on mobile/tablet/desktop
* Test loading and error states
* Test empty states and call-to-actions

---

# **Next Steps**

* Full constants migration
* Better loading skeletons
* Accessibility improvements
* Hook/component unit tests
* Integration tests
* More consistent error boundaries
* Error boundary components for React error boundaries
* Real-time subscriptions for user stories updates
* User story pagination for large lists
