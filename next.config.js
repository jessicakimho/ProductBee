/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.metmuseum.org',
        pathname: '/**',
      },
    ],
  },
  // Skip TypeScript type checking during build (for deployment)
  // Set to true to ignore type errors and allow deployment to proceed
  typescript: {
    // ⚠️ WARNING: This will skip type checking during build
    // Only enable if type errors are not critical and code works at runtime
    ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true' || false,
  },
  // Skip ESLint during build (optional)
  eslint: {
    // Set to true to ignore ESLint errors during build
    ignoreDuringBuilds: process.env.SKIP_LINT === 'true' || false,
  },
}

module.exports = nextConfig

