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
    .select('id, first_name, last_name, phone, elo')
    .eq('phone', phone)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.code === 'PGRST204') {
      throw createError({ statusCode: 404, message: 'Player not found' })
    }
    throw createError({ statusCode: 400, message: error.message })
  }

  return { player }
})