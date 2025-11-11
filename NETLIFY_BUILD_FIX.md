# Netlify Build Fix - Why Builds Work Locally But Fail on Netlify

## 🔴 Most Common Cause: Missing Environment Variables

**99% of the time, this is the issue.** Your local `.env.local` file has all the variables, but Netlify doesn't.

### Quick Fix (5 minutes)

1. **Go to Netlify Dashboard:**
   - Your Site → **Site settings** → **Environment variables**

2. **Add ALL these variables:**

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=https://your-site-name.netlify.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

3. **Important:**
   - `NEXT_PUBLIC_*` variables MUST be set (they're embedded at build time)
   - `AUTH0_BASE_URL` should be your Netlify URL (update after first deploy)
   - Generate `AUTH0_SECRET` with: `openssl rand -hex 32`

4. **Redeploy:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

## 🔍 How to Diagnose

### Step 1: Check Netlify Build Logs

1. Go to Netlify Dashboard → **Deploys**
2. Click on the failed deploy
3. Expand **Build log**
4. Look for these error patterns:

**Pattern 1: Environment Variable Error**
```
Error: Missing Supabase environment variables
```
→ **Fix:** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Pattern 2: Gemini API Key Error**
```
Error: Please define the GEMINI_API_KEY environment variable
```
→ **Fix:** Add `GEMINI_API_KEY`

**Pattern 3: Module/Import Error**
```
Module not found: Can't resolve '@supabase/supabase-js'
```
→ **Fix:** Check that `package-lock.json` is committed

**Pattern 4: TypeScript Error**
```
Type error: ...
```
→ **Fix:** Should be fixed now, but check build logs

### Step 2: Compare Local vs Netlify

Run this locally to simulate Netlify:
```bash
# Clean install (like Netlify)
npm ci

# Build (should match Netlify)
npm run build
```

If this fails locally, fix the errors first.

## 🛠️ Code Changes Made

I've made your code more resilient:

1. **`lib/gemini.ts`**: Made GEMINI_API_KEY lazy-loaded (won't fail at build time)
2. **`lib/supabase.ts`**: Better error messages for missing env vars

**However:** `NEXT_PUBLIC_*` variables still MUST be set in Netlify because they're embedded at build time for client-side code.

## ✅ Environment Variable Checklist

Before deploying, verify in Netlify Dashboard:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `AUTH0_SECRET` - Random 32+ character string
- [ ] `AUTH0_BASE_URL` - Your Netlify URL (e.g., `https://your-site.netlify.app`)
- [ ] `AUTH0_ISSUER_BASE_URL` - Your Auth0 tenant URL
- [ ] `AUTH0_CLIENT_ID` - Your Auth0 app client ID
- [ ] `AUTH0_CLIENT_SECRET` - Your Auth0 app client secret
- [ ] `GEMINI_API_KEY` - Your Google Gemini API key

## 🚨 Other Common Issues

### Issue 2: Base Directory Configuration

**Error:** `Base directory does not exist: /opt/build/repo/ProductBee`

**Fix:**
- Netlify Dashboard → Build settings
- **Base directory:** Leave EMPTY (not "ProductBee")
- **Build command:** `npm run build`
- **Publish directory:** Leave EMPTY

### Issue 3: Node Version

**Error:** Build fails with Node version errors

**Fix:**
- Already configured in `netlify.toml`: `NODE_VERSION = "20"`
- If still issues, add to `package.json`:
```json
"engines": {
  "node": ">=20.0.0"
}
```

### Issue 4: Build Timeout

**Error:** Build times out after 15 minutes

**Fix:**
- Optimize build (already done)
- Or upgrade Netlify plan for longer timeout

## 📋 Step-by-Step Fix

1. **Check Build Logs:**
   - Netlify Dashboard → Deploys → Failed deploy → Build log
   - Copy the first error message

2. **If it's an environment variable error:**
   - Go to Site settings → Environment variables
   - Add the missing variable(s)
   - Redeploy

3. **If it's a different error:**
   - Share the error message
   - Check `NETLIFY_TROUBLESHOOTING.md` for specific solutions

4. **Verify:**
   - After adding variables, trigger a new deploy
   - Check build logs again
   - Should see "Build succeeded"

## 🎯 Most Likely Solution

**90% chance:** You just need to add environment variables in Netlify Dashboard.

1. Copy all variables from your `.env.local`
2. Paste them into Netlify → Environment variables
3. Update `AUTH0_BASE_URL` to your Netlify URL
4. Redeploy

That's it! 🎉

## 📞 Still Stuck?

1. **Share the build log error** (first error message)
2. **Verify environment variables are set** (check Netlify Dashboard)
3. **Compare with local build** (`npm ci && npm run build`)

The build logs will tell you exactly what's wrong!

