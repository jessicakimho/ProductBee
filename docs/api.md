# API Documentation

This document describes all API endpoints for the AI Roadmap Dashboard.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

All endpoints require authentication via Auth0. The session is managed through cookies.

## Account Isolation

All API endpoints enforce account isolation. Users can only access data belonging to their `accountId`. The `accountId` is extracted from Auth0 metadata in the following order:
1. `session.user.app_metadata.account_id` (preferred)
2. `session.user.user_metadata.account_id` (fallback)
3. `session.user.org_id` (if using Auth0 Organizations)
4. Generated from user's email domain (default fallback)

**All queries are automatically filtered by `account_id`** to ensure data isolation between accounts. Users cannot access projects, features, or feedback from other accounts, even if they know the resource IDs.

## Permission Enforcement

The API enforces role-based permissions:
- **Viewer**: Can view projects and features (read-only)
- **Engineer**: Can view projects and features, create feedback
- **PM**: Can view, edit projects, assign tasks, approve/reject proposals
- **Admin**: Full access within their account

All permission checks also enforce account isolation - users can only perform actions on resources within their account.

## Response Format

All API responses follow this format:

```typescript
{
  success: boolean
  data?: T
  error?: string
  code?: string
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Projects

### Get All Projects

**GET** `/api/projects`

Returns a list of all projects the user has access to. **Automatically filtered by account_id** - users only see projects from their account.

**Permissions:** All authenticated users can view projects in their account.

**Response:**
```typescript
{
  success: true,
  data: {
    projects: ProjectResponse[]
  }
}
```

**Example:**
```bash
GET /api/projects
```

---

### Get Project by ID

**GET** `/api/project/:id`

Returns a project with its features and feedback. **Enforces account isolation** - users can only access projects from their account.

**Parameters:**
- `id` (path) - Project UUID

**Permissions:** All authenticated users can view projects in their account. Returns 403 if project belongs to a different account.

**Response:**
```typescript
{
  success: true,
  data: {
    project: ProjectResponse
    features: FeatureResponse[]
    feedbackByFeature: Record<string, FeedbackResponse[]>
  }
}
```

**Example:**
```bash
GET /api/project/123e4567-e89b-12d3-a456-426614174000
```

---

## Roadmap

### Generate Roadmap

**POST** `/api/roadmap/generate`

Generates a roadmap for a new project using AI. **Projects and features are automatically created with the user's account_id** for account isolation.

**Permissions:** All authenticated users can generate roadmaps. Projects are created in the user's account.

**Request Body:**
```typescript
{
  projectName: string
  projectDescription: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    project: ProjectResponse
    features: FeatureResponse[]
  }
}
```

**Example:**
```bash
POST /api/roadmap/generate
Content-Type: application/json

{
  "projectName": "My New Project",
  "projectDescription": "A description of the project"
}
```

---

## Features

### Update Feature

**PATCH** `/api/feature/:id`

Updates a feature's properties. **Enforces account isolation** - users can only update features from their account.

**Parameters:**
- `id` (path) - Feature UUID

**Permissions:** All authenticated users in the same account can update features. Returns 403 if feature belongs to a different account.

**Request Body:**
```typescript
{
  status?: string
  priority?: string
  title?: string
  description?: string
  effortEstimateWeeks?: number
  dependsOn?: string[]
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    feature: FeatureResponse
  }
}
```

**Example:**
```bash
PATCH /api/feature/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

{
  "status": "active",
  "priority": "P0"
}
```

---

## Feedback

### Create Feedback

**POST** `/api/feedback/create`

Creates a new feedback entry (comment or proposal) for a feature. **Enforces account isolation** - users can only create feedback for features in their account.

**Permissions:** All authenticated users can create feedback. Feedback is automatically associated with the user's account_id.

**Request Body:**
```typescript
{
  projectId: string
  featureId: string
  type: 'comment' | 'timeline_proposal'
  content: string
  proposedRoadmap?: any
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    feedback: FeedbackResponse
  }
}
```

**Example:**
```bash
POST /api/feedback/create
Content-Type: application/json

{
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "featureId": "223e4567-e89b-12d3-a456-426614174000",
  "type": "comment",
  "content": "This feature needs more work"
}
```

---

### Approve Feedback

**POST** `/api/feedback/approve`

Approves a feedback proposal. **Enforces account isolation and role-based permissions** - only PMs and admins can approve proposals, and only for feedback in their account.

**Permissions:** PM or Admin role required. Returns 403 if user is not PM/Admin or if feedback belongs to a different account.

**Request Body:**
```typescript
{
  feedbackId: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: string
    feedback: FeedbackResponse
  }
}
```

**Example:**
```bash
POST /api/feedback/approve
Content-Type: application/json

{
  "feedbackId": "323e4567-e89b-12d3-a456-426614174000"
}
```

---

### Reject Feedback

**POST** `/api/feedback/reject`

Rejects a feedback proposal. **Enforces account isolation and role-based permissions** - only PMs and admins can reject proposals, and only for feedback in their account.

**Permissions:** PM or Admin role required. Returns 403 if user is not PM/Admin or if feedback belongs to a different account.

**Request Body:**
```typescript
{
  feedbackId: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    message: string
    feedback: FeedbackResponse
  }
}
```

**Example:**
```bash
POST /api/feedback/reject
Content-Type: application/json

