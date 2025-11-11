# How to Verify Netlify Environment Variables

## Important: Netlify Builds Don't Use `.env.local`

When you deploy to Netlify:
- **`.env.local` is NOT used** - it's only for local development
- **Netlify uses its own environment variables** set in the Netlify Dashboard
- The build runs on Netlify's servers, so it reads from `process.env` which comes from Netlify's environment variables

## How to Check Your Netlify Environment Variables

### Option 1: Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com
2. Select your site: **productbee**
3. Go to **Site settings** → **Environment variables**
4. Look for `AUTH0_SECRET` and check:
   - **Value length** - should be 32+ characters
   - **Current value** - copy it and check the length

### Option 2: Check Build Logs

The build log shows:
```
⚠️  Auth0 Configuration Issues:
  - AUTH0_SECRET is too short (20 chars). It should be at least 32 characters.
```

This means the Netlify environment variable `AUTH0_SECRET` is currently **20 characters**.

### Option 3: Add Debug Logging (Temporary)

If you want to verify what Netlify is actually reading, you can temporarily add this to `lib/auth0-config.ts`:

```typescript
// Temporary debug - remove after checking
if (process.env.NETLIFY) {
  const secret = process.env.AUTH0_SECRET || ''
  console.log(`[DEBUG] AUTH0_SECRET length: ${secret.length}`)
  console.log(`[DEBUG] AUTH0_SECRET first 5 chars: ${secret.substring(0, 5)}...`)
}
```

Then check the build logs to see what Netlify is reading.

## Common Issues

### Issue 1: Value Not Updated
- You updated `.env.local` but not Netlify
- **Fix**: Update the Netlify environment variable

### Issue 2: Whitespace/Quotes
- The value might have extra spaces or quotes
- **Fix**: Make sure the value in Netlify has no quotes or extra spaces

### Issue 3: Different Values
- `.env.local` has one value, Netlify has a different (shorter) value
- **Fix**: Make sure both match, and both are 32+ characters

## The Fix

1. Generate a new 32+ character secret:
   ```bash
   openssl rand -hex 32
   ```

2. Update in Netlify Dashboard:
   - Site settings → Environment variables
   - Edit `AUTH0_SECRET`
   - Paste the new 32+ character value (no quotes, no spaces)
   - Save

3. Trigger a new deployment (or wait for auto-deploy)

4. Check the build logs - the warning should be gone

