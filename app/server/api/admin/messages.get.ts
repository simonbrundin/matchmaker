import { getSupabaseAdmin } from '~/server/lib/supabase'
import { PLAYER_DAYS_AHEAD, PLAYER_CONTACT_TIMES } from '~/server/lib/config'

function calculateMaxRounds(scheduledDate: string): number {
  return PLAYER_DAYS_AHEAD * PLAYER_CONTACT_TIMES.length
}

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
    .order('sent_at', { ascending: true })

  const enrichedBookings = bookings?.map(booking => {
    const playerMessages: Record<string, any> = {}
    const outgoingMessages: any[] = []

    const bookingMessages = allMessages?.filter((m: any) => m.booking_id === booking.id) || []

    bookingMessages.forEach((msg: any) => {
      if (msg.direction === 'outgoing') {
        outgoingMessages.push(msg)
      }

      if (!playerMessages[msg.player_id]) {
        const bp = booking.booked_players?.find((b: any) => b.player_id === msg.player_id)
        playerMessages[msg.player_id] = {
          player: bp?.player || null,
          status: bp?.status || 'unknown',
          response: bp?.response || null,
          messages: []
        }
      }
      playerMessages[msg.player_id].messages.push(msg)
    })

    booking.booked_players?.forEach((bp: any) => {
      if (!playerMessages[bp.player_id]) {
        playerMessages[bp.player_id] = {
          player: bp.player,
          status: bp.status,
          response: bp.response,
          messages: []
        }
      }
    })

    const confirmedCount = booking.booked_players?.filter((bp: any) => bp.status === 'confirmed').length || 0
    const invitedRounds = outgoingMessages.length
    const maxRounds = calculateMaxRounds(booking.scheduled_date)

    const fillStatus = confirmedCount >= 4 ? 'green' : confirmedCount >= 2 ? 'yellow' : 'red'

    return {
      ...booking,
      player_messages: playerMessages,
      message_count: Object.values(playerMessages).reduce((sum: number, pm: any) => sum + pm.messages.length, 0),
      confirmed_count: confirmedCount,
      fill_status: fillStatus,
      invited_rounds: invitedRounds,
      max_rounds: maxRounds
    }
  }).filter((b: any) => b.message_count > 0)

  return { messages: enrichedBookings }
})