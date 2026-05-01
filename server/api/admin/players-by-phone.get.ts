import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const phone = query.phone as string

  if (!phone) {
    throw createError({ statusCode: 400, message: 'phone required' })
  }

  const supabase = getSupabaseAdmin()

  const { data: player, error } = await supabase
    .from('players')
    .select('id, name, phone, elo')
    .eq('phone', phone)
    .single()

  if (error) {
    throw createError({ statusCode: 404, message: 'Player not found' })
  }

  return { player }
})