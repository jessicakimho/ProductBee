# Netlify Deployment - Quick Start

## Quick Deployment Checklist

### Before Deployment
- [ ] Push your code to GitHub/GitLab/Bitbucket
- [ ] Have Auth0 credentials ready
- [ ] Have Supabase credentials ready
- [ ] Have Gemini API key ready

### Deployment Steps

1. **Go to Netlify**: https://app.netlify.com
2. **Add New Site** → **Import an existing project**
3. **Connect your Git repository**
4. **Configure**:
   - Build command: `npm run build`
   - Base directory: `ProductBee` (if repo root is hackUTD-25)
   - Publish directory: (leave empty)
5. **Set Environment Variables** (see below)
6. **Deploy**

### Required Environment Variables

Set these in Netlify Dashboard → Site settings → Environment variables:

```env
AUTH0_SECRET=<generate with: openssl rand -hex 32>
AUTH0_BASE_URL=https://your-site-name.netlify.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
GEMINI_API_KEY=your-gemini-api-key
```

### After Deployment

1. **Update Auth0**:
   - Add callback URL: `https://your-site-name.netlify.app/api/auth/callback`
   - Add logout URL: `https://your-site-name.netlify.app`
   - Add web origin: `https://your-site-name.netlify.app`

2. **Update AUTH0_BASE_URL** environment variable to match your Netlify URL

3. **Test your deployment**:
   - Visit your site
   - Test authentication
   - Test API routes

### Command Line Deployment (Alternative)

```bash
cd ProductBee
netlify login
netlify init
netlify deploy --prod
```

For detailed instructions, see [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)

