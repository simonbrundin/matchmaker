import { getSupabaseAdmin } from '~~/server/lib/supabase'
import type { Player } from '~/types/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, first_name, name, last_name, elo } = body

  if (!phone) {
    throw createError({ statusCode: 400, message: 'phone required' })
  }

  if (!first_name && !name) {
    throw createError({ statusCode: 400, message: 'first_name or name required' })
  }

  const supabase = getSupabaseAdmin()

  const { count } = await supabase
    .from('players')
    .select('id', { count: 'exact' })
    .eq('phone', phone)

  if (count && count > 0) {
    throw createError({ statusCode: 409, message: 'Player with this phone already exists' })
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      phone,
      first_name: first_name || name,
      last_name: last_name || null,
      elo: elo || 1200,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true, player }
})