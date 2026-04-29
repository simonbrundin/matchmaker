import { getSupabaseAdmin } from '~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'id required' })
  }

  const body = await readBody(event)
  const { player_id, time, weekday, week_parity, interval_days, start_date, is_active } = body

  if (!player_id) {
    throw createError({ statusCode: 400, message: 'player_id required' })
  }

  const supabase = getSupabaseAdmin()

  const updateData: any = {
    player_id,
    time,
    is_active: is_active ?? true
  }

  if (interval_days) {
    updateData.interval_days = interval_days
    updateData.weekday = null
    updateData.week_parity = null
    updateData.day_of_week = null
  } else if (weekday) {
    updateData.weekday = weekday
    updateData.week_parity = week_parity || 'all'
    updateData.day_of_week = weekday - 1
    updateData.interval_days = null
  }

  if (start_date !== undefined) {
    updateData.start_date = start_date || null
  }

  const { data: weeklyTime, error } = await supabase
    .from('weekly_times')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true, weeklyTime }
})
