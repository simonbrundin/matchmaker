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
      booked_players (
        id,
        player_id,
        status,
        response,
        player:players (
          id,
          first_name,
          last_name,
          phone
        )
      )
    `)
    .in('id', uniqueBookingIds)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  const { data: allMessages } = await supabase
    .from('messages')
    .select('*')
    .in('booking_id', uniqueBookingIds)

  const messagesByBookingAndPlayer: Record<string, Record<string, any[]>> = {}
  allMessages?.forEach(msg => {
    if (!messagesByBookingAndPlayer[msg.booking_id]) {
      messagesByBookingAndPlayer[msg.booking_id] = {}
    }
    if (!messagesByBookingAndPlayer[msg.booking_id][msg.player_id]) {
      messagesByBookingAndPlayer[msg.booking_id][msg.player_id] = []
    }
    messagesByBookingAndPlayer[msg.booking_id][msg.player_id].push(msg)
  })

  const enrichedBookings = bookings?.map(booking => {
    const playerMessages: Record<string, any> = {}
    let confirmedCount = 0

    booking.booked_players?.forEach((bp: any) => {
      if (bp.status === 'confirmed') confirmedCount++
      const messages = messagesByBookingAndPlayer[booking.id]?.[bp.player_id] || []
      if (messages.length > 0) {
        playerMessages[bp.player_id] = {
          player: bp.player,
          status: bp.status,
          response: bp.response,
          messages: messages.sort((a: any, b: any) =>
            new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
          )
        }
      }
    })

    const fillStatus = confirmedCount >= 4 ? 'green' : booking.status === 'pending' ? 'yellow' : 'red'

    return {
      ...booking,
      player_messages: playerMessages,
      message_count: Object.values(playerMessages).reduce((sum: number, pm: any) => sum + pm.messages.length, 0),
      confirmed_count: confirmedCount,
      fill_status: fillStatus
    }
  }).filter((b: any) => b.message_count > 0)

  return { messages: enrichedBookings }
})