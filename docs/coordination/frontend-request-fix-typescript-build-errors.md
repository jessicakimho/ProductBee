# Frontend Request: Fix TypeScript Build Errors

**Feature/Issue:** TypeScript compilation errors preventing clean build  
**Context:** Build succeeds but has 38 TypeScript errors that should be fixed for type safety and code quality  
**Requested Action:** Fix TypeScript errors in frontend-owned files  
**Blocking:** No - Build succeeds, but errors should be fixed for production readiness  
**Timeline:** Before final deployment

## Frontend TypeScript Errors to Fix

### 1. useSearchParams() Suspense Boundary (CRITICAL - Blocks Prerender)

**File:** `/app/api/auth/error/page.tsx`

**Error:**
```
useSearchParams() should be wrapped in a suspense boundary at page "/api/auth/error"
```

**Issue:** Next.js requires `useSearchParams()` to be wrapped in Suspense for static generation.

**Suggestion:**
Wrap the component using `useSearchParams()` in a Suspense boundary:
```tsx
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  // ... rest of component
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthErrorContent />
    </Suspense>
  )
}
```

**Location:** `/app/api/auth/error/page.tsx` - Wrap main component

---

### 2. getSession() Type Errors in Server Components

**Files:**
- `/app/dashboard/page.tsx` (line 54)
- `/app/home/page.tsx` (line 18)
- `/app/onboarding/page.tsx` (line 15)
- `/app/page.tsx` (line 16)
- `/app/project/[id]/page.tsx` (line 156)
- `/app/team/page.tsx` (line 14)

**Error:**
```
Argument of type '[{ req: any; }]' is not assignable to parameter of type '[] | [IncomingMessage, ServerResponse] | ...'
```

**Issue:** `getSession()` in App Router server components doesn't accept `{ req }` object parameter. It should be called without arguments.

**Suggestion:**
Remove the `req` parameter and call `getSession()` directly:
```typescript
// ❌ WRONG (Pages Router pattern)
const session = await getSession({
  req: { headers: headersList, cookies: cookiesList } as any
})

// ✅ CORRECT (App Router pattern)
const session = await getSession()
```

The Auth0 SDK automatically handles request/response in App Router server components.

**Location:** All server component pages listed above

---

### 3. Missing `imageUrl` Property in Roadmap Type

**Files:**
- `/components/dashboard/DashboardClient.tsx` (lines 191, 839, 964)
- `/components/dashboard/ProjectCard.tsx` (line 31)

**Error:**
```
Property 'imageUrl' does not exist on type '{ summary: string; riskLevel: string; }'
```

**Issue:** Roadmap type definition doesn't include `imageUrl` property, but code tries to access it.

**Suggestion:**
- Option 1: Add `imageUrl?: string` to roadmap type definition in `/types/roadmap.ts` or `/types/api.ts`
- Option 2: Use optional chaining with type assertion: `(project.roadmap as any)?.imageUrl`
- Option 3: Check if property exists: `'imageUrl' in project.roadmap ? project.roadmap.imageUrl : null`

**Location:**
- `/components/dashboard/DashboardClient.tsx` - Lines 191, 839, 964
- `/components/dashboard/ProjectCard.tsx` - Line 31

**Note:** May need to coordinate with Backend Agent if roadmap type needs to be updated in API response.

---

### 4. Gantt Component Prop Type Mismatch

**File:** `/components/project/GanttView.tsx` (line 139)

**Error:**
```
Property 'onTaskDelete' does not exist on type 'IntrinsicAttributes & GanttProps'. Did you mean 'onDelete'?
```

**Issue:** `gantt-task-react` library uses `onDelete` prop, not `onTaskDelete`.

**Suggestion:**
Rename prop from `onTaskDelete` to `onDelete`:
```tsx
<Gantt
  // ... other props
  onDelete={() => {}} // Changed from onTaskDelete
/>
```

**Location:** `/components/project/GanttView.tsx` line 139

---

### 5. User Story Form onSubmit Type Mismatch

**File:** `/components/project/UserStoriesTab.tsx` (line 189)

**Error:**
```
Type '(data: CreateUserStoryRequest) => Promise<void>' is not assignable to type '(data: CreateUserStoryRequest | UpdateUserStoryRequest) => Promise<void>'
```

**Issue:** Form expects union type but handlers are separate functions with specific types.

**Suggestion:**
Create a wrapper function that handles both types:
```typescript
const handleSubmit = async (data: CreateUserStoryRequest | UpdateUserStoryRequest) => {
  if (editingUserStory) {
    await handleUpdateUserStory(data as UpdateUserStoryRequest)
  } else {
    await handleCreateUserStory(data as CreateUserStoryRequest)
  }
}

// Then use:
onSubmit={handleSubmit}
```

Or update `UserStoryForm` component to accept separate handlers:
```typescript
onCreate?: (data: CreateUserStoryRequest) => Promise<void>
onUpdate?: (data: UpdateUserStoryRequest) => Promise<void>
```

**Location:** `/components/project/UserStoriesTab.tsx` line 189

---

## Priority Order

1. **CRITICAL:** Fix `useSearchParams()` Suspense boundary (blocks prerender)
2. **HIGH:** Fix `getSession()` calls in server components (6 files, common pattern)
3. **MEDIUM:** Fix missing `imageUrl` property (4 locations, may need backend coordination)
4. **LOW:** Fix Gantt component prop name (simple rename)
5. **LOW:** Fix User Story form type (type handling)

## Testing

After fixes:
1. Run `npx tsc --noEmit` to verify no TypeScript errors
2. Run `npm run build` to ensure build still succeeds
3. Test affected pages:
   - `/api/auth/error` - Error page loads correctly
   - `/dashboard` - Dashboard loads with session
   - `/home` - Home page loads with session
   - `/onboarding` - Onboarding page loads
   - `/project/[id]` - Project detail page loads
   - `/team` - Team page loads
4. Test components:
   - Dashboard with project cards (imageUrl display)
   - Gantt view (task interactions)
   - User story form (create/update)

## Related Files

- `/app/api/auth/error/page.tsx` - Auth error page
- `/app/dashboard/page.tsx` - Dashboard server component
- `/app/home/page.tsx` - Home server component
- `/app/onboarding/page.tsx` - Onboarding server component
- `/app/page.tsx` - Root page
- `/app/project/[id]/page.tsx` - Project detail page
- `/app/team/page.tsx` - Team page
- `/components/dashboard/DashboardClient.tsx` - Dashboard component
- `/components/dashboard/ProjectCard.tsx` - Project card component
- `/components/project/GanttView.tsx` - Gantt chart component
- `/components/project/UserStoriesTab.tsx` - User stories component

## Coordination Notes

- **imageUrl property:** May need to coordinate with Backend Agent if roadmap API response type needs updating
- **getSession() pattern:** This is a common pattern across multiple pages - fix once and apply everywhere

---

**Requested By:** Deploy Agent  
**Date:** 2024  
**Related Issue:** TypeScript build errors (38 errors total, 17 in frontend files)  
**Status:** ⏳ Pending Frontend Agent Fix

