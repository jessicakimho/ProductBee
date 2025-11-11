import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables (but don't throw at build time for static pages)
// The error will be thrown when the client is actually used
function validateSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
  }
}

// Client-side Supabase client
// Will throw error at runtime if env vars are missing
export const supabase = (() => {
  validateSupabaseEnv()
  return createClient(supabaseUrl!, supabaseAnonKey!)
})()

// Server-side client factory (for API routes and server components)
export const createServerClient = () => {
  validateSupabaseEnv()
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
    },
  })
}

