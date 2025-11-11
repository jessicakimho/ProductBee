/**
 * Auth0 session types
 * Compatible with @auth0/nextjs-auth0 Session type
 * The actual Session type from the library has a user property of type Claims
 * which includes 'sub' as a required property
 */

import type { Session } from '@auth0/nextjs-auth0'

// Re-export the Session type from the library for convenience
export type Auth0Session = Session

// Type guard to check if session has required properties
export function isValidAuth0Session(session: Session | null | undefined): session is Session {
  return session !== null && session !== undefined && session.user !== undefined && 'sub' in session.user
}

