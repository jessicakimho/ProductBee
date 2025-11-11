# Environment Variables Template

Copy this to `.env.local` and fill in your values:

```env
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
```

## Getting Your Credentials

### Auth0
1. Sign up at https://auth0.com
2. Create a new application (Regular Web Application)
3. Set callback URL: `http://localhost:3000/api/auth/callback`
4. Set logout URL: `http://localhost:3000`
5. Copy the credentials to your `.env.local`

#### Auth0 Styling Configuration (Optional)
To match the app's pundit-ui styling in the Auth0 hosted login page:

1. Navigate to Branding > Universal Login in Auth0 Dashboard
2. Enable "Customize Login Page"
3. Use the "Classic" experience for full control
4. Apply custom CSS (see `lib/auth0-config.ts` for example CSS)
5. Set logo in Branding > Universal Login > Logo
6. Configure colors:
   - Primary: `#a855f7`
   - Background: `#f5f5f5`
   - Text: `#0d0d0d`

See `lib/auth0-config.ts` for detailed styling instructions.

### Supabase
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Project Settings > API
4. Copy your Project URL to `NEXT_PUBLIC_SUPABASE_URL`
5. Copy your `anon` `public` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
7. Enable Realtime in Database > Replication settings for tables: projects, features, feedback

### Gemini API
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy to `.env.local`

## Production Deployment (Netlify)

### ⚠️ CRITICAL: HTTP/HTTPS Configuration

**Netlify automatically redirects HTTP to HTTPS.** This means your `AUTH0_BASE_URL` **MUST** use `https://` for Netlify deployments, or you will experience infinite redirect loops.

### Setting Up Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** > **Environment variables**
3. Add the following variables:

```env
AUTH0_SECRET=<generate with: openssl rand -hex 32>
AUTH0_BASE_URL=https://your-site-name.netlify.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
```

### ⚠️ IMPORTANT: AUTH0_BASE_URL Rules

- **MUST use `https://`** (never `http://`) for Netlify domains
- **MUST NOT have a trailing slash** (e.g., `https://productbee.netlify.app` not `https://productbee.netlify.app/`)
- The code will automatically convert `http://` to `https://` for `.netlify.app` domains, but you should set it correctly in Netlify

**Example (Correct):**
```
AUTH0_BASE_URL=https://productbee.netlify.app
```

**Example (WRONG - will cause infinite loops):**
```
AUTH0_BASE_URL=http://productbee.netlify.app
AUTH0_BASE_URL=https://productbee.netlify.app/
```

### Updating Auth0 Dashboard for Production

After setting up Netlify environment variables, update your Auth0 Dashboard:

1. Go to **Applications** > Your Application > **Settings**
2. Update **Allowed Callback URLs**:
   ```
   https://your-site-name.netlify.app/api/auth/callback
   ```
   (You can include both localhost and production URLs, separated by commas)
3. Update **Allowed Logout URLs**:
   ```
   https://your-site-name.netlify.app
   ```
4. Update **Allowed Web Origins**:
   ```
   https://your-site-name.netlify.app
   ```
5. **Remove any HTTP URLs** from these fields for production

### Generating AUTH0_SECRET

The `AUTH0_SECRET` must be a long, random, cryptographically secure string (at least 32 characters).

**Generate on macOS/Linux:**
```bash
openssl rand -hex 32
```

**Generate on Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Or use an online generator: https://generate-secret.vercel.app/32

### Troubleshooting Infinite Redirect Loops

If you experience infinite redirect loops after deployment:

1. **Check AUTH0_BASE_URL in Netlify:**
   - Must be `https://your-site.netlify.app` (no trailing slash)
   - Must NOT be `http://`

2. **Check Auth0 Dashboard:**
   - All callback URLs must use `https://`
   - Remove any `http://` URLs for production

3. **Check Browser DevTools:**
   - Open **Network** tab
   - Look for the `/api/auth/callback` request
   - Check if it sets a cookie (look for `Set-Cookie` header)
   - Check if the cookie has the `Secure` flag (required for HTTPS)

4. **Clear Browser Cookies:**
   - Clear all cookies for your Netlify domain
   - Try logging in again

5. **Check Netlify Build Logs:**
   - Look for warnings about `AUTH0_BASE_URL` using HTTP
   - The code will auto-convert HTTP to HTTPS for Netlify domains, but you should fix it in Netlify

6. **Verify Environment Variables:**
   - All 5 Auth0 variables must be set in Netlify
   - `AUTH0_SECRET` must be at least 32 characters
   - `AUTH0_BASE_URL` must match your Netlify site URL exactly (with https://)

### Common Mistakes

❌ **Setting AUTH0_BASE_URL to HTTP:**
```
AUTH0_BASE_URL=http://productbee.netlify.app  # WRONG!
```
✅ **Correct:**
```
AUTH0_BASE_URL=https://productbee.netlify.app  # CORRECT
```

❌ **Trailing slash:**
```
AUTH0_BASE_URL=https://productbee.netlify.app/  # WRONG!
```
✅ **Correct:**
```
AUTH0_BASE_URL=https://productbee.netlify.app  # CORRECT
```

❌ **Mismatched Auth0 Dashboard URLs:**
- Callback URL: `http://productbee.netlify.app/api/auth/callback`  # WRONG!
✅ **Correct:**
- Callback URL: `https://productbee.netlify.app/api/auth/callback`  # CORRECT

