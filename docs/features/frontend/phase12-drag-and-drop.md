# Phase 12: Drag-and-Drop with Two-Way Confirmation (Frontend)

**Status:** Complete ✅  
**Dependencies:** Phase 6 (Jira-Style Tickets), Phase 10 (Feedback System)  
**Completed:** 2024

## Overview

Phase 12 frontend implements drag-and-drop functionality for moving features between status columns with a two-way confirmation system. Engineers and PMs can propose status changes by dragging cards, but changes require approval from PMs or Admins before being applied.

## Components Created

### PendingChangesNotification (`/components/project/PendingChangesNotification.tsx`)

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

**Usage:**
```tsx
<PendingChangesNotification
  count={pendingCount}
  onClick={() => setIsPendingChangesOpen(true)}
/>
```

### PendingChangesList (`/components/modals/PendingChangesList.tsx`)

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

**Usage:**
```tsx
<PendingChangesList
  isOpen={isPendingChangesOpen}
  onClose={() => setIsPendingChangesOpen(false)}
  pendingChanges={pendingChanges}
  features={displayData.features}
  onApprove={handleApprove}
  onReject={handleReject}
  isApproving={isApproving}
  isRejecting={isRejecting}
/>
```

## Hooks Created

### usePendingChanges (`/hooks/usePendingChanges.ts`)

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

**Usage:**
```ts
const {
  pendingChanges,
  count: pendingCount,
  fetchPendingChanges,
  proposeStatusChange,
  approveStatusChange,
  rejectStatusChange,
  isProposing,
  isApproving,
  isRejecting,
} = usePendingChanges()
```

**Features:**
- Automatic error handling with toast notifications
- Loading states for each operation
- Automatic state updates after operations
- Account isolation (handled by API)

## Integration

### ProjectDetailClient Updates

**Drag-and-Drop Implementation:**
- Added `@dnd-kit/core` and `@dnd-kit/sortable` integration
- Created `DraggableFeatureCard` wrapper component
- Created `DroppableColumn` component for status columns
- Implemented `DndContext` with sensors (pointer, keyboard)
- Added `DragOverlay` for visual feedback during drag

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

**Event Handlers:**
- `handleDragStart` - Sets active feature for overlay
- `handleDragEnd` - Proposes status change on drop
- `handleApprove` - Approves pending status change
- `handleReject` - Rejects pending status change

### FeatureCard Updates

**Changes:**
- Added `pendingChangeId` prop
- Shows yellow border when pending change exists
- Displays "Pending" badge with clock icon
- Styled with Tailwind (yellow background, border)

**Usage:**
```tsx
<FeatureCard
  feature={feature}
  onClick={onClick}
  canEdit={canEdit}
  pendingChangeId={pendingChangeId}
/>
```

### Optimistic UI Updates

When a user drags a feature to a new column:
1. Optimistic update immediately moves card to new column
2. API call proposes status change
3. If successful, card shows "Pending" badge
4. If failed, card reverts to original column
5. Real-time updates refresh data when change is approved/rejected

**Implementation:**
```ts
const handleDragEnd = async (event: DragEndEvent) => {
  // ... validation checks
  
  // Optimistic UI update
  const updatedFeatures = displayData.features.map((f) =>
    f._id === featureId || f.id === featureId ? { ...f, status: newStatus } : f
  )
  setOptimisticFeatures(updatedFeatures)

  // Propose status change
  const result = await proposeStatusChange(featureId, newStatus)

  if (result) {
    await fetchPendingChanges(projectId)
    refetch()
  } else {
    // Revert optimistic update on error
    setOptimisticFeatures(null)
  }
}
```

### Rejection Handling

When a status change is rejected:
1. Pending change is removed from list
2. Feature card reverts to original column (via data refresh)
3. Toast notification shows rejection message
4. Optional rejection reason is displayed

**Implementation:**
```ts
const handleReject = async (featureId: string, pendingChangeId: string, reason?: string) => {
  const success = await rejectStatusChange(featureId, pendingChangeId, reason)
  if (success) {
    await fetchPendingChanges(projectId)
    refetch() // Refreshes data, card reverts to original column
  }
}
```

## Libraries Used

### @dnd-kit/core
- Core drag-and-drop functionality
- `DndContext` - Main context provider
- `DragOverlay` - Drag overlay component
- `useDroppable` - Droppable area hook
- Sensors: `PointerSensor`, `KeyboardSensor`

