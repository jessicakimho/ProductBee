/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // ⚠️ WARNING: This ignores TypeScript errors during build
    // Use only if you need to deploy urgently and will fix types later
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.metmuseum.org',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig

