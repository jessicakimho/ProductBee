import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0'
import { getAuth0BaseURL } from '@/lib/auth0-config'

/**
 * Auth0 Route Handler
 * 
 * Handles all Auth0 authentication routes:
 * - /api/auth/login
 * - /api/auth/callback
 * - /api/auth/logout
 * - /api/auth/me
 * 
 * Configuration:
 * - Uses normalized AUTH0_BASE_URL (auto-converts HTTP to HTTPS for Netlify)
 * - Cookies are automatically configured for secure HTTPS in production
 * - The Auth0 SDK reads AUTH0_BASE_URL from environment variables
 *   Our normalization in auth0-config.ts ensures it's correct, but you must
 *   also set it correctly in Netlify environment variables.
 * 
 * IMPORTANT: For production on Netlify, ensure AUTH0_BASE_URL is set to:
 * https://productbee.netlify.app (with https, no trailing slash)
 */
export const GET = handleAuth({
  login: handleLogin({
    // Redirect to intermediate callback page first to prevent redirect loops
    // The callback page will add a buffer before redirecting to dashboard
    returnTo: getAuth0BaseURL() + '/auth-callback',
  }),
  logout: handleLogout({
    // Use normalized base URL for returnTo
    returnTo: getAuth0BaseURL(),
  }),
})

