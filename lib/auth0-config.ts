/**
 * Auth0 Configuration
 * 
 * This file exports Auth0 configuration for styling and customization.
 * For full Auth0 hosted page styling, you'll also need to configure
 * custom login page templates in the Auth0 Dashboard.
 */

export const auth0Config = {
  // Base URL for Auth0 callbacks
  baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  
  // Styling configuration for Auth0 SDK
  // Note: This affects the SDK behavior, but full hosted page styling
  // requires Auth0 Dashboard configuration
  theme: {
    primaryColor: '#a855f7', // Purple accent color matching pundit-ui
    logo: '/bee_logo.png',
  },
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

