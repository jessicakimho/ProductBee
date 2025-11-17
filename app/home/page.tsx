import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Public Landing Page
 * 
 * This page is shown to unauthenticated users.
 * Authenticated users are automatically redirected to /dashboard.
 */
export default async function HomePage() {
  // Check if user is already authenticated
  const session = await getSession()
  
  // If user is already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-card shadow-soft p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 relative">
              <Image
                src="/bee_logo.png"
                alt="ProductBee Logo"
                fill
                className="object-contain"
                sizes="96px"
                priority
              />
            </div>
          </div>
          
          {/* Welcome Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-[#0d0d0d] dark:text-white mb-4">
            Welcome to ProductBee
          </h1>
          
          <p className="text-xl text-[#404040] dark:text-gray-400 mb-2">
            AI-Powered Roadmap Collaboration
          </p>
          
          <p className="text-[#404040] dark:text-gray-400 mb-8 max-w-md mx-auto">
            Streamline your product development with intelligent roadmaps, 
            smart task assignment, and seamless team collaboration.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/api/auth/login"
              className="w-full sm:w-auto px-8 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-full font-medium transition-colors shadow-soft"
            >
              Get Started
            </Link>
            
            <Link
              href="/api/auth/login"
              className="w-full sm:w-auto px-8 py-3 bg-[#d9d9d9] dark:bg-gray-700 text-[#0d0d0d] dark:text-white rounded-full font-medium hover:bg-[#c9c9c9] dark:hover:bg-gray-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-card shadow-soft p-6 text-center">
            <h3 className="text-lg font-semibold text-[#0d0d0d] dark:text-white mb-2">
              AI-Powered
            </h3>
            <p className="text-sm text-[#404040] dark:text-gray-400">
              Intelligent roadmap generation and task assignment
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-card shadow-soft p-6 text-center">
            <h3 className="text-lg font-semibold text-[#0d0d0d] dark:text-white mb-2">
              Real-Time Collaboration
            </h3>
            <p className="text-sm text-[#404040] dark:text-gray-400">
              Live updates and seamless team coordination
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-card shadow-soft p-6 text-center">
            <h3 className="text-lg font-semibold text-[#0d0d0d] dark:text-white mb-2">
              Smart Planning
            </h3>
            <p className="text-sm text-[#404040] dark:text-gray-400">
              Gantt charts, dependencies, and timeline management
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