{
  "feedbackId": "323e4567-e89b-12d3-a456-426614174000"
}
```

---

## User Profile

### Get User Profile

**GET** `/api/user/profile`

Returns the current user's profile with workload metrics. **Enforces account isolation** - users can only view their own profile.

**Permissions:** All authenticated users can view their own profile.

**Response:**
```typescript
{
  success: true,
  data: {
    profile: UserProfileResponse
  }
}
```

**Example:**
```bash
GET /api/user/profile
```

---

### Update User Profile

**PATCH** `/api/user/profile`

Updates the current user's profile. Users can only update their own profile. **Enforces account isolation** - users cannot update other users' profiles.

**Permissions:** All authenticated users can update their own profile.

**Request Body:**
```typescript
{
  role?: 'admin' | 'pm' | 'engineer' | 'viewer'
  specialization?: string | null // 'Backend', 'Frontend', 'QA', 'DevOps', or null
  vacationDates?: Array<{ start: string, end: string }> | null // ISO date strings
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    profile: UserProfileResponse
  }
}
```

**Example:**
```bash
PATCH /api/user/profile
Content-Type: application/json

{
  "role": "engineer",
  "specialization": "Backend",
  "vacationDates": [
    {
      "start": "2024-12-25",
      "end": "2024-12-31"
    }
  ]
}
```

**Validation Rules:**
- `role` must be one of: `admin`, `pm`, `engineer`, `viewer`
- `specialization` can only be set for engineers (`Backend`, `Frontend`, `QA`, `DevOps`)
- If role is changed to non-engineer, specialization is automatically cleared
- `vacationDates` must be an array of objects with `start` and `end` ISO date strings
- Start date must be before or equal to end date

---

## Team Management

### Get Team Members

**GET** `/api/team/members`

Returns all team members in the current user's account with their roles, specializations, workload metrics, and vacation status. **Enforces account isolation** - users only see team members from their account.

**Permissions:** All authenticated users can view team members in their account.

**Response:**
```typescript
{
  success: true,
  data: {
    members: TeamMemberResponse[]
  }
}
```

**Example:**
```bash
GET /api/team/members
```

**Note:** Workload metrics (currentTicketCount, currentStoryPointCount) are computed on-the-fly. These metrics require the `assignedTo` field on features (Phase 6). Until Phase 6 is complete, these metrics will return 0.

---

## Type Definitions

### ProjectResponse

```typescript
interface ProjectResponse {
  _id: string
  id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: string
  }
  createdAt: string
  createdBy?: {
    _id: string
    name: string
    email: string
  } | null
  created_by?: string
  team_id?: string
}
```

### FeatureResponse

```typescript
interface FeatureResponse {
  _id: string
  id: string
  projectId: string
  title: string
  description: string
  status: string
  priority: string
  effortEstimateWeeks: number
  dependsOn: string[]
  createdAt: string
}
```

### FeedbackResponse

```typescript
interface FeedbackResponse {
  _id: string
  id: string
  projectId: string
  featureId: string
  userId: {
    _id: string
    name: string
    email: string
  } | null
  type: string
  content: string
  proposedRoadmap?: any
  aiAnalysis?: string
  status: string
  createdAt: string
}
```

### UserProfileResponse

```typescript
interface UserProfileResponse {
  _id: string
  id: string
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  account_id: string
  team_id?: string
  specialization?: string | null
  vacationDates?: Array<{ start: string, end: string }>
  currentTicketCount?: number
  currentStoryPointCount?: number
  createdAt: string
}
```

### TeamMemberResponse

```typescript
interface TeamMemberResponse {
  _id: string
  id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  specialization?: string | null
  vacationDates?: Array<{ start: string, end: string }>
  currentTicketCount: number
  currentStoryPointCount: number
  isOnVacation: boolean
  createdAt: string
}
```

---

## Permissions

### Roles

- `admin` - Full access to all projects
- `pm` - Can create projects and approve/reject proposals
- `engineer` - Can create feedback and proposals (can have specialization: Backend, Frontend, QA, DevOps)
- `viewer` - Read-only access

### Specializations

- `Backend` - Backend development specialization (engineers only)
- `Frontend` - Frontend development specialization (engineers only)
- `QA` - Quality Assurance specialization (engineers only)
- `DevOps` - DevOps specialization (engineers only)

### Access Control

- Users can only access projects they created or are part of the team
- Only PMs and admins can approve/reject proposals
- All authenticated users can create feedback

---

## Error Handling

All errors are returned in the standard response format:

```typescript
{
  success: false,
  error: string
  code?: string
}
```

Common error codes:
- `UNAUTHORIZED` - User is not authenticated
- `FORBIDDEN` - User does not have permission
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid request data
- `INTERNAL_ERROR` - Server error

