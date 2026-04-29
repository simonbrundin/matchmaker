import { getSupabaseAdmin } from '~/server/lib/supabase'
import type { Player } from '~/types/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, name, elo } = body

  if (!name) {
    throw createError({ statusCode: 400, message: 'name is required' })
  }

  if (phone) {
    const { data: existing } = await getSupabaseAdmin()
      .from('players')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existing) {
      throw createError({ statusCode: 400, message: 'phone already in use' })
    }
  }

  const supabase = getSupabaseAdmin()

  const { data: player, error } = await supabase
    .from('players')
    .insert({
      phone: phone || null,
      name,
      elo: elo || null,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true, player }
})