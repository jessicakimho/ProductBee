# Phase 12: Drag-and-Drop with Two-Way Confirmation

**Status:** Backend Complete ✅  
**Dependencies:** Phase 6 (Jira-Style Tickets), Phase 10 (Feedback System)  
**Completed:** 2024

## Overview

Phase 12 implements a two-way confirmation system for status changes on features. Engineers and PMs can propose status changes, but changes require approval from PMs or Admins before being applied. This ensures proper oversight and prevents unauthorized status updates.

## Database Schema

### `pending_changes` Table

Created via migration: `/supabase/migration_add_pending_changes.sql`

```sql
CREATE TABLE pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  account_id TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_pending_changes_feature_id` - Fast lookup by feature
- `idx_pending_changes_account_id` - Account isolation
- `idx_pending_changes_proposed_by` - User lookup
- `idx_pending_changes_status` - Filter by status
- `idx_pending_changes_created_at` - Sort by date

**Key Features:**
- CASCADE delete when feature is deleted
- Account isolation via `account_id`
- Status validation via CHECK constraint
- Optional rejection reason for transparency

## Models

### PendingChange Model (`/models/PendingChange.ts`)

```ts
export interface PendingChange extends BaseModel {
  feature_id: string
  proposed_by: string // User ID
  from_status: string // DB format status (backlog, active, blocked, complete)
  to_status: string // DB format status (backlog, active, blocked, complete)
  status: PendingChangeStatus // pending, approved, rejected
  account_id: string
  rejection_reason?: string | null
}
```

**Status Values:**
- `pending` - Awaiting approval/rejection
- `approved` - Change approved and applied
- `rejected` - Change rejected by PM/Admin

## Constants

### PENDING_CHANGE_STATUS (`/lib/constants.ts`)

```ts
export const PENDING_CHANGE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const
```

## API Endpoints

### POST `/api/feature/:id/propose-status-change`

Proposes a status change for a feature. Creates a pending change record that requires approval.

**Permissions:** Engineers, PMs, and Admins (Viewers cannot propose changes)

**Request Body:**
```json
{
  "newStatus": "in_progress"
}
```

**Validation:**
- `newStatus` must be valid API status: `not_started`, `in_progress`, `blocked`, `complete`
- New status must differ from current status
- Only one pending change per feature at a time
- Feature must exist and be accessible

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingChange": {
      "_id": "uuid",
      "id": "uuid",
      "featureId": "uuid",
      "proposedBy": {
        "_id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "fromStatus": "not_started",
      "toStatus": "in_progress",
      "status": "pending",
      "rejectionReason": null,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Implementation Details:**
- Converts API status format to DB format for storage
- Checks for existing pending changes before creating new one
- Enforces account isolation on all queries
- Returns API format status in response

### POST `/api/feature/:id/approve-status-change`

Approves a pending status change and applies it to the feature. Only PMs and Admins can approve.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "pendingChangeId": "uuid"
}
```

**Validation:**
- `pendingChangeId` must be valid UUID
- Pending change must belong to specified feature
- Pending change must be in "pending" status
- Feature must exist and be accessible

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Status change approved and feature updated",
    "pendingChange": {
      "_id": "uuid",
      "id": "uuid",
      "featureId": "uuid",
      "proposedBy": { ... },
      "fromStatus": "not_started",
      "toStatus": "in_progress",
      "status": "approved",
      "rejectionReason": null,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "feature": {
      "_id": "uuid",
      "id": "uuid",
      "status": "in_progress",
      ...
    }
  }
}
```

**Implementation Details:**
- Updates pending change status to "approved"
- Updates feature status to proposed status (in DB format)
- Includes rollback logic if feature update fails
- Returns updated feature with API format status

### POST `/api/feature/:id/reject-status-change`

Rejects a pending status change. Only PMs and Admins can reject. Optionally includes a rejection reason.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "pendingChangeId": "uuid",
  "reason": "Optional rejection reason"
}
```

**Validation:**
- `pendingChangeId` must be valid UUID
- `reason` is optional string
- Pending change must belong to specified feature
- Pending change must be in "pending" status

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Status change rejected: Optional rejection reason",
    "pendingChange": {
      "_id": "uuid",
      "id": "uuid",
      "featureId": "uuid",
      "proposedBy": { ... },
      "fromStatus": "not_started",
      "toStatus": "in_progress",
      "status": "rejected",
      "rejectionReason": "Optional rejection reason",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Implementation Details:**
- Updates pending change status to "rejected"
- Stores optional rejection reason
- Does not modify feature status
- Returns rejected pending change with reason

### GET `/api/project/:id/pending-changes`

Returns all pending status changes for features in a project. Used for notification counters and approval UI.

**Permissions:** All authenticated users (project must belong to user's account)

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingChanges": [
      {
        "_id": "uuid",
        "id": "uuid",
        "featureId": "uuid",
        "proposedBy": {
          "_id": "user-uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "fromStatus": "not_started",
        "toStatus": "in_progress",
        "status": "pending",
        "rejectionReason": null,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Implementation Details:**
- Returns only pending changes (status = "pending")
- Filters by project's features via account isolation
- Includes proposer user information
- Converts DB format status to API format
- Ordered by creation date (newest first)

## Type Definitions

### API Types (`/types/api.ts`)

```ts
export interface ProposeStatusChangeRequest {
  newStatus: 'not_started' | 'in_progress' | 'blocked' | 'complete'
}

