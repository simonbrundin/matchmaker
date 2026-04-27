import { getSupabaseAdmin } from '~/server/lib/supabase'
import type { Player } from '~/types/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, name, elo } = body

  if (!phone || !name) {
    throw createError({ statusCode: 400, message: 'phone and name required' })
  }

  const supabase = getSupabaseAdmin()

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      phone,
      name,
      elo: elo || 1200,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true, player }
})