# Development Phases

## Instructions
- Mark tasks complete as you go: `- [ ]` → `- [x]`
- Create feature documentation in `/docs/features/[agent]/` after completing each phase
- Update summary files: `/docs/backend/summary.md` and `/docs/frontend/summary.md`

## For Backend Agent
1. Work through BACKEND sections
2. Create feature docs in `/docs/features/backend/` after completing each phase
3. Update `/docs/backend/summary.md` with completed features
4. Notify Frontend Agent when phase is complete

## For Frontend Agent
1. Work through FRONTEND sections
2. After Backend completes a phase, READ their code changes and feature docs
3. Then mark off your tasks
4. Create feature docs in `/docs/features/frontend/` after completing each phase
5. Update `/docs/frontend/summary.md` with completed features

## Phase Status

### Phase 1: Infrastructure Setup
**Status:** ✅ Completed

**BACKEND:**
- [x] Create `/lib/constants.ts` with all constants
- [x] Create `/models/` TypeScript interfaces (base, User, Project, Feature, Feedback)
- [x] Create `/lib/api/` utilities (permissions, validation, errors)
- [x] Reorganize `/lib/prompts/` (roadmap, feedback, comparison)
- [x] Refactor `gemini.ts` to use modular prompts
- [x] Create `/types/` TypeScript types (index, api, database, feedback, roadmap)

**FRONTEND:**
- [x] Reorganize components into feature folders
- [x] Create custom hooks (`useProject`, `useFeature`, `useFeedback`)
- [x] Update TypeScript types usage
- [x] Implement server/client component patterns

### Phase 2: API Routes & Error Handling
**Status:** ✅ Completed

**BACKEND:**
- [x] Implement all API routes with consistent error handling
- [x] Add comprehensive error logging and handling
- [x] Implement validation utilities
- [x] Implement permission checks
- [x] Enhance Gemini integration error handling

**FRONTEND:**
- [x] Fix API response wrapper handling
- [x] Update all API calls to handle response format
- [x] Improve error handling in components
- [x] Add real-time Supabase subscriptions

### Phase 3: Documentation & Alignment
**Status:** ✅ Completed

**BACKEND:**
- [x] Document all API endpoints in `/docs/api.md`
- [x] Create backend summary in `/docs/backend/summary.md`
- [x] Align documentation with architecture

**FRONTEND:**
- [x] Create frontend summary in `/docs/frontend/summary.md`
- [x] Document component structure
- [x] Document hooks usage
- [x] Align documentation with architecture


# ## **Phase 4: Account Isolation & Permission Enforcement**

Ensure users can only access data belonging to their accountId.
Enforce role-based permissions on every backend route.
### **BACKEND**

* [x] Add `accountId` / `organizationId` to all models:

  * [x] User
  * [x] Project
  * [x] Feature
  * [x] Feedback
* [x] Add middleware to extract `accountId` from Auth0 metadata
* [x] Update all Supabase queries to enforce account scoping
* [x] Implement permission rules in `/lib/api/permissions.ts`:

  * [x] `canViewProject`
  * [x] `canEditProject`
  * [x] `canAssignTasks`
  * [x] `canApproveProposals`
  * [x] Role-based checks for PM / Engineer / Viewer
* [x] Add permission enforcement to **every route**
* [x] Update API documentation with account isolation details

### **FRONTEND**

* [x] Add role-based UI rendering:

  * [x] Hide PM-only actions from non-PMs
  * [x] Hide assignment features from non-PMs
  * [x] Viewer = read-only UI
* [x] Add permission-aware guards before API calls
* [x] Show helpful permission error messages


# ## **Phase 5: User Roles & Team Management**

**Status:** ✅ Completed

Allow each user to set and update their role + specialization.
Provide an API and UI to list all team members with their assigned roles.
### **BACKEND**

* [x] Extend User model with:

  * [x] `role` (PM, Engineer, Viewer) - Already existed, verified
  * [x] `specialization` (Backend, Frontend, QA, DevOps)
  * [x] `vacationDates`
  * [x] `currentTicketCount` (computed field)
  * [x] `currentStoryPointCount` (computed field)
* [x] Add specialization enum to constants
* [x] Create:

  * [x] `GET /api/user/profile`
  * [x] `PATCH /api/user/profile`
  * [x] `GET /api/team/members`
* [x] Limit profile updates to the current user
* [x] Add full documentation in `/docs/api.md`

**Note:** Workload metrics (currentTicketCount, currentStoryPointCount) are computed fields that return 0 until Phase 6 is complete (when `assignedTo` field is added to features). The infrastructure is in place and will automatically work once Phase 6 is implemented.

### **FRONTEND**

* [x] Create role onboarding screen:

  * [x] `/onboarding` or `/profile`
  * [x] PM vs Engineer selector
  * [x] Specialization dropdown for Engineers
* [x] Redirect user to onboarding until role is set
* [x] Create TeamMembersList with roles + specialization

---

