import { createClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
// NEXT_PUBLIC_* variables are embedded at build time, but we don't want to fail
// the build if they're missing - we'll fail at runtime instead
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error('Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL must be set')
  }
  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error('Invalid Supabase URL format: NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL')
  }
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }
  return key
}

// Client-side Supabase client (lazy initialization)
// Will throw error at runtime if env vars are missing
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!supabaseClient) {
      const url = getSupabaseUrl()
      const key = getSupabaseAnonKey()
      supabaseClient = createClient(url, key)
    }
    const value = supabaseClient[prop as keyof typeof supabaseClient]
    return typeof value === 'function' ? value.bind(supabaseClient) : value
  },
})

// Server-side client factory (for API routes and server components)
export const createServerClient = () => {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  })
}

