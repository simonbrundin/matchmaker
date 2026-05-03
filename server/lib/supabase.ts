import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdmin: SupabaseClient | null = null

function getTestSupabaseAdmin(): SupabaseClient {
  const testUrl = process.env.TEST_SUPABASE_URL || 'http://localhost:5433'
  const testKey = process.env.TEST_SUPABASE_SERVICE_KEY || 'postgres'

  return createClient(testUrl, testKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function getProdSupabaseAdmin(): SupabaseClient {
  let config: any
  try {
    config = useRuntimeConfig()
  } catch {
    throw new Error('Supabase: useRuntimeConfig only available in Nuxt context')
  }
  if (!config.supabaseServiceKey || !config.public.supabaseUrl) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export function getSupabaseAdmin(): SupabaseClient {
  if (process.env.TEST_SUPABASE_URL) {
    return getTestSupabaseAdmin()
  }

  if (!supabaseAdmin) {
    supabaseAdmin = getProdSupabaseAdmin()
  }
  return supabaseAdmin
}

export function getSupabaseClient(): SupabaseClient {
  if (process.env.TEST_SUPABASE_URL) {
    return getTestSupabaseAdmin()
  }

  const config = useRuntimeConfig()
  if (!config.public.supabaseKey || !config.public.supabaseUrl) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )
}