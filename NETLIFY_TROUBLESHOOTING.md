# Netlify Build Troubleshooting Guide

## Common Issues: Builds Work Locally But Fail on Netlify

### 1. Environment Variables Not Set ⚠️ **MOST COMMON**

**Problem:** Build fails because environment variables are missing or incorrect.

**Solution:**
1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Add ALL required variables:

```env
# Required for Build Time (NEXT_PUBLIC_* variables)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Required for Runtime (but may be checked at build time)
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=https://your-site-name.netlify.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
GEMINI_API_KEY=your-gemini-api-key
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are embedded at **build time** - they MUST be set
- `AUTH0_BASE_URL` must match your Netlify site URL
- Generate `AUTH0_SECRET` with: `openssl rand -hex 32`

### 2. Build-Time Environment Variable Access

**Problem:** Code tries to access environment variables at build time that aren't available.

**Check if you have:**
- Direct `process.env` access in components that are statically generated
- Environment variable checks in top-level module code
- API key validation that runs during build

**Solution:**
- Ensure all `NEXT_PUBLIC_*` variables are set in Netlify
- Move runtime-only checks to API routes or client components
- Use optional chaining: `process.env.GEMINI_API_KEY || ''`

### 3. Node Version Mismatch

**Problem:** Local Node version differs from Netlify.

**Solution:**
- Check your local Node version: `node --version`
- Ensure `netlify.toml` specifies: `NODE_VERSION = "20"`
- Or add to `package.json`:
```json
"engines": {
  "node": ">=20.0.0"
}
```

### 4. Missing Dependencies

**Problem:** Dependencies not installed correctly.

**Solution:**
- Check Netlify build logs for `npm install` errors
- Ensure `package-lock.json` is committed
- Try adding to `netlify.toml`:
```toml
[build.environment]
  NPM_FLAGS = "--legacy-peer-deps"
```

### 5. Build Command Issues

**Problem:** Build command fails or times out.

**Solution:**
- Verify build command in Netlify: `npm run build`
- Check build timeout (default 15 minutes)
- Look for specific error messages in build logs

### 6. TypeScript Build Errors

**Problem:** TypeScript errors that don't show locally.

**Solution:**
- Run `npm run build` locally to catch errors
- Ensure `tsconfig.json` is correct
- Check for strict mode differences

### 7. Next.js Configuration Issues

**Problem:** Next.js config incompatible with Netlify.

**Solution:**
- Verify `next.config.js` doesn't have Vercel-specific settings
- Check for image domain configurations
- Ensure middleware is compatible

### 8. Base Directory Configuration

**Problem:** Netlify looking in wrong directory.

**Solution:**
- In Netlify Dashboard → Build settings
- **Base directory:** Leave EMPTY (ProductBee is repo root)
- **Build command:** `npm run build`
- **Publish directory:** Leave EMPTY (plugin handles it)

## Diagnostic Steps

### Step 1: Check Build Logs
1. Go to Netlify Dashboard → **Deploys**
2. Click on the failed deploy
3. Expand **Build log**
4. Look for:
   - Environment variable errors
   - Missing dependencies
   - TypeScript errors
   - Build command failures

### Step 2: Verify Environment Variables
```bash
# In Netlify Dashboard, check:
- All variables are set
- No typos in variable names
- Values are correct (especially AUTH0_BASE_URL)
```

### Step 3: Test Build Locally
```bash
# Simulate Netlify build
npm ci  # Clean install
npm run build  # Should match Netlify
```

### Step 4: Check for Build-Time Errors
Look for these in your code:
- `process.env.GEMINI_API_KEY` accessed at module level
- `process.env` checks in non-API routes
- Missing `NEXT_PUBLIC_*` variables

## Quick Fixes

### Fix 1: Add All Environment Variables
```bash
# In Netlify Dashboard → Environment variables
# Add all variables from ENV_TEMPLATE.md
```

### Fix 2: Update AUTH0_BASE_URL
```bash
# After first deploy, update:
AUTH0_BASE_URL=https://your-actual-netlify-url.netlify.app
```

### Fix 3: Clear Cache and Rebuild
```bash
# In Netlify Dashboard:
1. Site settings → Build & deploy
2. Clear cache
3. Trigger new deploy
```

### Fix 4: Check Build Logs for Specific Errors
Common error patterns:
- `Environment variable not found` → Add missing variable
- `Module not found` → Check dependencies
- `Type error` → Fix TypeScript issues
- `Build timeout` → Optimize build or increase timeout

## Environment Variable Checklist

Before deploying, ensure these are set in Netlify:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `AUTH0_SECRET` (generate with `openssl rand -hex 32`)
- [ ] `AUTH0_BASE_URL` (your Netlify URL)
- [ ] `AUTH0_ISSUER_BASE_URL`
- [ ] `AUTH0_CLIENT_ID`
- [ ] `AUTH0_CLIENT_SECRET`
- [ ] `GEMINI_API_KEY`

## Still Having Issues?

1. **Share Build Logs:**
   - Copy the full build log from Netlify
   - Look for the first error message
   - Check what step failed (install, build, deploy)

2. **Compare Local vs Netlify:**
   - Run `npm ci && npm run build` locally
   - Compare output with Netlify logs
   - Look for differences

3. **Check Netlify Status:**
   - Visit https://www.netlifystatus.com
   - Ensure Netlify services are operational

4. **Verify Repository:**
   - Ensure all files are committed
   - Check that `netlify.toml` is in the repo
   - Verify `package.json` is correct

## Common Error Messages and Solutions

### "Environment variable X is not defined"
→ Add the variable in Netlify Dashboard → Environment variables

### "Module not found: Can't resolve X"
→ Check if dependency is in `package.json` and `package-lock.json` is committed

### "Build script returned non-zero exit code"
→ Check the build log for the specific error above this message

### "Base directory does not exist"
→ Clear the Base directory field in Netlify build settings

### "Command failed with exit code 1"
→ Look for TypeScript errors or missing environment variables

---

**Need more help?** Check the build logs in Netlify Dashboard for the specific error message.

