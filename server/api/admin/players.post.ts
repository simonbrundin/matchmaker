import { getSupabaseAdmin } from '~~/server/lib/supabase'
import type { Player } from '~/types/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, first_name, last_name, elo } = body

  if (!phone || !first_name) {
    throw createError({ statusCode: 400, message: 'phone and first_name required' })
  }

  const supabase = getSupabaseAdmin()

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      phone,
      first_name,
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