import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    let config: any
    try {
      config = useRuntimeConfig()
    } catch {
      throw new Error('Supabase: useRuntimeConfig only available in Nuxt context')
    }
    if (!config.supabaseServiceKey || !config.public.supabaseUrl) {
      throw new Error('Supabase configuration missing')
    }
    supabaseAdmin = createClient(
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
  return supabaseAdmin
}

export function getSupabaseClient(): SupabaseClient {
  const config = useRuntimeConfig()
  if (!config.public.supabaseKey || !config.public.supabaseUrl) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )
}