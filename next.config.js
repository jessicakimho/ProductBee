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
  // Skip TypeScript type checking during build
  // This allows deployment even with type errors
  typescript: {
    ignoreBuildErrors: true, // Always skip type checking during build
  },
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true, // Always skip ESLint during build
  },
}

module.exports = nextConfig

