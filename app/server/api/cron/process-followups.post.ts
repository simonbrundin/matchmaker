import { getBookingService } from '~/server/lib/booking'
import { getSMSClient } from '~/server/lib/sms-gateway'
import { getSupabaseAdmin } from '~/server/lib/supabase'
import { sendToAdmin } from '~/server/lib/telegram'

export default defineEventHandler(async (event) => {
  const bookingService = getBookingService()
  const smsClient = getSMSClient()
  const supabase = getSupabaseAdmin()

  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = Math.floor((now.getTime() / (1000 * 60 * 60 * 24)))

  const { data: pendingBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_date', now.toISOString().split('T')[0])
    .lte('scheduled_time', now.toTimeString().slice(0, 5))

  let messagesSent = 0

  for (const booking of pendingBookings || []) {
    const { data: invites } = await supabase
      .from('booked_players')
      .select('*, player:players(*)')
      .eq('booking_id', booking.id)
      .eq('status', 'invited')
      .eq('response', null)

    if (!invites || invites.length === 0) continue

    for (const invite of invites) {
      const invitedAt = new Date(invite.invited_at)
      const dayInvited = Math.floor(invitedAt.getTime() / (1000 * 60 * 60 * 24))
      const daysSinceInvite = currentDay - dayInvited

      if (daysSinceInvite > 4) continue

      const maxMessages = (daysSinceInvite + 1) * 3
      const currentDayMessages = currentHour >= 8 && currentHour < 12 ? 1 : currentHour >= 12 && currentHour < 17 ? 2 : currentHour >= 17 ? 3 : 0

      if (currentDayMessages >= 3) continue

      const { data: existingMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('player_id', invite.player_id)
        .eq('direction', 'outgoing')

      const messageCount = existingMessages?.length || 0

      if (messageCount >= maxMessages) continue

      const followupMessages = [
        'Hej! Påminnelse om padel imorgon. Kan du?',
        'Vad gäller med padeln imorgon?',
        'Sista chansen att svara - kan du spela imorgon?',
      ]

      const messageIndex = Math.min(daysSinceInvite, followupMessages.length - 1)
      const message = followupMessages[messageIndex]

      try {
        await smsClient.sendMessage(invite.player.phone, message)

        await supabase.from('messages').insert({
          booking_id: booking.id,
          player_id: invite.player_id,
          direction: 'outgoing',
          content: message,
        })

        messagesSent++
      } catch (error) {
        console.error(`Failed to send followup to ${invite.player.name}:`, error)
      }
    }
  }

  await sendToAdmin(`📨 Skickade ${messagesSent} uppföljningsmeddelanden`)

  return {
    success: true,
    messagesSent,
  }
})