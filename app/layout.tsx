import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@auth0/nextjs-auth0/client'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'ProductBee - AI Roadmap Collaboration',
  description: 'AI-powered roadmap dashboard for product development',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          {children}
          <Toaster position="top-right" />
        </UserProvider>
      </body>
    </html>
  )
}

