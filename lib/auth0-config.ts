/**
 * Auth0 Configuration
 * 
 * This file exports Auth0 configuration for styling and customization.
 * For full Auth0 hosted page styling, you'll also need to configure
 * custom login page templates in the Auth0 Dashboard.
 */

/**
 * Normalizes AUTH0_BASE_URL by:
 * - Removing trailing slashes
 * - Converting HTTP to HTTPS for Netlify domains (.netlify.app)
 * - Logging warnings for production HTTP URLs
 */
function normalizeBaseURL(url: string | undefined): string {
  if (!url) {
    return 'http://localhost:3000'
  }

  // Remove trailing slashes
  let normalized = url.trim().replace(/\/+$/, '')

  // Check if it's a Netlify domain and force HTTPS
  if (normalized.includes('.netlify.app')) {
    if (normalized.startsWith('http://')) {
      console.warn(
        '⚠️  WARNING: AUTH0_BASE_URL uses HTTP for Netlify domain. ' +
        'Netlify forces HTTPS redirects, which causes session cookie issues. ' +
        'Converting to HTTPS automatically. Please update your Netlify environment variable.'
      )
      normalized = normalized.replace('http://', 'https://')
    } else if (!normalized.startsWith('https://')) {
      // If no protocol, assume HTTPS for Netlify
      normalized = 'https://' + normalized
    }
  }

  // Warn about HTTP in production (non-localhost)
  if (normalized.startsWith('http://') && !normalized.includes('localhost')) {
    console.warn(
      '⚠️  WARNING: AUTH0_BASE_URL uses HTTP in production. ' +
      'This may cause session cookie issues. Consider using HTTPS.'
    )
  }

  return normalized
}

/**
 * Validates required Auth0 environment variables
 * Throws helpful errors if critical variables are missing
 */
function validateAuth0Env(): void {
  const required = [
    'AUTH0_SECRET',
    'AUTH0_BASE_URL',
    'AUTH0_ISSUER_BASE_URL',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
  ]

  const missing: string[] = []
  const issues: string[] = []

  for (const key of required) {
    const value = process.env[key]
    if (!value || value.trim() === '') {
      missing.push(key)
    } else {
      // Additional validation for AUTH0_SECRET
      if (key === 'AUTH0_SECRET') {
        const trimmedValue = value.trim()
        // Debug logging to see what's actually being read
        if (process.env.NETLIFY || process.env.NODE_ENV === 'production') {
          console.log(`[AUTH0_DEBUG] ${key} length: ${trimmedValue.length}`)
          console.log(`[AUTH0_DEBUG] ${key} raw length: ${value.length}`)
          console.log(`[AUTH0_DEBUG] ${key} first 10 chars: ${trimmedValue.substring(0, 10)}...`)
          console.log(`[AUTH0_DEBUG] ${key} last 10 chars: ...${trimmedValue.substring(trimmedValue.length - 10)}`)
          console.log(`[AUTH0_DEBUG] Has newline: ${value.includes('\n')}`)
          console.log(`[AUTH0_DEBUG] Has quotes: ${value.includes('"') || value.includes("'")}`)
          console.log(`[AUTH0_DEBUG] NETLIFY env: ${process.env.NETLIFY}`)
          console.log(`[AUTH0_DEBUG] NODE_ENV: ${process.env.NODE_ENV}`)
        }
        if (trimmedValue.length < 32) {
          issues.push(
            `AUTH0_SECRET is too short (${trimmedValue.length} chars, raw: ${value.length} chars). ` +
            'It should be at least 32 characters. Generate with: openssl rand -hex 32'
          )
        }
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Auth0 environment variables: ${missing.join(', ')}\n` +
      'Please set these in your Netlify environment variables or .env.local file.\n' +
      'See ENV_TEMPLATE.md for details.'
    )
  }

  if (issues.length > 0) {
    console.warn('⚠️  Auth0 Configuration Issues:')
    issues.forEach(issue => console.warn(`  - ${issue}`))
  }
}

// Validate environment variables (only in production or when explicitly checking)
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.NETLIFY) {
  try {
    validateAuth0Env()
  } catch (error) {
    // Log error but don't crash - let Auth0 SDK handle it with its own errors
    console.error('❌ Auth0 Environment Validation Failed:', error)
  }
}

// Get normalized base URL
const normalizedBaseURL = normalizeBaseURL(process.env.AUTH0_BASE_URL)

// Update process.env with normalized URL so Auth0 SDK uses it
// This ensures the SDK uses HTTPS for Netlify domains even if env var is set to HTTP
if (process.env.AUTH0_BASE_URL !== normalizedBaseURL) {
  process.env.AUTH0_BASE_URL = normalizedBaseURL
  if (normalizedBaseURL.includes('.netlify.app') && normalizedBaseURL.startsWith('https://')) {
    console.log('✅ Auto-corrected AUTH0_BASE_URL to HTTPS for Netlify domain')
  }
}

export const auth0Config = {
  // Base URL for Auth0 callbacks (normalized)
  baseURL: normalizedBaseURL,
  
  // Styling configuration for Auth0 SDK
  // Note: This affects the SDK behavior, but full hosted page styling
  // requires Auth0 Dashboard configuration
  theme: {
    primaryColor: '#a855f7', // Purple accent color matching pundit-ui
    logo: '/bee_logo.png',
  },
}

/**
 * Get the normalized AUTH0_BASE_URL for use in Auth0 SDK configuration
 * This ensures consistent URL format across the application
 */
export function getAuth0BaseURL(): string {
  return normalizedBaseURL
}

/**
 * Check if we're in a production environment that requires HTTPS
 */
export function isProductionHTTPS(): boolean {
  const baseURL = normalizedBaseURL.toLowerCase()
  return (
    baseURL.startsWith('https://') &&
    !baseURL.includes('localhost') &&
    !baseURL.includes('127.0.0.1')
  )
}

/**
 * Auth0 Dashboard Configuration Instructions:
 * 
 * 1. Login to your Auth0 Dashboard
 * 2. Navigate to Branding > Universal Login
 * 3. Enable "Customize Login Page"
 * 4. Use the "Classic" experience for full control
 * 5. Apply the following CSS in the Login Page template:
 * 
 * ```css
 * body {
 *   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
 *   background-color: #f5f5f5;
 *   color: #0d0d0d;
 * }
 * 
 * .auth0-lock {
 *   border-radius: 24px;
 * }
 * 
 * .auth0-lock-widget {
 *   border-radius: 24px;
 *   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
 * }
 * 
 * .auth0-lock-submit {
 *   background-color: #a855f7;
 *   border-radius: 24px;
 * }
 * 
 * .auth0-lock-submit:hover {
 *   background-color: #9333ea;
 * }
 * ```
 * 
 * 6. Set your logo in Branding > Universal Login > Logo
 * 7. Configure colors in Branding > Universal Login > Colors:
 *    - Primary: #a855f7
 *    - Background: #f5f5f5
 *    - Text: #0d0d0d
 */