### @dnd-kit/sortable
- Sortable list support
- `SortableContext` - Sortable context provider
- `useSortable` - Sortable item hook
- `verticalListSortingStrategy` - Vertical list strategy

### @dnd-kit/utilities
- Utility functions
- `CSS` - CSS transform utilities
- `sortableKeyboardCoordinates` - Keyboard coordinate getter

## Type Definitions

All types are imported from `/types/api.ts`:

```ts
import type {
  PendingChangeResponse,
  GetPendingChangesResponse,
  ProposeStatusChangeRequest,
  ProposeStatusChangeResponse,
  ApproveStatusChangeRequest,
  ApproveStatusChangeResponse,
  RejectStatusChangeRequest,
  RejectStatusChangeResponse,
} from '@/types/api'
```

## Permission Enforcement

**Viewers:**
- Cannot drag cards (`canEdit` prop controls dragging)
- Can view pending changes
- Cannot approve/reject

**Engineers:**
- Can drag cards to propose status changes
- Can view pending changes
- Cannot approve/reject

**PMs and Admins:**
- Can drag cards to propose status changes
- Can view pending changes
- Can approve/reject status changes

**Implementation:**
```ts
const isViewer = userRole === ROLES.VIEWER
const isPMOrAdmin = userRole === ROLES.PM || userRole === ROLES.ADMIN
const canEdit = !isViewer // Only viewers are read-only
const canApprove = isPMOrAdmin // Only PM and Admin can approve
```

## Styling

**Pending Changes Notification:**
- Bell icon with red badge
- Hover effects
- Responsive design

**Pending Changes List:**
- Modal overlay
- Scrollable content area
- Status labels with color coding
- Loading states
- Button styles (approve green, reject red)

**Feature Card:**
- Yellow border when pending
- "Pending" badge with clock icon
- Smooth transitions

**Drag Overlay:**
- Opacity 0.5 for ghost card
- Smooth animations

## Error Handling

All errors are handled via toast notifications:
- Success: "Status change proposed successfully"
- Error: Error message from API
- Approval: "Status change approved successfully"
- Rejection: "Status change rejected" (with optional reason)

**Implementation:**
```ts
try {
  const result = await proposeStatusChange(featureId, newStatus)
  if (result) {
    toast.success('Status change proposed successfully')
  }
} catch (err) {
  toast.error(err.message)
}
```

## Real-time Updates

Pending changes are fetched on:
- Component mount
- After proposing a change
- After approving a change
- After rejecting a change
- Project data refresh

**Implementation:**
```ts
useEffect(() => {
  if (projectId) {
    fetchPendingChanges(projectId)
  }
}, [projectId])
```

## Testing Considerations

- Test drag-and-drop functionality (drag card between columns)
- Test optimistic UI updates (immediate visual feedback)
- Test approval/rejection UI (buttons, modals)
- Test notification badge (count, click handler)
- Test animation on rejection (card revert)
- Test permission enforcement (Viewers cannot drag)
- Test on mobile devices (touch support)
- Test keyboard navigation (accessibility)
- Test error handling (network errors, validation errors)
- Test real-time updates (pending changes refresh)

## Files Created

- `/components/project/PendingChangesNotification.tsx` - Notification badge component
- `/components/modals/PendingChangesList.tsx` - Pending changes modal
- `/hooks/usePendingChanges.ts` - Pending changes hook

## Files Modified

- `/components/project/ProjectDetailClient.tsx` - Added drag-and-drop integration
- `/components/project/FeatureCard.tsx` - Added pending status display
- `/docs/frontend/summary.md` - Added Phase 12 documentation
- `/docs/phases.md` - Marked Phase 12 frontend tasks as complete

## Dependencies

**New Dependencies:**
- `@dnd-kit/core` - Already installed
- `@dnd-kit/sortable` - Already installed
- `@dnd-kit/utilities` - Already installed

**Existing Dependencies:**
- `react-hot-toast` - Toast notifications
- `lucide-react` - Icons (Bell, CheckCircle, XCircle, ClockIcon)

## Future Enhancements

- Email notifications when status change is proposed/approved/rejected
- Batch approval/rejection of multiple changes
- Status change history/audit log
- Automatic expiration of old pending changes
- Better mobile touch support
- Accessibility improvements (ARIA labels, keyboard navigation)
- Animation improvements (smooth card transitions)
- Real-time subscriptions for pending changes (Supabase Realtime)

