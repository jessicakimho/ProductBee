import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0'

/**
 * Auth0 route handler with error handling
 * 
 * Handles all Auth0 authentication routes:
 * - /api/auth/login - Initiate login
 * - /api/auth/logout - Initiate logout
 * - /api/auth/callback - Handle OAuth callback
 * - /api/auth/me - Get user session
 * 
 * Error Handling:
 * - The Auth0 SDK automatically handles errors and redirects to /api/auth/error
 * - Common errors include: access_denied, login_required, invalid_request
 * - Errors are logged server-side for debugging
 * - Users see user-friendly error messages via the error page
 */
export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      // Add any custom authorization parameters here if needed
    },
    returnTo: '/dashboard',
  }),
  logout: handleLogout({
    returnTo: '/',
  }),
  callback: handleCallback({
    // Callback error handling is automatic
    // On error, user is redirected to /api/auth/error with error details
    // The error page should handle displaying user-friendly messages
  }),
})

