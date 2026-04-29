import { getSupabaseAdmin } from '~/server/lib/supabase'

export default defineEventHandler(async () => {
  const supabase = getSupabaseAdmin()

  const { data: bookingIds } = await supabase
    .from('messages')
    .select('booking_id')
    .not('booking_id', 'is', null)

  const uniqueBookingIds = [...new Set(bookingIds?.map(m => m.booking_id).filter(Boolean) || [])]

  if (uniqueBookingIds.length === 0) {
    return { messages: [] }
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      host_player_id,
      booked_players (
        id,
        player_id,
        status,
        response,
        player:players (
          id,
          name,
          phone
        ),
        messages (
          id,
          direction,
          content,
          sent_at,
          response_received_at,
          response
        )
      )
    `)
    .in('id', uniqueBookingIds)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const enrichedBookings = bookings?.map(booking => {
    const playerMessages: Record<string, any> = {}
    
    booking.booked_players?.forEach((bp: any) => {
      if (bp.messages && bp.messages.length > 0) {
        playerMessages[bp.player_id] = {
          player: bp.player,
          status: bp.status,
          response: bp.response,
          messages: bp.messages.sort((a: any, b: any) => 
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          )
        }
      }
    })

    return {
      ...booking,
      player_messages: playerMessages,
      message_count: Object.values(playerMessages).reduce((sum: number, pm: any) => sum + pm.messages.length, 0)
    }
  }).filter((b: any) => b.message_count > 0)

  return { messages: enrichedBookings }
})