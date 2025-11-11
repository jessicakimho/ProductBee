import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

/**
 * Middleware for Auth0 authentication
 * 
 * Protects routes by requiring authentication.
 * The Auth0 SDK handles session management and redirects to login if not authenticated.
 * 
 * Redirect Loop Prevention:
 * - The Auth0 SDK automatically prevents redirect loops by checking if you're already
 *   on the login page before redirecting again
 * - If you experience infinite loops, the root cause is usually:
 *   1. AUTH0_BASE_URL mismatch (http vs https) - MUST be https:// for Netlify
 *   2. Auth0 Dashboard callback URLs don't match (must use HTTPS)
 *   3. Session cookies not being set due to protocol/domain mismatch
 * 
 * To fix infinite loops:
 * 1. Update AUTH0_BASE_URL in Netlify to: https://productbee.netlify.app (no trailing slash)
 * 2. Update Auth0 Dashboard callback URLs to use HTTPS
 * 3. Clear browser cookies and try again
 */
export default withMiddlewareAuthRequired()

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/:path*',
    '/api/projects/:path*',
    '/api/project/:path*',
    '/api/roadmap/:path*',
    '/api/feedback/:path*',
    '/api/feature/:path*',
  ],
}

