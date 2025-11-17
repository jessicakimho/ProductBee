# Vercel Deployment Checklist

**Status:** Final pre-deployment verification  
**Last Updated:** 2024

## ✅ Pre-Deployment Verification

### 1. Local Build Verification
- [x] `npm run build` succeeds without errors
- [x] Build output shows "✓ Compiled successfully"
- [x] No critical TypeScript errors (warnings are OK with `ignoreBuildErrors: true`)
- [x] `.next` folder generated successfully

### 2. Environment Variables (Vercel Dashboard)
**Location:** Vercel Dashboard → Project Settings → Environment Variables

Verify all 8 variables are set for **Production**, **Preview**, and **Development**:

- [x] `AUTH0_SECRET` - Generated with `openssl rand -hex 32`
- [x] `AUTH0_BASE_URL` - **MUST match production domain** (e.g., `https://your-app.vercel.app`)
- [x] `AUTH0_ISSUER_BASE_URL` - Your Auth0 tenant URL
- [x] `AUTH0_CLIENT_ID` - Auth0 application client ID
- [x] `AUTH0_CLIENT_SECRET` - Auth0 application client secret
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [x] `GEMINI_API_KEY` - Google Gemini API key

**⚠️ Critical:** Ensure `AUTH0_BASE_URL` in Vercel matches your actual production domain after first deployment.

---

### 3. Auth0 Configuration
**Location:** Auth0 Dashboard → Applications → Your Application

- [x] **Allowed Callback URLs** includes:
  ```
  https://your-app.vercel.app/api/auth/callback
  http://localhost:3000/api/auth/callback
  ```

- [x] **Allowed Logout URLs** includes:
  ```
  https://your-app.vercel.app
  http://localhost:3000
  ```

- [x] **Allowed Web Origins** includes:
  ```
  https://your-app.vercel.app
  ```

- [x] **Auto-link accounts with same email address** is enabled (for account linking)

---

### 4. Supabase Setup

#### Database Schema
- [ ] **Database schema is deployed** - Run `/supabase/schema.sql` in Supabase SQL Editor
  - Location: Supabase Dashboard → SQL Editor → New Query
  - Copy contents of `supabase/schema.sql` and execute

#### Real-time Configuration
- [ ] **Realtime is enabled** for required tables:
  - Location: Supabase Dashboard → Database → Replication
  - Enable Realtime for: `projects`, `features`, `feedback`
  - Or run SQL:
    ```sql
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    ALTER PUBLICATION supabase_realtime ADD TABLE features;
    ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
    ```

#### Project Status
- [ ] **Supabase project is active** - Verify project is not paused
- [ ] **Database is accessible** - Test connection from local environment
- [ ] **RLS is disabled** - Authorization handled in API layer (verify in schema.sql)

---

### 5. Vercel Project Configuration

#### Project Settings
- [ ] **Node.js version** set to 18+ (Vercel Dashboard → Settings → Node.js Version)
- [ ] **Framework Preset** is "Next.js" (auto-detected)
- [ ] **Build Command** is `npm run build` (default)
- [ ] **Output Directory** is `.next` (default)
- [ ] **Root Directory** is correct (if not root)

#### Git Integration
- [ ] **Repository connected** to Vercel
- [ ] **Production branch** is set to `main` (or your default branch)
- [ ] **Auto-deploy** is enabled (optional, but recommended)

---

## 🚀 Deployment Steps

### Step 1: Initial Deployment
1. [ ] Push code to main branch (or create pull request for preview)
2. [ ] Monitor Vercel deployment logs
3. [ ] Wait for build to complete successfully
4. [ ] Note your production URL (e.g., `https://your-app.vercel.app`)

### Step 2: Update Auth0 URLs (After First Deployment)
1. [ ] Update `AUTH0_BASE_URL` in Vercel to match actual production URL
2. [ ] Update Auth0 callback/logout URLs with actual production URL
3. [ ] Redeploy if needed (Vercel will auto-redeploy on env var changes)

---

