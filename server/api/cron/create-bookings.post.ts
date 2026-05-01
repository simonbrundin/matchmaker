import { getBookingService } from '~~/server/lib/booking'
import { getSMSClient } from '~~/server/lib/sms-gateway'
import { generateInviteMessage } from '~~/server/lib/ai'
import { getSupabaseAdmin } from '~~/server/lib/supabase'
import { sendToAdmin } from '~~/server/lib/telegram'

export default defineEventHandler(async (event) => {
  const bookingService = getBookingService()
  const smsClient = getSMSClient()
  const supabase = getSupabaseAdmin()

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0]

  await sendToAdmin(`📅 Skapar bokningar för ${dateStr}...`)

  const weeklyTimes = await bookingService.getWeeklyTimesForDate(dateStr)

  let bookingsCreated = 0

  for (const wt of weeklyTimes) {
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('scheduled_date', dateStr)
      .eq('scheduled_time', wt.time)
      .limit(1)
      .single()

    if (existingBooking) {
      continue
    }

    const booking = await bookingService.createBooking(
      wt.player_id,
      dateStr,
      wt.time
    )

    bookingsCreated++

    const candidates = await bookingService.getEligibleCandidates(
      booking.id,
      1200,
      dateStr,
      wt.time
    )

    const neededPlayers = 3
    const topCandidates = candidates.slice(0, neededPlayers * 3)

    for (let i = 0; i < topCandidates.length && i < neededPlayers * 3; i++) {
      const candidate = topCandidates[i]
      
      const probabilityThreshold = (neededPlayers - i) / 36
      
      if (candidate.probability < probabilityThreshold) {
        continue
      }

      const inviteNumber = i + 1

      try {
        await bookingService.invitePlayer(
          booking.id,
          candidate.player.id,
          inviteNumber
        )

        const message = await generateInviteMessage(
          candidate.player.first_name,
          dateStr,
          wt.time
        )

        await smsClient.sendMessage(candidate.player.phone, message)

        await supabase.from('messages').insert({
          booking_id: booking.id,
          player_id: candidate.player.id,
          direction: 'outgoing',
          content: message,
        })

        if (inviteNumber === neededPlayers) {
          break
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Failed to invite ${candidate.player.first_name}:`, error)
      }
    }

    await sendToAdmin(
      `✅ Skapade bokning för ${dateStr} ${wt.time}. Skickade ${Math.min(topCandidates.length, neededPlayers * 3)} inbjudningar.`
    )
  }

  return {
    success: true,
    bookingsCreated,
    date: dateStr,
  }
})