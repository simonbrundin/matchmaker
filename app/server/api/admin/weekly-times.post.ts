import { getSupabaseAdmin } from '~/server/lib/supabase'
import type { WeeklyTime } from '~/types/database'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { player_id, day_of_week, time } = body

  if (!player_id || day_of_week === undefined || !time) {
    throw createError({ statusCode: 400, message: 'player_id, day_of_week, and time required' })
  }

  const supabase = getSupabaseAdmin()

  const { data: weeklyTime, error } = await supabase
    .from('weekly_times')
    .insert({
      player_id,
      day_of_week,
      time,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true, weeklyTime }
})