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

## Phase Dependencies

**Completed Phases (1-11):**
- Phase 1-3: Core infrastructure ✅
- Phase 4: Account Isolation & Permissions ✅
- Phase 5: User Roles & Team Management ✅
- Phase 6: Jira-Style Ticket Model ✅
- Phase 7: Timeline Engine & Gantt ✅
- Phase 8: Team Workload & Availability ✅
- Phase 9: AI Smart Assignment Suggestions ✅
- Phase 10: Feedback & Proposal System ✅

**Upcoming Phases:**
- Phase 12: Drag-and-Drop (depends on: Phase 6, Phase 10)
- Phase 13: Multi-Project Gantt (depends on: Phase 7)
- Phase 14: PM Project Visibility (depends on: Phase 4)

## Migration Notes

When adding new database fields:
1. Create migration SQL file in `/supabase/`
2. Document migration in phase notes
4. Update schema.sql with new structure
5. Update TypeScript types in `/types/database.ts` and `/models/`

When adding new API endpoints:
1. Document in `/docs/api.md`
2. Add to permission matrix
3. Update API types in `/types/api.ts`
4. Add validation functions if needed

When adding new constants:
1. Add to `/lib/constants.ts`
2. Document in architecture docs
3. Update validation functions if needed

## Phase Status

**Total Phases:** 14  
**Completed:** 10  
**Remaining:** 4

---

## **Phase 11: AI-Powered Chatbot for Ticket Generation**

**Status:** Complete ✅  
**Dependencies:** Phase 6 (Jira-Style Tickets), Phase 9 (AI Assignment)  
**Estimated Complexity:** High

### Before Starting

**Prerequisites:**
- Phase 6 and Phase 9 must be completed
- Understand Gemini API integration patterns (see `/lib/gemini.ts`)
- Review prompt patterns in `/lib/prompts/`
- Understand localStorage patterns for client-side state

**Setup:**
- No database migrations required
- No new constants needed
- New API endpoints: `/api/chat/generate-tickets`, `/api/chat/apply-tickets`

### **BACKEND**

Enable PMs to have an ongoing conversation with AI to generate, modify, and refine tickets interactively.

- [x] Create `/lib/prompts/chatbot.ts` for conversational prompts
- [x] Create chat message types in `/types/chat.ts`:
  - [x] `ChatMessage` (role: user/assistant, content, timestamp)
  - [x] `ChatContext` (projectId, conversationHistory, generatedTickets)
- [x] Implement `chatWithAI()` in `/lib/gemini.ts`:
  - [x] Accept conversation history + new message
  - [x] Return AI response + updated ticket suggestions
  - [x] Understand commands like "add auth to sprint 2", "change priority of ticket 3"
- [x] Create `POST /api/chat/generate-tickets`:
  - [x] Accept: projectId, message, conversationHistory (from localStorage)
  - [x] Return: AI response, suggested tickets (array), confidence scores
- [x] Create `POST /api/chat/apply-tickets`:
  - [x] Accept: projectId, tickets[] (from chat suggestions)
  - [x] Bulk create tickets with AI-suggested assignments
  - [x] Return: created ticket IDs

**API Changes:**
- New endpoint: `POST /api/chat/generate-tickets`
- New endpoint: `POST /api/chat/apply-tickets`
- Both require PM/Admin permissions
- Both enforce account isolation

**Constants Updates:**
- None required

**Database Changes:**
- None required (uses existing features table)


### **FRONTEND**

- [x] Replace roadmap summary textbox with ChatInterface component:
  - [x] Persistent chat panel (collapsible sidebar or bottom drawer)
  - [x] Message history display
  - [x] Input field with "Generate Tickets" button
