import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceKey as string
  )

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*, booked_players(*, player:players(*))')
    .order('scheduled_date', { ascending: false })
    .limit(50)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { bookings }
})