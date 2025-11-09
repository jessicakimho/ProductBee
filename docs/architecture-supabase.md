# AI Roadmap Dashboard – Supabase Architecture Overview

**Project:** AI-Powered PM Roadmap Dashboard  
**Duration:** 24h Hackathon  
**Goal:** Enable structured AI-mediated PM–Engineer collaboration with actionable timelines.

---

## 1️⃣ Tech Stack

**Frontend:** Next.js 14+ (App Router), React 18+, TypeScript, Tailwind, Lucide React, React Hot Toast  
**Backend:** Next.js API Routes, Supabase + PostgreSQL, Auth0  
**AI Provider:** Google Gemini API (gemini-1.5-pro / 1.5-flash)  
**Deployment:** Vercel, Supabase free tier

---

## 2️⃣ Agent Ownership

| Agent | Files / Directories |
|-------|-------------------|
| **Backend** | `/app/api/**`, `/models/**`, `/lib/supabase.ts`, `/lib/gemini.ts`, `/lib/prompts/**`, `/lib/api/**`, `/lib/constants.ts`, `/types/**`, `/middleware.ts` |
| **Frontend** | `/app/**/page.tsx`, `/app/layout.tsx`, `/components/**`, `/hooks/**`, `/public/**`, `tailwind.config.ts`, `/app/globals.css` |
| **Shared (read-only for Frontend)** | `/types/**`, `/lib/constants.ts` |

**Authorization required to modify:** `package.json`, `.env.example`

---

## 3️⃣ Mandatory Project Structure (Supabase)

```

/app
/api
/auth/[...auth0]/route.ts
/projects/route.ts
/project/[id]/route.ts
/roadmap/generate/route.ts
/feedback
/create/route.ts
/approve/route.ts
/reject/route.ts
/feature/[id]/route.ts
/dashboard/page.tsx
/project/[id]/page.tsx
layout.tsx
page.tsx
globals.css

/components
/dashboard
DashboardClient.tsx
ProjectCard.tsx
/project
ProjectDetailClient.tsx
FeatureCard.tsx
FeatureModal.tsx
/feedback
FeedbackThread.tsx
/modals
CreateProjectModal.tsx
/ui                 (shadcn/ui components if used)

/models
base.ts
User.ts
Project.ts
Feature.ts
Feedback.ts

/lib
/prompts
roadmap.ts
feedback.ts
comparison.ts
/api
permissions.ts
validation.ts
errors.ts
supabase.ts
gemini.ts
constants.ts

/types
index.ts
api.ts
roadmap.ts
feedback.ts
database.ts

/hooks
useProject.ts
useFeedback.ts
useFeature.ts

/docs
/agents
master.md
backend.md
frontend.md
/coordination
api.md
architecture.md

/middleware.ts
.env.example
package.json
tsconfig.json
tailwind.config.ts
next.config.js

````

---

## 4️⃣ BaseModel Pattern (Supabase)

```typescript
// models/base.ts
export interface BaseModel {
  id: string
  created_at: string
  updated_at?: string
}
````

All models extend `BaseModel`:

```typescript
// models/User.ts
import { BaseModel } from './base'

export interface User extends BaseModel {
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  team_id?: string
}

// models/Project.ts
import { BaseModel } from './base'

export interface Project extends BaseModel {
  name: string
  description: string
  created_by: string
  team_id: string
  roadmap: {
    summary: string
    riskLevel: 'low' | 'medium' | 'high'
  }
}

// models/Feature.ts
import { BaseModel } from './base'

export interface Feature extends BaseModel {
  project_id: string
  title: string
  description: string
  status: 'not_started' | 'in_progress' | 'blocked' | 'complete'
  priority: 'critical' | 'high' | 'medium' | 'low'
  dependencies?: string[]
  estimated_effort_weeks?: number
}

// models/Feedback.ts
import { BaseModel } from './base'

export interface Feedback extends BaseModel {
  project_id: string
  feature_id: string
  type: 'comment' | 'timeline_proposal'
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'discussion'
  analysis?: {
    requires_timeline_change: boolean
    suggested_action: string
    affected_features: string[]
    reasoning: string
  }
}
```

---

## 5️⃣ Constants Pattern

```typescript
// lib/constants.ts
export const ROLES = { ADMIN: 'admin', PM: 'pm', ENGINEER: 'engineer', VIEWER: 'viewer' } as const
export const FEATURE_STATUS = { NOT_STARTED: 'not_started', IN_PROGRESS: 'in_progress', BLOCKED: 'blocked', COMPLETE: 'complete' } as const
export const PRIORITY_LEVELS = { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium', LOW: 'low' } as const
export const FEEDBACK_STATUS = { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', DISCUSSION: 'discussion' } as const
export const FEEDBACK_TYPE = { COMMENT: 'comment', TIMELINE_PROPOSAL: 'timeline_proposal' } as const

export type Role = typeof ROLES[keyof typeof ROLES]
export type FeatureStatus = typeof FEATURE_STATUS[keyof typeof FEATURE_STATUS]
export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS]
export type FeedbackStatus = typeof FEEDBACK_STATUS[keyof typeof FEEDBACK_STATUS]
export type FeedbackType = typeof FEEDBACK_TYPE[keyof typeof FEEDBACK_TYPE]
```

---

## 6️⃣ API Route & Error Handling

```typescript
export async function POST(request: Request) {
  try {
    const data = await someOperation()
    return Response.json({ success: true, data })
  } catch (error) {
    console.error('[API Route]:', error)
    return Response.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
```

---

## 7️⃣ Prompts Organization

```
/lib/prompts/roadmap.ts
/lib/prompts/feedback.ts
/lib/prompts/comparison.ts
```

Refactor `gemini.ts` to use these modular prompts.

---

## 8️⃣ TypeScript Organization

```
/types/index.ts
/types/api.ts
/types/roadmap.ts
/types/feedback.ts
/types/database.ts
```

---

## 9️⃣ Frontend Patterns

* Server components fetch directly from Supabase
* Client components handle hooks and interactivity
* Components organized by feature
* Custom hooks: `useProject.ts`, `useFeedback.ts`, `useFeature.ts`

---

## 10️⃣ Documentation

```
/docs
  /frontend
    summary.md
  /backend
    summary.md
  api.md
  architecture-supabase.md
  phases.md
```
* All API endpoints documented in `/docs/api.md`
* Agent-specific summaries in `/docs/frontend/summary.md` and `/docs/backend/summary.md`
* Development phases tracked in `/docs/phases.md`

---

## 11️⃣ Environment Variables (`.env.example`)

```bash
# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# AI
GEMINI_API_KEY=
```

---

## 12️⃣ Status

### Core Structure

* [x] Create `/lib/constants.ts`, `/lib/api/*`
* [x] Create `/models/` TypeScript interfaces
* [x] Reorganize `/lib/prompts/`
* [x] Refactor `gemini.ts` to use `/prompts/`

### Type Organization

* [x] Create `/types/index.ts`, `/types/api.ts`, `/types/feedback.ts`, `/types/database.ts`

### Component Organization

* [x] Move components into subfolders
* [x] Update imports

### Documentation

* [x] Create `/docs/` structure with summaries
* [x] Document all API endpoints in `/docs/api.md`
* [x] Create agent summaries in `/docs/frontend/summary.md` and `/docs/backend/summary.md`
* [x] Create development phases in `/docs/phases.md`
