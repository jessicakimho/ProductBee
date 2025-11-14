# API Documentation

All endpoints are under `/api`, require Auth0 auth (cookie session), and enforce **account isolation** via `account_id` from Auth0 metadata. All queries automatically filter by `account_id`.

## Authentication

All endpoints (except `/api/auth/**`) require authentication via Auth0. The session is stored in HTTP-only cookies and automatically managed by the Auth0 SDK.

## Response Format

All responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated or session expired |
| `FORBIDDEN` | 403 | Insufficient permissions for this action |
| `NOT_FOUND` | 404 | Resource not found or not accessible |
| `BAD_REQUEST` | 400 | Invalid request data or validation failed |
| `INTERNAL_ERROR` | 500 | Server error or unexpected failure |

## Account Isolation

All endpoints enforce account isolation:
- `account_id` is extracted from Auth0 session metadata
- All database queries filter by `account_id`
- Users can only access resources within their account
- Admins have full access within their account only

## Permission Matrix

| Endpoint | Viewer | Engineer | PM | Admin |
|----------|--------|----------|----|----|
| `GET /api/projects` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/project/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/roadmap/generate` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feature/create` | ❌ | ❌ | ✅ | ✅ |
| `PATCH /api/feature/:id` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feature/suggest-assignee` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feedback/create` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/feedback/approve` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feedback/reject` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/user/profile` | ✅ | ✅ | ✅ | ✅ |
| `PATCH /api/user/profile` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/team/members` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/team/members/available` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/feature/:id/propose-status-change` | ❌ | ✅ | ✅ | ✅ |
| `POST /api/feature/:id/approve-status-change` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feature/:id/reject-status-change` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/project/:id/pending-changes` | ✅ | ✅ | ✅ | ✅ |
| `GET /api/user-story` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/user-story` | ❌ | ❌ | ✅ | ✅ |
| `PUT /api/user-story/:id` | ❌ | ❌ | ✅ | ✅ |
| `DELETE /api/user-story/:id` | ❌ | ❌ | ✅ | ✅ |
| `GET /api/user-story/project/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/feature/:id/assign-user-story` | ❌ | ❌ | ✅ | ✅ |
| `DELETE /api/feature/:id/assign-user-story` | ❌ | ❌ | ✅ | ✅ |
| `POST /api/feature/:id/check-alignment` | ✅ | ✅ | ✅ | ✅ |

## Database vs API Format Conversions

The API uses different enum values than the database. Always use conversion functions:

| Field | API Format | Database Format | Conversion Function |
|-------|------------|-----------------|---------------------|
| Feature Status | `not_started`, `in_progress`, `blocked`, `complete` | `backlog`, `active`, `blocked`, `complete` | `statusToApi()`, `statusToDb()` |
| Priority | `critical`, `high`, `medium`, `low` | `P0`, `P1`, `P2` | `priorityToApi()`, `priorityToDb()` |
| Feedback Type | `comment`, `timeline_proposal` | `comment`, `proposal` | `feedbackTypeToApi()`, `feedbackTypeToDb()` |

**Important:** Frontend always sends/receives API format. Backend converts to/from DB format automatically.

---

# Projects

## GET `/api/projects`

Returns all projects for the user's `account_id`.

**Permissions:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "_id": "uuid",
        "id": "uuid",
        "name": "Project Name",
        "description": "Project description",
        "roadmap": {
          "summary": "Roadmap summary",
          "riskLevel": "low"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "createdBy": {
          "name": "Creator Name",
          "email": "creator@example.com"
        }
      }
    ]
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

## GET `/api/project/:id`

Returns project with features, feedback, and timeline data.

**Parameters:**
- `id` (path) - Project UUID

**Permissions:** Authenticated users; project must belong to user's account

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "uuid",
      "id": "uuid",
      "name": "Project Name",
      "description": "Project description",
      "roadmap": {
        "summary": "Roadmap summary",
        "riskLevel": "medium"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "createdBy": {
        "name": "Creator Name",
        "email": "creator@example.com"
      }
    },
    "features": [
      {
        "_id": "uuid",
        "id": "uuid",
        "projectId": "uuid",
        "title": "Feature Title",
        "description": "Feature description",
        "status": "not_started",
        "priority": "high",
        "effortEstimateWeeks": 2,
        "dependsOn": [],
        "assignedTo": "user-uuid",
        "reporter": "user-uuid",
        "storyPoints": 5,
        "labels": ["frontend", "ui"],
        "acceptanceCriteria": "Criteria here",
        "ticketType": "feature",
        "startDate": "2024-01-01",
        "endDate": "2024-01-15",
        "duration": 14,
        "isOnCriticalPath": true,
        "slackDays": 0,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "feedbackByFeature": {
      "feature-uuid": [
        {
          "_id": "uuid",
          "id": "uuid",
          "projectId": "uuid",
          "featureId": "uuid",
          "userId": {
            "name": "User Name",
            "email": "user@example.com"
          },
          "type": "comment",
          "content": "Feedback content",
          "status": "pending",
          "createdAt": "2024-01-01T00:00:00Z"
        }
      ]
    },
    "timeline": {
      "dependencyChains": [
        {
          "featureId": "uuid",
          "chain": ["uuid1", "uuid2"],
          "depth": 2
        }
      ],
      "criticalPath": {
        "path": ["uuid1", "uuid2", "uuid3"],
        "totalDuration": 42,
        "startDate": "2024-01-01",
        "endDate": "2024-02-12"
      },
      "milestones": [
        {
          "date": "2024-01-15",
          "features": ["uuid1", "uuid2"],
          "description": "2 features completing"
        }
      ],
      "overlaps": [
        {
          "feature1": "uuid1",
          "feature2": "uuid2",
          "overlapDays": 5
        }
      ]
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Project not accessible (different account)
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid project ID format

---

# Roadmap

## POST `/api/roadmap/generate`

AI-generates a project with features using Google Gemini. Creates project and features under user's `account_id`.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "projectName": "My New Project",
  "projectDescription": "A detailed description of the project goals and requirements"
}
```