export interface PendingChangeResponse {
  _id: string
  id: string
  featureId: string
  proposedBy: {
    _id: string
    name: string
    email: string
  }
  fromStatus: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  toStatus: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string | null
  createdAt: string
}

export interface ProposeStatusChangeResponse {
  pendingChange: PendingChangeResponse
}

export interface ApproveStatusChangeRequest {
  pendingChangeId: string
}

export interface ApproveStatusChangeResponse {
  message: string
  pendingChange: PendingChangeResponse
  feature: FeatureResponse
}

export interface RejectStatusChangeRequest {
  pendingChangeId: string
  reason?: string
}

export interface RejectStatusChangeResponse {
  message: string
  pendingChange: PendingChangeResponse
}

export interface GetPendingChangesResponse {
  pendingChanges: PendingChangeResponse[]
}
```

## Security & Permissions

### Account Isolation

All endpoints enforce account isolation:
- All queries filter by `account_id`
- Pending changes are scoped to account
- Users can only see/approve changes in their account

### Permission Matrix

| Action | Viewer | Engineer | PM | Admin |
|--------|--------|----------|----|----|
| Propose status change | ❌ | ✅ | ✅ | ✅ |
| Approve status change | ❌ | ❌ | ✅ | ✅ |
| Reject status change | ❌ | ❌ | ✅ | ✅ |
| View pending changes | ✅ | ✅ | ✅ | ✅ |

### Validation

- Status validation uses `validateFeatureStatusApi()`
- UUID validation for all IDs
- Feature existence and access checks
- Pending change status validation
- Prevents duplicate pending changes

## Format Conversion

Status values are converted between API and DB formats:

**API Format → DB Format:**
- `not_started` → `backlog`
- `in_progress` → `active`
- `blocked` → `blocked`
- `complete` → `complete`

**DB Format → API Format:**
- `backlog` → `not_started`
- `active` → `in_progress`
- `blocked` → `blocked`
- `complete` → `complete`

All endpoints use `statusToDb()` and `statusToApi()` conversion functions from `/lib/api/validation.ts`.

## Error Handling

All endpoints use standard error handling:
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Insufficient permissions or account mismatch
- `404 NOT_FOUND` - Feature or pending change not found
- `400 BAD_REQUEST` - Invalid status, duplicate pending change, or already processed
- `500 INTERNAL_ERROR` - Database error

## Real-time Support

The `pending_changes` table is enabled for Supabase Realtime:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE pending_changes;
```

Frontend can subscribe to pending changes for live updates without polling.

## Workflow

1. **Engineer/PM proposes change:**
   - Calls `POST /api/feature/:id/propose-status-change`
   - Creates pending change record with status "pending"
   - Feature status remains unchanged

2. **PM/Admin reviews:**
   - Calls `GET /api/project/:id/pending-changes` to see all pending changes
   - Reviews proposed changes in UI

3. **PM/Admin approves:**
   - Calls `POST /api/feature/:id/approve-status-change`
   - Pending change status → "approved"
   - Feature status → proposed status
   - Returns updated feature

4. **PM/Admin rejects:**
   - Calls `POST /api/feature/:id/reject-status-change`
   - Pending change status → "rejected"
   - Optional rejection reason stored
   - Feature status remains unchanged

## Testing Considerations

- Test status change proposal with valid/invalid statuses
- Test approval workflow with PM/Admin permissions
- Test rejection workflow with optional reason
- Test permission enforcement (Viewers cannot propose)
- Test account isolation (users cannot see other account's changes)
- Test duplicate pending change prevention
- Test notification counter endpoint
- Test real-time subscriptions

## Files Modified/Created

### Created
- `/models/PendingChange.ts` - PendingChange model
- `/app/api/feature/[id]/propose-status-change/route.ts` - Propose endpoint
- `/app/api/feature/[id]/approve-status-change/route.ts` - Approve endpoint
- `/app/api/feature/[id]/reject-status-change/route.ts` - Reject endpoint
- `/app/api/project/[id]/pending-changes/route.ts` - List endpoint
- `/supabase/migration_add_pending_changes.sql` - Database migration

### Modified
- `/lib/constants.ts` - Added `PENDING_CHANGE_STATUS`
- `/types/api.ts` - Added pending change API types
- `/docs/api.md` - Added API documentation

## Future Enhancements

- Email notifications when status change is proposed/approved/rejected
- Batch approval/rejection of multiple changes
- Status change history/audit log
- Automatic expiration of old pending changes
- Integration with timeline engine for status-dependent calculations

