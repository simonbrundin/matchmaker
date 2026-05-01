import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { player_id, weekday, time, week_parity, interval_days, start_date } = body

  if (!player_id) {
    throw createError({ statusCode: 400, message: 'player_id required' })
  }

  if (!weekday && !interval_days) {
    throw createError({ statusCode: 400, message: 'weekday or interval_days required' })
  }

  const supabase = getSupabaseAdmin()
  const dayOfWeek = weekday ? weekday - 1 : null

  const { data: weeklyTime, error } = await supabase
    .from('weekly_times')
    .insert({
      player_id,
      day_of_week: dayOfWeek,
      weekday,
      time,
      week_parity: week_parity || 'all',
      interval_days,
      start_date,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true, weeklyTime }
})