## ✅ Post-Deployment Verification

### Critical Functionality Tests

#### 1. Authentication Flow
- [ ] **Login works** - Navigate to `/api/auth/login`
- [ ] **Callback works** - Redirects to dashboard after login
- [ ] **Session persists** - Refresh page, still logged in
- [ ] **Logout works** - Click logout, redirects to home page
- [ ] **Error handling** - Test with invalid credentials (should show error page)

#### 2. API Routes
Test these endpoints (after authentication):
- [ ] `GET /api/projects` - Returns list of projects
- [ ] `GET /api/project/[id]` - Returns project details
- [ ] `GET /api/team/members` - Returns team members
- [ ] `POST /api/roadmap/generate` - AI roadmap generation works
- [ ] `POST /api/feature/create` - Can create features
- [ ] `GET /api/user-story` - Returns user stories

#### 3. Database Connectivity
- [ ] **Projects load** - Dashboard shows projects from database
- [ ] **Features load** - Project detail page shows features
- [ ] **Data persists** - Create a project, refresh, still there
- [ ] **Account isolation** - Only see projects for your account

#### 4. Real-time Subscriptions
- [ ] **Live updates work** - Open project in two tabs, update in one, see change in other
- [ ] **No console errors** - Check browser console for subscription errors

#### 5. AI Features
- [ ] **Roadmap generation** - Create project, generate roadmap
- [ ] **Assignment suggestions** - AI suggests assignees
- [ ] **Proposal analysis** - Engineer proposals are analyzed

#### 6. UI/UX
- [ ] **Pages load** - Dashboard, project detail, team page all load
- [ ] **Images load** - Project images from Met Museum API display
- [ ] **Styling works** - Tailwind classes apply correctly
- [ ] **Responsive** - Works on mobile/tablet (basic check)

---

## 🔍 Monitoring & Debugging

### Vercel Dashboard
- [ ] **Check deployment logs** - No build errors
- [ ] **Check function logs** - No runtime errors
- [ ] **Monitor performance** - Check function execution times

### Browser Console
- [ ] **No client-side errors** - Check browser console
- [ ] **Network requests succeed** - Check Network tab
- [ ] **No CORS errors** - All API calls work

### Supabase Dashboard
- [ ] **Check database logs** - No connection errors
- [ ] **Verify data** - Check tables have data
- [ ] **Real-time status** - Realtime is active

---

## 🚨 Common Issues & Quick Fixes

### Issue: Authentication redirects fail
**Fix:** Verify `AUTH0_BASE_URL` matches production domain exactly

### Issue: API routes return 401/403
**Fix:** Check Auth0 session is being created, verify middleware is working

### Issue: Database queries fail
**Fix:** Verify Supabase URL and key are correct, check project is active

### Issue: Real-time not working
**Fix:** Enable Realtime in Supabase Dashboard, verify tables are in publication

### Issue: Build fails on Vercel
**Fix:** Check build logs, verify all dependencies in `package.json`, check Node version

### Issue: Environment variables not loading
**Fix:** Verify variables are set for correct environment (Production/Preview), redeploy after adding variables

---

## 📝 Final Checklist Summary

**Before Deployment:**
- [x] Environment variables set in Vercel
- [x] Auth0 URLs configured
- [x] Local build succeeds
- [ ] Supabase schema deployed
- [ ] Real-time enabled

**After Deployment:**
- [ ] Authentication works
- [ ] API routes accessible
- [ ] Database connectivity verified
- [ ] Real-time subscriptions work
- [ ] AI features functional
- [ ] No critical errors in logs

---

## 🎯 Success Criteria

Your deployment is successful when:
1. ✅ Users can log in and access the dashboard
2. ✅ Projects and features load from database
3. ✅ AI roadmap generation works
4. ✅ Real-time updates work
5. ✅ No critical errors in Vercel logs
6. ✅ Application is usable end-to-end

---

**Deployment Date:** _______________  
**Production URL:** _______________  
**Deployed By:** _______________  
**Notes:** _______________

