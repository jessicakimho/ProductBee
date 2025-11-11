# Netlify Deployment Guide

This guide will walk you through deploying ProductBee to Netlify.

## Prerequisites

1. A Netlify account (sign up at https://netlify.com)
2. Your Auth0 credentials
3. Your Supabase credentials
4. Your Google Gemini API key

## Deployment Steps

### 1. Install Netlify CLI (Optional)

If you want to deploy from the command line:

```bash
npm install -g netlify-cli
```

### 2. Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### 3. Deploy via Netlify Dashboard

1. **Log in to Netlify**: Go to https://app.netlify.com and sign in
2. **Add New Site**: Click "Add new site" → "Import an existing project"
3. **Connect Repository**: Connect your Git provider and select your repository
4. **Configure Build Settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: Leave empty (Netlify Next.js plugin handles this automatically)
   - **Base directory**: **Leave EMPTY** (ProductBee is the repository root)
     - ⚠️ **IMPORTANT**: If you see "Base directory does not exist" error, make sure this field is empty, not set to "ProductBee"
   - **Node version**: Set to `20` (configured in netlify.toml)
5. **Netlify Next.js Plugin**: The plugin will be automatically detected and installed from `netlify.toml`
6. **Set Environment Variables**: See the Environment Variables section below
7. **Deploy**: Click "Deploy site"

### 4. Environment Variables

In the Netlify dashboard, go to **Site settings** → **Environment variables** and add:

#### Required Variables

```env
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-here (generate a random 32+ character string)
AUTH0_BASE_URL=https://your-site-name.netlify.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
```

#### Important Notes

- **AUTH0_SECRET**: Generate a secure random string (32+ characters). You can use:
  ```bash
  openssl rand -hex 32
  ```
- **AUTH0_BASE_URL**: Update this to your Netlify site URL after deployment
- **AUTH0 Callback URLs**: In your Auth0 dashboard, add:
  - Callback URL: `https://your-site-name.netlify.app/api/auth/callback`
  - Logout URL: `https://your-site-name.netlify.app`
  - Allowed Web Origins: `https://your-site-name.netlify.app`

### 5. Update Auth0 Configuration

After deploying, update your Auth0 application settings:

1. Go to Auth0 Dashboard → Applications → Your App
2. Add to **Allowed Callback URLs**:
   ```
   https://your-site-name.netlify.app/api/auth/callback
   ```
3. Add to **Allowed Logout URLs**:
   ```
   https://your-site-name.netlify.app
   ```
4. Add to **Allowed Web Origins**:
   ```
   https://your-site-name.netlify.app
   ```
5. Save changes

### 6. Deploy via Netlify CLI (Alternative)

If you prefer command line deployment:

```bash
# Navigate to ProductBee directory
cd ProductBee

# Login to Netlify
netlify login

# Initialize site (first time only)
netlify init

# Deploy
netlify deploy --prod
```

### 7. Verify Deployment

1. Visit your Netlify site URL
2. Test authentication flow
3. Verify API routes are working
4. Check Netlify function logs in the dashboard if issues occur

## Build Configuration

The `netlify.toml` file contains:
- Build command: `npm run build`
- Netlify Next.js plugin configuration
- Node.js version: 20
- Security headers
- Cache headers for static assets

## Troubleshooting

### Build Fails

1. Check build logs in Netlify dashboard
2. Verify all environment variables are set
3. Ensure Node.js version is 20 (configured in netlify.toml)
4. Check for missing dependencies

### Authentication Issues

1. Verify AUTH0_BASE_URL matches your Netlify site URL
2. Check Auth0 callback URLs are correctly configured
3. Ensure AUTH0_SECRET is set and matches between deployments
4. Check Auth0 application settings

### API Routes Not Working

1. Verify environment variables are set (especially Supabase and Gemini)
2. Check Netlify function logs in the dashboard
3. Ensure middleware is configured correctly
4. Check CORS settings if needed

### Edge Functions Issues

1. Verify Auth0 middleware is compatible with Netlify Edge Functions
2. Check Netlify Next.js plugin version
3. Review function logs in Netlify dashboard

## Continuous Deployment

Netlify automatically deploys when you push to your connected Git repository:
- **Production**: Deploys from your main/master branch
- **Preview**: Creates preview deployments for pull requests

## Custom Domain

To add a custom domain:
1. Go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Follow the DNS configuration instructions
4. Update `AUTH0_BASE_URL` environment variable to match your custom domain
5. Update Auth0 callback URLs to include your custom domain

## Environment-Specific Variables

You can set different environment variables for different branches:
1. Go to **Site settings** → **Environment variables**
2. Click **Add a variable**
3. Select the scope (Production, Deploy previews, or Branch deploys)
4. Set your variables

## Monitoring

- **Function logs**: Available in Netlify dashboard under **Functions**
- **Build logs**: Available for each deployment
- **Analytics**: Enable in Netlify dashboard (requires paid plan)

## Support

For issues specific to:
- **Netlify**: Check [Netlify documentation](https://docs.netlify.com)
- **Next.js on Netlify**: Check [Netlify Next.js plugin docs](https://github.com/netlify/netlify-plugin-nextjs)
- **Auth0**: Check [Auth0 Next.js docs](https://auth0.com/docs/quickstart/webapp/nextjs)
- **Supabase**: Check [Supabase documentation](https://supabase.com/docs)

