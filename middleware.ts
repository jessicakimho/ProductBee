import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

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
    '/api/user-story/:path*',
  ],
}