# ## **Phase 6: Jira-Style Ticket Model Expansion**
Support manual creation of tickets with story points, labels, type, and acceptance criteria.
Accept and store expanded ticket fields in AI-generated roadmaps.

## give to claude or chat and have it make PM see all and employee only see what they are assigned to

### **BACKEND**

* [x] Extend Feature model with:

  * [x] `assignedTo`
  * [x] `reporter`
  * [x] `storyPoints`
  * [x] `labels[]`
  * [x] `acceptanceCriteria`
  * [x] `ticketType` (feature, bug, epic, story)
* [x] Update `POST /api/roadmap/generate` to include these fields
* [x] Update Gemini prompts to understand Jira-style fields
* [x] Add `POST /api/feature/create` for manual ticket creation

### **FRONTEND**

* [x] Expand CreateProjectModal:

  * [x] Priority selector
  * [x] Estimated effort
  * [x] Labels/tags
* [x] Create TicketCreateForm:

  * [x] Ticket type dropdown
  * [x] Assignment dropdown
  * [x] Story points
  * [x] Acceptance criteria
  * [x] Labels
  * [x] Reporter auto-filled
* [x] Add validation for all fields

---

# ## **Phase 7: Gantt Chart & Timeline View**
Return correctly calculated timeline data (dates, dependencies, critical path) from backend.
Display a fully interactive Gantt chart with view switching on frontend.
### **BACKEND**

* [x] Ensure Feature model has:

  * [x] `startDate`
  * [x] `endDate`
  * [x] `duration`
* [x] Extend `GET /api/project/[id]` to return:

  * [x] Sorted features by start date
  * [x] Dependency chains
  * [x] Critical path information
* [x] Create timeline calculation helper:

  * [x] Durations
  * [x] Overlaps
  * [x] Milestones

### **FRONTEND**

* [x] Install Gantt library (`gantt-task-react` or `dhtmlx-gantt`)
* [x] Create GanttView component:

  * [x] Feature bars
  * [x] Dependencies
  * [x] Colors by priority
  * [x] Click → open FeatureModal
  * [x] Hover → tooltip
* [x] Create ViewToggle for Gantt vs Backlog
* [x] Make Gantt the default view
* [x] Save view preference in localStorage
* [x] Integrate into ProjectDetailClient


# ## **Phase 8: Enhanced Team Workload & Assignment List**
Return team members with workload metrics (tickets, story points, vacation status).
Display a searchable, clear assignment dropdown reflecting workload and specialization.
### **BACKEND**

* [x] Ensure `GET /api/team/members` returns:

  * [x] Role badges (role field)
  * [x] Specialization
  * [x] Story point count (computed, returns 0 until Phase 6)
  * [x] Ticket count (computed, returns 0 until Phase 6)
  * [x] Vacation status (isOnVacation field)
* [x] Create `GET /api/team/members/available` to exclude vacationing users

### **FRONTEND**

* [ ] Create EmployeeAssignmentDropdown:

  * [ ] Role badges
  * [ ] Specialization grouping
  * [ ] Workload summary
  * [ ] Vacation indicator
  * [ ] Search/filter
* [ ] Integrate into TicketCreateForm + FeatureModal


# ## **Phase 9: AI Smart Assignment Suggestions**
Backend generates ranked assignee recommendations using task + workload data.
Frontend allows user to request and apply AI assignment suggestions.
### **BACKEND**

* [x] Create `/lib/ai/assignment.ts`
* [x] Implement `suggestAssignment()` using:

  * [x] Task description
  * [x] Required specialization
  * [x] Developer workload
  * [x] Vacation schedules
  * [x] Past assignment history
* [x] Create `POST /api/feature/suggest-assignee`
* [x] Integrate with Gemini:

  * [x] Analyze project history
  * [x] Infer required specialization
  * [x] Rank top engineers with reasoning

### **FRONTEND**

* [ ] Add “AI Suggestion” button inside assignment dropdown
* [ ] Display:

  * [ ] Top 3 recommended assignees
  * [ ] Reasoning
  * [ ] Confidence score
* [ ] Manual override option
* [ ] Autosuggest based on description typing (debounced)

---

# ## **Phase 10: Feedback & Proposal System**
**Status:** ✅ Backend Completed

Store and manage feedback threads and proposal approvals per feature.
Enable PMs to review and compare proposals with AI-generated summaries.
### **BACKEND**

* [x] Create Feedback model
* [x] Add feedback prompts under `/lib/prompts/feedback.ts`
* [x] Add comparison prompts under `/lib/prompts/comparison.ts`
* [x] Implement `analyzeProposal()` in Gemini wrapper (equivalent to `analyzeFeedback()`)
* [x] Create endpoints:

  * [x] `POST /api/feedback/create`
  * [x] `POST /api/feedback/approve` (PM only)
  * [x] `POST /api/feedback/reject` (PM only)
* [x] Ensure feedback respects account isolation

### **FRONTEND**

* [ ] Create FeedbackThread component
* [ ] Add feedback section in FeatureModal
* [ ] Build CommentForm + ProposalForm
* [ ] Build side-by-side ProposalApprovalView