**Validation:**
- `projectName` (required) - Non-empty string
- `projectDescription` (required) - Non-empty string

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "uuid",
      "id": "uuid",
      "name": "My New Project",
      "description": "Project description",
      "roadmap": {
        "summary": "AI-generated roadmap summary",
        "riskLevel": "medium"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "features": [
      {
        "_id": "uuid",
        "id": "uuid",
        "projectId": "uuid",
        "title": "Feature Title",
        "description": "Feature description",
        "status": "not_started",
        "priority": "high",
        "effortEstimateWeeks": 2,
        "ticketType": "feature",
        "storyPoints": 5,
        "labels": ["backend"],
        "acceptanceCriteria": "Criteria here"
      }
    ]
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin
- `400 BAD_REQUEST` - Missing or invalid request body
- `500 INTERNAL_ERROR` - AI generation failed or database error

---

# Features

## POST `/api/feature/create`

Creates a feature in a project under the same `account_id`.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "projectId": "uuid",
  "title": "Feature Title",
  "description": "Feature description",
  "priority": "high",
  "effortEstimateWeeks": 2,
  "dependsOn": ["uuid1", "uuid2"],
  "assignedTo": "user-uuid",
  "storyPoints": 5,
  "labels": ["frontend", "ui"],
  "acceptanceCriteria": "Acceptance criteria here",
  "ticketType": "feature"
}
```

**Validation:**
- `projectId` (required) - Valid UUID
- `title` (required) - Non-empty string
- `description` (required) - Non-empty string
- `priority` (required) - One of: `critical`, `high`, `medium`, `low`
- `effortEstimateWeeks` (required) - Positive integer
- `dependsOn` (optional) - Array of feature UUIDs
- `assignedTo` (optional) - User UUID or null
- `storyPoints` (optional) - Non-negative integer or null
- `labels` (optional) - Array of strings
- `acceptanceCriteria` (optional) - String or null
- `ticketType` (optional) - One of: `feature`, `bug`, `epic`, `story` (default: `feature`)

**Response:**
```json
{
  "success": true,
  "data": {
    "feature": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "title": "Feature Title",
      "description": "Feature description",
      "status": "not_started",
      "priority": "high",
      "effortEstimateWeeks": 2,
      "dependsOn": ["uuid1", "uuid2"],
      "assignedTo": "user-uuid",
      "storyPoints": 5,
      "labels": ["frontend", "ui"],
      "acceptanceCriteria": "Acceptance criteria here",
      "ticketType": "feature",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or project not accessible
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid request data

## PATCH `/api/feature/:id`

Updates any feature fields. Feature must belong to user's `account_id`.

**Parameters:**
- `id` (path) - Feature UUID

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "critical",
  "title": "Updated Title",
  "description": "Updated description",
  "effortEstimateWeeks": 3,
  "dependsOn": ["uuid1"],
  "assignedTo": "user-uuid",
  "storyPoints": 8,
  "labels": ["backend", "api"],
  "acceptanceCriteria": "Updated criteria",
  "ticketType": "bug"
}
```

**Validation:**
- All fields are optional
- `status` - One of: `not_started`, `in_progress`, `blocked`, `complete`
- `priority` - One of: `critical`, `high`, `medium`, `low`
- `effortEstimateWeeks` - Positive integer
- `dependsOn` - Array of feature UUIDs
- `assignedTo` - User UUID or null
- `storyPoints` - Non-negative integer or null
- `labels` - Array of strings
- `ticketType` - One of: `feature`, `bug`, `epic`, `story`

**Response:**
```json
{
  "success": true,
  "data": {
    "feature": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "title": "Updated Title",
      "status": "in_progress",
      "priority": "critical",
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feature not accessible
- `404 NOT_FOUND` - Feature not found
- `400 BAD_REQUEST` - Invalid request data

## POST `/api/feature/suggest-assignee`

AI-powered assignee suggestions using Google Gemini. Suggests engineers in the same account, excluding those on vacation, based on specialization, workload, and past experience.

**Permissions:** PM or Admin only

**Request Body (Option 1 - Task Context):**
```json
{
  "taskTitle": "Implement user authentication",
  "taskDescription": "Add OAuth2 authentication with Google and GitHub",
  "taskLabels": ["backend", "security"],
  "taskType": "feature",
  "projectId": "uuid"
}
```

**Request Body (Option 2 - Feature ID):**
```json
{
  "featureId": "uuid"
}
```

**Validation:**
- Either `taskTitle` + `taskDescription` OR `featureId` required
- `taskType` (optional) - One of: `feature`, `bug`, `epic`, `story`
- `taskLabels` (optional) - Array of strings
- `projectId` (optional) - Valid UUID
- `featureId` (optional) - Valid UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestion": {
      "requiredSpecialization": "Backend",
      "recommendations": [
        {
          "engineerId": "user-uuid",
          "engineerName": "John Doe",
          "reasoning": "Has experience with OAuth2 and backend security",
          "confidenceScore": 0.85,
          "matchFactors": {
            "specializationMatch": true,
            "workloadSuitable": true,
            "pastExperience": true
          }
        }
      ]
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin
- `404 NOT_FOUND` - Feature or project not found
- `400 BAD_REQUEST` - Invalid request data
- `500 INTERNAL_ERROR` - AI suggestion failed

---

# Feedback

## POST `/api/feedback/create`

Creates a comment or timeline proposal on a feature.

**Permissions:** Engineers, PMs, and Admins (Viewers cannot create feedback)

**Request Body:**
```json
{
  "projectId": "uuid",
  "featureId": "uuid",
  "type": "comment",
  "content": "This feature needs more clarification on the API design.",
  "proposedRoadmap": null
}
```

**For Timeline Proposal:**
```json
{
  "projectId": "uuid",
  "featureId": "uuid",
  "type": "timeline_proposal",
  "content": "I propose extending the timeline by 2 weeks due to complexity",
  "proposedRoadmap": {
    "features": [
      {
        "id": "uuid",
        "startDate": "2024-01-15",
        "endDate": "2024-02-15",
        "duration": 30
      }
    ]
  }
}
```

**Validation:**
- `projectId` (required) - Valid UUID
- `featureId` (required) - Valid UUID
- `type` (required) - One of: `comment`, `timeline_proposal`
- `content` (required) - Non-empty string
- `proposedRoadmap` (optional) - Object (required if type is `timeline_proposal`)

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "featureId": "uuid",
      "userId": {
        "name": "User Name",
        "email": "user@example.com"
      },
      "type": "comment",
      "content": "Feedback content",
      "proposedRoadmap": null,
      "aiAnalysis": null,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Note:** If `type` is `timeline_proposal`, AI analysis is automatically generated and included in `aiAnalysis` field.

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Viewer role (read-only)
- `404 NOT_FOUND` - Project or feature not found
- `400 BAD_REQUEST` - Invalid request data

## POST `/api/feedback/approve`

Approves a timeline proposal and applies changes to the roadmap.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "feedbackId": "uuid"
}
```

**Validation:**
- `feedbackId` (required) - Valid UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Proposal approved and roadmap updated",
    "feedback": {
      "_id": "uuid",
      "id": "uuid",
      "status": "approved",
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feedback not accessible
- `404 NOT_FOUND` - Feedback not found
- `400 BAD_REQUEST` - Invalid request data or feedback is not a proposal

## POST `/api/feedback/reject`

Rejects a timeline proposal.

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "feedbackId": "uuid"
}
```

**Validation:**
- `feedbackId` (required) - Valid UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Proposal rejected",
    "feedback": {
      "_id": "uuid",
      "id": "uuid",
      "status": "rejected",
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feedback not accessible
- `404 NOT_FOUND` - Feedback not found
- `400 BAD_REQUEST` - Invalid request data

---

# User Profile

## GET `/api/user/profile`

Returns the current authenticated user's profile with workload metrics.

**Permissions:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "uuid",
      "id": "uuid",
      "auth0_id": "auth0|...",
      "email": "user@example.com",
      "name": "User Name",
      "role": "engineer",
      "account_id": "account-id",
      "team_id": "team-id",
      "specialization": "Backend",
      "vacationDates": [
        {
          "start": "2024-12-20",
          "end": "2024-12-31"
        }
      ],
      "currentTicketCount": 5,
      "currentStoryPointCount": 25,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Workload Metrics:**
- `currentTicketCount` - Number of assigned features (excluding completed)
- `currentStoryPointCount` - Sum of story points for assigned features (excluding completed)

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

## PATCH `/api/user/profile`

Updates the current user's profile (role, specialization, vacation dates).

**Permissions:** All authenticated users (can update their own profile)

**Request Body:**
```json
{
  "role": "engineer",
  "specialization": "Backend",
  "vacationDates": [
    {
      "start": "2024-12-20",
      "end": "2024-12-31"
    }
  ]
}
```

**Validation:**
- `role` (optional) - One of: `admin`, `pm`, `engineer`, `viewer`
- `specialization` (optional) - One of: `Backend`, `Frontend`, `QA`, `DevOps`, or `null`
- `vacationDates` (optional) - Array of `{start: string, end: string}` or `null`

**Rules:**
- Specialization is only valid for engineers
- Switching role away from engineer clears specialization
- Vacation dates must be valid ISO date strings
- Start date must be before or equal to end date

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "_id": "uuid",
      "id": "uuid",
      "role": "engineer",
      "specialization": "Backend",
      "vacationDates": [
        {
          "start": "2024-12-20",
          "end": "2024-12-31"
        }
      ],
      // ... other fields
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `400 BAD_REQUEST` - Invalid request data (invalid role, specialization, or dates)

---

# Team

## GET `/api/team/members`

Returns all users in the same account with their roles, specializations, workload, and vacation status.

**Permissions:** All authenticated users

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "_id": "uuid",
        "id": "uuid",
        "email": "user@example.com",
        "name": "User Name",
        "role": "engineer",
        "specialization": "Backend",
        "vacationDates": [
          {
            "start": "2024-12-20",
            "end": "2024-12-31"
          }
        ],
        "currentTicketCount": 5,
        "currentStoryPointCount": 25,
        "isOnVacation": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Fields:**
- `isOnVacation` - `true` if user is currently on vacation (today is within any vacation date range)
- `currentTicketCount` - Number of assigned features (excluding completed)
- `currentStoryPointCount` - Sum of story points for assigned features (excluding completed)

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

## GET `/api/team/members/available`

Returns all users in the same account, excluding those currently on vacation.

**Permissions:** All authenticated users

**Query Parameters:** None

**Response:**
Same format as `/api/team/members`, but only includes users where `isOnVacation` is `false`.

**Use Case:** Useful for assignment suggestions and workload planning when you need to exclude unavailable team members.

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

---

# Pending Status Changes (Phase 12: Drag-and-Drop with Two-Way Confirmation)

## POST `/api/feature/:id/propose-status-change`

Proposes a status change for a feature. Creates a pending change that requires approval from a PM or Admin.

**Parameters:**
- `id` (path) - Feature UUID

**Permissions:** Engineers, PMs, and Admins (any authenticated user except Viewers)

**Request Body:**
```json
{
  "newStatus": "in_progress"
}
```

**Validation:**
- `newStatus` (required) - One of: `not_started`, `in_progress`, `blocked`, `complete`
- New status must be different from current status
- Only one pending change can exist per feature at a time

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

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Feature not accessible (different account)
- `404 NOT_FOUND` - Feature not found
- `400 BAD_REQUEST` - Invalid status, status unchanged, or pending change already exists
- `500 INTERNAL_ERROR` - Database error

## POST `/api/feature/:id/approve-status-change`

Approves a pending status change and updates the feature status. Only PMs and Admins can approve changes.

**Parameters:**
- `id` (path) - Feature UUID

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "pendingChangeId": "uuid"
}
```

**Validation:**
- `pendingChangeId` (required) - Valid UUID of pending change
- Pending change must belong to the specified feature
- Pending change must be in "pending" status

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
      "proposedBy": {
        "_id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "fromStatus": "not_started",
      "toStatus": "in_progress",
      "status": "approved",
      "rejectionReason": null,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "feature": {
      "_id": "uuid",
      "id": "uuid",
      "projectId": "uuid",
      "title": "Feature Title",
      "description": "Feature description",
      "status": "in_progress",
      "priority": "high",
      "effortEstimateWeeks": 2,
      "dependsOn": [],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feature not accessible
- `404 NOT_FOUND` - Feature or pending change not found
- `400 BAD_REQUEST` - Pending change already processed or doesn't belong to feature
- `500 INTERNAL_ERROR` - Database error

## POST `/api/feature/:id/reject-status-change`

Rejects a pending status change. Only PMs and Admins can reject changes. Optionally includes a rejection reason.

**Parameters:**
- `id` (path) - Feature UUID

**Permissions:** PM or Admin only

**Request Body:**
```json
{
  "pendingChangeId": "uuid",
  "reason": "Optional rejection reason"
}
```

**Validation:**
- `pendingChangeId` (required) - Valid UUID of pending change
- `reason` (optional) - String explanation for rejection
- Pending change must belong to the specified feature
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
      "proposedBy": {
        "_id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "fromStatus": "not_started",
      "toStatus": "in_progress",
      "status": "rejected",
      "rejectionReason": "Optional rejection reason",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or feature not accessible
- `404 NOT_FOUND` - Feature or pending change not found
- `400 BAD_REQUEST` - Pending change already processed or doesn't belong to feature
- `500 INTERNAL_ERROR` - Database error

## GET `/api/project/:id/pending-changes`

Returns all pending status changes for features in a project. Used for notification counters and approval UI.

**Parameters:**
- `id` (path) - Project UUID

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

**Notes:**
- Only returns pending changes (status: "pending")
- Ordered by creation date (newest first)
- Empty array if no pending changes exist

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Project not accessible (different account)
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid project ID format
- `500 INTERNAL_ERROR` - Database error

---

# User Stories & Personas (Phase 11.5)

User stories are **global** (account-scoped) and can optionally be associated with a project. The `projectId` field is optional for backwards compatibility.

## GET `/api/user-story`

Get all user stories for the account (global, not project-scoped).

**Permissions:** All authenticated users

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
        "demographics": {
          "age": "25-45",
          "location": "North America",
          "technical_skill": "intermediate"
        },
        "createdBy": {
          "_id": "user-uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": null,
        "linkedTicketIds": ["ticket-uuid-1", "ticket-uuid-2"]
      }
    ]
  }
}
```

**Notes:**
- Returns all user stories for the user's account (global scope)
- `projectId` may be `null` for global user stories
- Ordered by creation date (newest first)
- Includes linked ticket IDs for each user story

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `500 INTERNAL_ERROR` - Database error

## POST `/api/user-story`

Create a new user story (global, optionally associated with a project).

**Permissions:** PMs and Admins only

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
- `projectId` (optional) - Valid UUID, must belong to user's account if provided. If omitted, creates a global user story.
- `name` (required) - Non-empty string
- `role` (required) - Non-empty string
- `goal` (required) - Non-empty string
- `benefit` (required) - Non-empty string
- `demographics` (optional) - Object with any key-value pairs (strings, numbers, or null)

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
      "demographics": {
        "age": "25-45",
        "location": "North America",
        "technical_skill": "intermediate"
      },
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

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or project not accessible (if projectId provided)
- `404 NOT_FOUND` - Project not found (if projectId provided)
- `400 BAD_REQUEST` - Invalid request data (missing required fields, invalid project ID)
- `500 INTERNAL_ERROR` - Database error

## PUT `/api/user-story/:id`

Update an existing user story.

**Permissions:** PMs and Admins only

**Parameters:**
- `id` (path) - User Story UUID

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
- If provided, fields must be valid (non-empty strings for name/role/goal/benefit)
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
      "demographics": {
        "age": "25-45",
        "location": "North America",
        "technical_skill": "intermediate"
      },
      "createdBy": {
        "_id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z",
      "linkedTicketIds": ["ticket-uuid-1", "ticket-uuid-2"]
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or user story not accessible
- `404 NOT_FOUND` - User story not found
- `400 BAD_REQUEST` - Invalid request data
- `500 INTERNAL_ERROR` - Database error

## DELETE `/api/user-story/:id`

Delete a user story. Also removes all ticket-user story links.

**Permissions:** PMs and Admins only

**Parameters:**
- `id` (path) - User Story UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User story deleted successfully"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or user story not accessible
- `404 NOT_FOUND` - User story not found
- `500 INTERNAL_ERROR` - Database error

## GET `/api/user-story/project/:id`

Get all user stories for a specific project. Note: User stories are global, but this endpoint filters by project for convenience.

**Parameters:**
- `id` (path) - Project UUID

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
        "demographics": {
          "age": "25-45",
          "location": "North America",
          "technical_skill": "intermediate"
        },
        "createdBy": {
          "_id": "user-uuid",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": null,
        "linkedTicketIds": ["ticket-uuid-1", "ticket-uuid-2"]
      }
    ]
  }
}
```

**Notes:**
- Returns empty array if no user stories exist
- Ordered by creation date (newest first)
- Includes linked ticket IDs for each user story

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Project not accessible (different account)
- `404 NOT_FOUND` - Project not found
- `400 BAD_REQUEST` - Invalid project ID format
- `500 INTERNAL_ERROR` - Database error

## POST `/api/feature/:id/assign-user-story`

Link a user story to a ticket (feature).

**Parameters:**
- `id` (path) - Feature/Ticket UUID

**Permissions:** PMs and Admins only

**Request Body:**
```json
{
  "userStoryId": "uuid"
}
```

**Validation:**
- `userStoryId` (required) - Valid UUID
- User story and ticket must belong to user's account
- Note: User stories are global, so project matching is not required

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

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or ticket/user story not accessible
- `404 NOT_FOUND` - Ticket or user story not found
- `400 BAD_REQUEST` - Invalid request data or link already exists
- `500 INTERNAL_ERROR` - Database error

## DELETE `/api/feature/:id/assign-user-story`

Unlink a user story from a ticket (feature).

**Parameters:**
- `id` (path) - Feature/Ticket UUID

**Permissions:** PMs and Admins only

**Request Body:**
```json
{
  "userStoryId": "uuid"
}
```

**Validation:**
- `userStoryId` (required) - Valid UUID

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

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Not PM or Admin, or ticket not accessible
- `404 NOT_FOUND` - Ticket not found
- `400 BAD_REQUEST` - Invalid request data
- `500 INTERNAL_ERROR` - Database error

## POST `/api/feature/:id/check-alignment`

Check how well a ticket aligns with user stories using AI analysis.

**Parameters:**
- `id` (path) - Feature/Ticket UUID

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

**Notes:**
- Returns alignment score (0-100) indicating how well the ticket aligns with user stories
- Provides suggestions for improving alignment
- Matches ticket to relevant user stories with relevance scores
- Includes AI-generated analysis
- If no user stories exist, returns score of 0 with suggestion to create user stories

**Error Responses:**
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - Ticket not accessible (different account)
- `404 NOT_FOUND` - Ticket not found
- `400 BAD_REQUEST` - Invalid ticket ID format
- `500 INTERNAL_ERROR` - Database error or AI service error

---

# Type Definitions

## ProjectResponse

```typescript
{
  _id: string
  id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: 'low' | 'medium' | 'high'
  }
  createdAt: string
  createdBy?: {
    name: string
    email: string
  } | null
  team_id?: string
}
```

## FeatureResponse

```typescript
{
  _id: string
  id: string
  projectId: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  priority: 'critical' | 'high' | 'medium' | 'low'
  effortEstimateWeeks: number
  dependsOn: string[]
  createdAt: string
  // Jira-style fields
  assignedTo?: string | null
  reporter?: string | null
  storyPoints?: number | null
  labels?: string[]
  acceptanceCriteria?: string | null
  ticketType?: 'feature' | 'bug' | 'epic' | 'story'
  // Timeline fields
  startDate?: string | null
  endDate?: string | null
  duration?: number | null
  isOnCriticalPath?: boolean
  slackDays?: number
}
```

## FeedbackResponse

```typescript
{
  _id: string
  id: string
  projectId: string
  featureId: string
  userId: {
    name: string
    email: string
  } | null
  type: 'comment' | 'timeline_proposal'
  content: string
  proposedRoadmap?: any
  aiAnalysis?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
```

## UserProfileResponse

```typescript
{
  _id: string
  id: string
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  account_id: string
  team_id?: string
  specialization?: 'Backend' | 'Frontend' | 'QA' | 'DevOps' | null
  vacationDates?: Array<{ start: string; end: string }>
  currentTicketCount?: number
  currentStoryPointCount?: number
  createdAt: string
}
```

## TeamMemberResponse

Same as `UserProfileResponse` but includes:
- `isOnVacation: boolean` - Whether user is currently on vacation

## PendingChangeResponse (Phase 12)

```typescript
{
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
```

## UserStoryResponse (Phase 11.5)

```typescript
{
  _id: string
  id: string
  projectId: string | null  // Optional - user stories are global
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
```

## TicketAlignmentResponse (Phase 11.5)

```typescript
{
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

---

# Rate Limiting

Currently, there are no rate limits enforced. However, AI endpoints (roadmap generation, assignment suggestions) are subject to Google Gemini API rate limits.

# Real-time Events

The application uses Supabase Realtime for live updates. When data changes in the database, connected clients automatically receive updates via WebSocket subscriptions. No additional API calls are needed for real-time updates.

**Subscribed Tables:**
- `projects` - Project list updates
- `features` - Feature status/assignment changes
- `feedback` - New feedback and status changes

**Note:** While `pending_changes`, `user_stories`, and `ticket_user_story` are enabled for real-time in the schema, they are not currently subscribed to in the frontend. Real-time subscriptions can be added for these tables if needed in the future.