- [x] Create TicketGenerationControls component:
  - [x] Slider: "Generate All" / "One at a Time" / "None" (like Cursor's allowlist)
  - [x] Shows pending AI-suggested tickets in queue
- [x] Implement lazy loading for tickets:
  - [x] Show skeleton loaders when generation starts
  - [x] Fade in tickets as Gemini responds (stagger animation)
  - [x] Complete fade after assignee suggestion loads
  - [x] Use loading state timing from first ticket for consistency
- [x] Store chat history in localStorage:
  - [x] Key: `chat-history-${projectId}`
  - [x] Max 50 messages (prune oldest)
  - [x] Clear on project deletion
- [x] Add "Modify with AI" button on project page to reopen chat

**Frontend Changes:**
- New component: `ChatInterface` (in `/components/project/`)
- New component: `TicketGenerationControls` (in `/components/project/`)
- Update: `CreateProjectModal` or project page to include chat
- New hook: `useChat` (optional, in `/hooks/`)

**Testing:**
- [ ] Test chat UI interactions
- [ ] Test localStorage persistence
- [ ] Test ticket generation UI
- [ ] Test lazy loading animations
- [ ] Test chat history management
- [ ] Test on mobile devices

**Completion Checklist:**
- [x] All backend tasks complete
- [x] All frontend tasks complete
- [x] API documentation updated
- [x] Feature documentation created
- [x] Backend summary updated
- [x] Frontend summary updated
- [ ] Manual testing complete
- [ ] Code reviewed

---

## **Phase 12: Drag-and-Drop with Two-Way Confirmation**

**Status:** Complete ✅  
**Dependencies:** Phase 6 (Jira-Style Tickets), Phase 10 (Feedback System)  
**Estimated Complexity:** Medium

### Before Starting

**Prerequisites:**
- Phase 6 and Phase 10 must be completed
- Understand permission system (see `/lib/api/permissions.ts`)
- Review feature status update patterns

**Setup:**
- Database migration required: New `pending_changes` table
- New constants: PendingChange status enum
- New API endpoints: `/api/feature/[id]/propose-status-change`, `/api/feature/[id]/approve-status-change`, `/api/feature/[id]/reject-status-change`, `/api/project/[id]/pending-changes`

### **BACKEND**

Allow PMs and Engineers to drag tickets between status columns with mutual approval required.

### **BACKEND**

- [x] Create PendingChange model:
  - [x] `featureId`
  - [x] `proposedBy` (userId)
  - [x] `fromStatus`
  - [x] `toStatus`
  - [x] `status` (pending/approved/rejected)
  - [x] `createdAt`
- [x] Create `POST /api/feature/[id]/propose-status-change`:
  - [x] Accept: newStatus
  - [x] Create PendingChange record
  - [x] Return: pendingChangeId
- [x] Create `POST /api/feature/[id]/approve-status-change`:
  - [x] Accept: pendingChangeId
  - [x] Update Feature status
  - [x] Mark PendingChange as approved
  - [x] Notify proposer
- [x] Create `POST /api/feature/[id]/reject-status-change`:
  - [x] Mark PendingChange as rejected
  - [x] Notify proposer with reason
- [x] Create `GET /api/project/[id]/pending-changes`:
  - [x] Return all pending status changes for project
  - [x] Used for notification counter

**API Changes:**
- New endpoint: `POST /api/feature/[id]/propose-status-change` (Engineers, PMs, Admins)
- New endpoint: `POST /api/feature/[id]/approve-status-change` (PMs, Admins)
- New endpoint: `POST /api/feature/[id]/reject-status-change` (PMs, Admins)
- New endpoint: `GET /api/project/[id]/pending-changes` (All authenticated users)

**Constants Updates:**
- Add `PENDING_CHANGE_STATUS` to `/lib/constants.ts`: `PENDING`, `APPROVED`, `REJECTED`

**Database Changes:**
- Create `pending_changes` table with fields: `id`, `feature_id`, `proposed_by`, `from_status`, `to_status`, `status`, `account_id`, `created_at`
- Add index on `feature_id` and `account_id`
- Add foreign key to `features` table

**Migration SQL:**
```sql
CREATE TABLE pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  proposed_by UUID REFERENCES users(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  account_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pending_changes_feature_id ON pending_changes(feature_id);
CREATE INDEX idx_pending_changes_account_id ON pending_changes(account_id);
```

**Testing:**
- [ ] Test status change proposal
- [ ] Test approval workflow
- [ ] Test rejection workflow
- [ ] Test permission enforcement
- [ ] Test account isolation
- [ ] Test notification counter

### **FRONTEND**

- [x] Install drag-and-drop library (`@dnd-kit/core` or `react-beautiful-dnd`)
- [x] Make Kanban columns draggable:
  - [x] Optimistic UI update (immediate visual feedback)
  - [x] Ghost card shows in new column
  - [x] Original card shows "Pending approval" badge
- [x] Create PendingChangesNotification component:
  - [x] Small counter badge on project card/header
  - [x] Shows count of pending approvals
  - [x] Click → opens PendingChangesList modal
- [x] Create PendingChangesList modal:
  - [x] Shows all pending status changes
  - [x] Each item: "User X wants to move Feature Y from A → B"
  - [x] Approve / Reject buttons
  - [x] Reason field for rejection
- [x] Handle rejection:
  - [x] Revert card to original column with animation
  - [x] Show toast: "Change rejected by [User]"

**Frontend Changes:**
- Install: `@dnd-kit/core` or `react-beautiful-dnd` package
- New component: `PendingChangesNotification` (in `/components/project/`)
- New component: `PendingChangesList` modal (in `/components/modals/`)
- Update: `ProjectDetailClient` to support drag-and-drop
- Update: `FeatureCard` to show pending status
- New hook: `usePendingChanges` (optional, in `/hooks/`)

**Testing:**
- [ ] Test drag-and-drop functionality
- [ ] Test optimistic UI updates
- [ ] Test approval/rejection UI
- [ ] Test notification badge
- [ ] Test animation on rejection
- [ ] Test on mobile devices (if supported)

**Completion Checklist:**
- [x] All backend tasks complete
- [x] All frontend tasks complete
- [x] Database migration applied
- [x] API documentation updated
- [x] Feature documentation created
- [x] Backend summary updated
- [x] Frontend summary updated
- [ ] Manual testing complete
- [ ] Code reviewed


---
## **Phase 11.5: User Stories & Personas**

**Status:** Complete ✅
**Dependencies:** Phase 11 (AI Chatbot for Ticket Generation)
**Estimated Complexity:** Medium

### Before Starting

**Prerequisites:**

* Phase 11 must be completed
* Understand project layout and ticket integration patterns
* Review AI alignment checks (Gemini integration)

**Setup:**

* Database migration required: `user_stories` table
* New constants: `USER_STORY_FIELDS`
* New API endpoints:

  * `POST /api/user-story` (create)
  * `PUT /api/user-story/[id]` (update)
  * `DELETE /api/user-story/[id]` (delete)
  * `GET /api/user-story/project/[id]` (list for project)
  * `POST /api/ticket/[id]/assign-user-story` (link ticket)

---

### **BACKEND**

Enable PMs to create, edit, delete, and link user stories to tickets, with AI validation.

* [x] Create `user_stories` table:

  * `id` UUID primary key
  * `project_id` UUID
  * `name` TEXT
  * `role` TEXT
  * `goal` TEXT
  * `benefit` TEXT
  * `demographics` JSONB (age, location, technical skill)
  * `created_by` UUID
  * `created_at` TIMESTAMP
  * `updated_at` TIMESTAMP
* [x] CRUD endpoints for user stories
* [x] Link tickets to user stories: `ticket_user_story` join table (`ticket_id`, `user_story_id`)
* [x] AI alignment check endpoint:

  * [x] Accepts projectId, ticketId
  * [x] Returns alignment score / suggestions
* [x] Permissions: Only PMs/Admins can CRUD user stories
* [x] Account isolation enforced

**Migration SQL:**

```sql
CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  goal TEXT NOT NULL,
  benefit TEXT NOT NULL,
  demographics JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ticket_user_story (
  ticket_id UUID REFERENCES features(id) ON DELETE CASCADE,
  user_story_id UUID REFERENCES user_stories(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, user_story_id)
);
```

---

### **FRONTEND**

* [x] Add **User Stories tab** on project page (switchable with roadmap/tickets)
* [x] User Stories UI:

  * [x] List of user stories with edit/delete buttons
  * [x] Add new user story form (fields: name, role, goal, benefit, demographics)
  * [x] Link/unlink tickets via dropdown or drag-and-drop
* [x] AI validation UI:

  * [x] Show alignment suggestions for tickets
  * [x] Option to accept/reject AI recommendations
* [x] Local state: store last 50 user stories per project in cache for performance

**Frontend Components:**

* `UserStoriesTab` (tab wrapper) ✅
* `UserStoryCard` (displays story + linked tickets) ✅
* `UserStoryForm` (create/edit form) ✅
* `TicketAlignmentCheck` (AI alignment checker UI) ✅
* Hook: `useUserStories` for CRUD + AI validation ✅

---

### **TESTING**

* [ ] CRUD user stories (create, read, update, delete)
* [ ] Link/unlink tickets to user stories
* [ ] AI alignment suggestions are accurate and actionable
* [ ] Permissions enforced (PM/Admin only)
* [ ] Account isolation enforced
* [ ] Tab switching works and renders correctly
* [ ] Mobile-friendly UI

---

### **Completion Checklist**

* [x] Backend tasks complete
* [x] Frontend tasks complete
* [x] Database migration applied
* [x] API documentation updated
* [x] Feature documentation created
* [x] Backend summary updated
* [x] Frontend summary updated
* [ ] Manual testing complete
* [ ] Code reviewed

---


---

## **Phase 13: Multi-Project Gantt Dashboard**

**Status:** Not Started  
**Dependencies:** Phase 7 (Timeline Engine & Gantt)  
**Estimated Complexity:** Medium

### Before Starting

**Prerequisites:**
- Phase 7 must be completed
- Understand timeline utilities (see `/lib/api/timeline.ts`)
- Review Gantt chart implementation

**Setup:**
- No database migrations required
- No new constants needed
- New API endpoints: `/api/gantt/overview`, `/api/gantt/admin`
- New page: `/app/gantt-overview/page.tsx`

### **BACKEND**

Display aggregated Gantt chart showing all projects a PM oversees, with drill-down capability.

### **BACKEND**

- [ ] Create `GET /api/gantt/overview`:
  - [ ] Accept: userId, filterBy (project/engineer/label)
  - [ ] Return all projects user has access to with timeline data
  - [ ] Include: project name, features, start/end dates, assignees
- [ ] Create `GET /api/gantt/admin`:
  - [ ] Admin-only endpoint
  - [ ] Return ALL projects across all PMs
  - [ ] Include PM ownership info
- [ ] Add query params for filtering:
  - [ ] `?groupBy=project` (default)
  - [ ] `?groupBy=engineer` (show all tasks per engineer)
  - [ ] `?groupBy=label` (group by label/tag)
  - [ ] `?engineerId=X` (filter to specific engineer)

**API Changes:**
- New endpoint: `GET /api/gantt/overview` (PMs, Admins)
- New endpoint: `GET /api/gantt/admin` (Admins only)
- Query parameters: `?groupBy=project|engineer|label`, `?engineerId=uuid`, `?projectId=uuid`

**Constants Updates:**
- None required

**Database Changes:**
- None required (uses existing projects and features)

**Testing:**
- [ ] Test multi-project Gantt data aggregation
- [ ] Test filtering by engineer
- [ ] Test filtering by project
- [ ] Test grouping options
- [ ] Test admin endpoint (all projects)
- [ ] Test permission enforcement
- [ ] Test account isolation

### **FRONTEND**

- [ ] Create `/app/gantt-overview/page.tsx` (new page):
  - [ ] Multi-project Gantt chart (horizontal timeline)
  - [ ] Each project as separate swimlane
  - [ ] Features shown as bars within project lanes
- [ ] Create FilterControls component:
  - [ ] Toggle: Group by Project / Engineer / Label
  - [ ] Dropdown: Filter by specific engineer
  - [ ] Dropdown: Filter by specific project (for PMs with many projects)
- [ ] Implement drill-down:
  - [ ] Click project name → navigate to single-project Gantt
  - [ ] Click feature bar → open FeatureModal
  - [ ] Click engineer name → filter to that engineer's tasks
- [ ] Add to navigation:
  - [ ] PM role: "Gantt Overview" menu item
  - [ ] Admin role: "Admin Gantt Overview" (shows all PMs' projects)
- [ ] Handle large datasets:
  - [ ] Virtual scrolling for many projects
  - [ ] Collapse/expand projects
  - [ ] Date range selector (show only Q1, Q2, etc.)

**Frontend Changes:**
- New page: `/app/gantt-overview/page.tsx` (server component)
- New component: `MultiProjectGantt` (in `/components/gantt/`)
- New component: `FilterControls` (in `/components/gantt/`)
- Update: Navigation to include "Gantt Overview" for PMs/Admins

**Testing:**
- [ ] Test multi-project Gantt rendering
- [ ] Test filtering controls
- [ ] Test drill-down functionality
- [ ] Test virtual scrolling (if many projects)
- [ ] Test date range selector
- [ ] Test on mobile devices

**Completion Checklist:**
- [ ] All backend tasks complete
- [ ] All frontend tasks complete
- [ ] API documentation updated
- [ ] Feature documentation created
- [ ] Backend summary updated
- [ ] Frontend summary updated
- [ ] Manual testing complete
- [ ] Code reviewed

---

## **Phase 14: PM Project Visibility & Admin Oversight**

**Status:** Not Started  
**Dependencies:** Phase 4 (Account Isolation & Permissions)  
**Estimated Complexity:** Low

### Before Starting

**Prerequisites:**
- Phase 4 must be completed
- Understand permission system (see `/lib/api/permissions.ts`)
- Review project access patterns

**Setup:**
- Database migration required: Add `owner_id` and `co_owner_ids` to projects table
- No new constants needed
- New API endpoints: `POST /api/project/[id]/add-coowner`, `DELETE /api/project/[id]/remove-coowner`
- Update: `GET /api/projects` to filter by ownership

### **BACKEND**

Ensure PMs only see their own projects, co-owners see shared projects, and Admins see everything.

### **BACKEND**

- [ ] Update Project model:
  - [ ] `ownerId` (primary PM)
  - [ ] `coOwnerIds[]` (array of PM user IDs)
- [ ] Update `GET /api/projects`:
  - [ ] Filter by: ownerId = userId OR userId in coOwnerIds (for PMs)
  - [ ] Return ALL projects (for Admins)
  - [ ] Add query param `?ownedBy=userId` (Admin only - filter by specific PM)
- [ ] Update `canViewProject()` in permissions:
  - [ ] Allow if: user is owner, user is co-owner, or user is admin
- [ ] Update `canEditProject()` in permissions:
  - [ ] Allow if: user is owner, user is co-owner, or user is admin
- [ ] Create `POST /api/project/[id]/add-coowner`:
  - [ ] Accept: userId (must be PM role)
  - [ ] Add to coOwnerIds array
  - [ ] Only owner or admin can add co-owners
- [ ] Create `DELETE /api/project/[id]/remove-coowner`:
  - [ ] Remove userId from coOwnerIds

### **FRONTEND**

- [ ] Update ProjectCard component:
  - [ ] Show owner name
  - [ ] Show co-owner badges if any
  - [ ] Admin view: show which PM owns project
- [ ] Create ProjectSettings modal:
  - [ ] "Manage Co-Owners" section
  - [ ] Search/select PMs to add as co-owners
  - [ ] Remove co-owner button
  - [ ] Only visible to owner or admin
- [ ] Update CreateProjectModal:
  - [ ] Option to "Add Co-Owners" during creation
  - [ ] Multi-select dropdown of PMs
- [ ] Admin Dashboard:
  - [ ] Filter projects by PM owner
  - [ ] See ownership transfer option
  - [ ] See all pending changes across all projects

**Frontend Changes:**
- Update: `ProjectCard` to show owner and co-owners
- New component: `ProjectSettings` modal (in `/components/modals/`)
- Update: `CreateProjectModal` to allow adding co-owners
- Update: `DashboardClient` to show ownership info
- Update: Admin dashboard to filter by PM owner

**Testing:**
- [ ] Test project visibility for PMs
- [ ] Test co-owner management UI
- [ ] Test admin project filtering
- [ ] Test ownership display
- [ ] Test permission enforcement in UI

**Completion Checklist:**
- [ ] All backend tasks complete
- [ ] All frontend tasks complete
- [ ] Database migration applied
- [ ] API documentation updated
- [ ] Feature documentation created
- [ ] Backend summary updated
- [ ] Frontend summary updated
- [ ] Manual testing complete
- [ ] Code reviewed

---

## Progress Summary

**Total Phases:** 14  
**Completed:** 13  
**Remaining:** 1

**New Features Added:**
- Phase 11: AI Chatbot (ticket generation)
- Phase 11.5: User Stories & Personas
- Phase 12: Drag-and-drop with approval
- Phase 13: Multi-project Gantt
- Phase 14: PM visibility & co-ownership

## Known Issues

1. Type mismatch: `'proposal'` (DB) vs `'timeline_proposal'` (API) - Handled by conversion functions
2. Some components still use magic strings instead of constants - Planned migration
3. Real-time subscriptions need cleanup verification - Monitor for memory leaks

## Rollback Procedures

If a phase needs to be reverted:

1. **Database Migrations:**
   - Create rollback migration SQL
   - Test on development database
   - Document rollback steps

2. **API Changes:**
   - Remove new endpoints
   - Revert permission changes
   - Update API documentation

3. **Frontend Changes:**
   - Remove new components
   - Revert UI changes
   - Update frontend summary

4. **Constants:**
   - Remove new constants if not used elsewhere
   - Update validation functions

Always test rollback on development environment before applying to production.