import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { 
    player_id, 
    day_of_week, 
    weekday,
    time, 
    week_parity, 
    interval_days, 
    start_date,
    phone,
    name,
    elo
  } = body

  const supabase = getSupabaseAdmin()

  let playerId = player_id

  if (!playerId && phone && name) {
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingPlayer) {
      playerId = existingPlayer.id
    } else {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          phone,
          name,
          elo: elo || 1200,
        })
        .select()
        .single()

      if (playerError) {
        throw createError({ statusCode: 400, message: playerError.message })
      }
      playerId = player.id
    }
  }

  if (!playerId) {
    throw createError({ statusCode: 400, message: 'player_id or (phone + name) required' })
  }

  const weekDay = weekday ?? (day_of_week !== undefined ? day_of_week + 1 : undefined)
  const dayOfWeek = day_of_week ?? (weekday ? weekday - 1 : null)

  if (!weekDay && !interval_days) {
    throw createError({ statusCode: 400, message: 'weekday or interval_days required' })
  }

  const { data: weeklyTime, error } = await supabase
    .from('weekly_times')
    .insert({
      player_id: playerId,
      day_of_week: dayOfWeek,
      weekday: weekDay,
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