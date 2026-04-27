import { getSupabaseAdmin } from '~/server/lib/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabaseAdmin()

  try {
    const { data: players, error } = await supabase
      .from('players')
      .select('id', { count: 'exact' })
      .limit(1)

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: error ? 'error' : 'connected',
    }
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: String(error),
    }
  }
})