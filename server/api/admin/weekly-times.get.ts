import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabaseAdmin()

  const { data: weeklyTimes, error } = await supabase
    .from('weekly_times')
    .select(`
      id,
      weekday,
      time,
      week_parity,
      interval_days,
      start_date,
      is_active,
      created_at,
      player:players (
        id,
        first_name,
        last_name,
        phone
      )
    `)
    .eq('is_active', true)
    .order('weekday', { ascending: true })
    .order('time', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const activePlayers = new Set(weeklyTimes?.map((wt: any) => wt.player?.id).filter(Boolean))
  
  const weekdaySchedules = weeklyTimes?.filter(wt => wt.weekday) || []
  const intervalSchedules = weeklyTimes?.filter(wt => wt.interval_days) || []

  const timesPerWeek = weekdaySchedules.reduce((acc, wt) => {
    const parity = wt.week_parity || 'all'
    if (parity === 'all') return acc + 1
    return acc + 0.5 
  }, 0)

  return {
    summary: {
      activePlayers: activePlayers.size,
      weekdaySchedules: weekdaySchedules.length,
      intervalSchedules: intervalSchedules.length,
      timesPerWeek: timesPerWeek
    },
    schedules: weeklyTimes
  }
})