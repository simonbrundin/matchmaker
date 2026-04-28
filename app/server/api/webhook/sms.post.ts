import { getSupabaseAdmin } from '~/server/lib/supabase'
import { getSMSClient } from '~/server/lib/sms-gateway'
import { sendToAdmin } from '~/server/lib/telegram'
import { analyzeIncomingMessage } from '~/server/lib/ai'
import { getBookingService } from '~/server/lib/booking'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (body?.event === 'sms:received' && body?.payload) {
    const msg = body.payload
    const phoneNumber = msg.sender
    const text = msg.message

    if (!phoneNumber || !text) {
      throw createError({ statusCode: 400, message: 'Invalid payload: missing sender or message' })
    }

    const supabase = getSupabaseAdmin()
    const bookingService = getBookingService()

    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('phone', phoneNumber)
      .single()

    if (!player) {
      await sendToAdmin(`Okänd telefon: ${phoneNumber}: ${text}`)
      return { success: true }
    }

    const bookingRefMatch = text.match(/\[Ref:\s*([A-Z0-9]{6})\]/i)
    let targetBookingId: string | null = null

    if (bookingRefMatch) {
      const shortRef = bookingRefMatch[1]
      const booking = await bookingService.findBookingByShortRef(shortRef)
      if (booking) {
        targetBookingId = booking.id
      }
    }

    if (!targetBookingId) {
      const pendingBookings = await bookingService.getPlayerPendingBookings(player.id)
      if (pendingBookings.length === 1) {
        targetBookingId = pendingBookings[0].id
      } else if (pendingBookings.length > 1) {
        await sendToAdmin(`⚠️ ${player.name} har ${pendingBookings.length} aktiva inbjudningar. Kan inte koppla svar automatiskt.`)
        targetBookingId = null
      }
    }

    const { data: bookedPlayer } = targetBookingId
      ? await supabase
          .from('booked_players')
          .select('*')
          .eq('booking_id', targetBookingId)
          .eq('player_id', player.id)
          .eq('status', 'invited')
          .single()
      : null

    const { data: booking } = targetBookingId
      ? await supabase
          .from('bookings')
          .select('*, booked_players(*, player:players(*))')
          .eq('id', targetBookingId)
          .single()
      : null

    const isHost = booking && booking.host_player_id === player.id

    if (isHost && !booking.host_confirmed) {
      const lowerText = text.toLowerCase()
      let response: 'ja' | 'nej' | null = null

      if (lowerText.includes('ja') || lowerText.includes('kan') || lowerText.includes('spelar')) {
        response = 'ja'
      } else if (lowerText.includes('nej') || lowerText.includes('inte') || lowerText.includes('kan inte')) {
        response = 'nej'
      }

      if (response) {
        await supabase
          .from('bookings')
          .update({ host_confirmed: response === 'ja' })
          .eq('id', targetBookingId)

        if (response === 'ja') {
          await sendToAdmin(`✅ ${player.name} bekräftade som värd för ${booking.scheduled_date} ${booking.scheduled_time}!`)
          
          await supabase.from('messages').insert({
            booking_id: targetBookingId,
            player_id: player.id,
            direction: 'incoming',
            content: text,
          })

          return { success: true, type: 'host_confirmed' }
        } else {
          await sendToAdmin(`❌ ${player.name} kunde inte som värd för ${booking.scheduled_date}`)
          
          await supabase.from('messages').insert({
            booking_id: targetBookingId,
            player_id: player.id,
            direction: 'incoming',
            content: text,
          })

          return { success: true, type: 'host_declined' }
        }
      }
    }

    await supabase.from('messages').insert({
      booking_id: targetBookingId,
      player_id: player.id,
      direction: 'incoming',
      content: text,
    })

    const aiResult = await analyzeIncomingMessage(text, player.name)
    
    await supabase.from('ai_response_suggestions').insert({
      player_id: player.id,
      incoming_message: text,
      ai_suggested_response: aiResult.response,
      ai_confidence: aiResult.confidence,
    })

    const messageForAdmin = `
📱 Svar från ${player.name} (${phoneNumber}):
"${text}"

🤖 AI-förslag: "${aiResult.response}"
Konfidens: ${(aiResult.confidence * 100).toFixed(0)}%
${targetBookingId ? '' : '⚠️ Ingen bokning kopplad'}
${aiResult.shouldCreateUnavailability ? '⚠️ Vill skapa ledighet!' : ''}
    `.trim()

    await sendToAdmin(messageForAdmin)

    if (bookedPlayer && aiResult.response) {
      let response: 'ja' | 'nej' | 'kanske' | null = null
      const lowerText = text.toLowerCase()
      if (lowerText.includes('ja') || lowerText.includes('kan') || lowerText.includes('spelar')) {
        response = 'ja'
      } else if (lowerText.includes('nej') || lowerText.includes('inte') || lowerText.includes('kan inte')) {
        response = 'nej'
      } else if (lowerText.includes('kanske')) {
        response = 'kanske'
      }

      if (response) {
        await bookingService.updatePlayerResponseWithBooking(
          bookedPlayer.id,
          response,
          targetBookingId
        )

        const booking = targetBookingId
          ? await bookingService.getBookingWithPlayers(targetBookingId)
          : null

        if (booking) {
          const confirmed = booking.booked_players?.filter(
            (p) => p.status === 'confirmed'
          ).length || 0

          if (confirmed >= 4) {
            await sendToAdmin(`🎉 Bokning ${booking.scheduled_date} ${booking.scheduled_time} är komplett!`)
            await bookingService.notifyAllPlayers(booking)
          }
        }
      }
    }

    if (aiResult.shouldCreateUnavailability && aiResult.unavailability) {
      const { startDate, endDate, reason } = aiResult.unavailability
      
      await supabase.from('unavailabilities').insert({
        player_id: player.id,
        start_date: startDate,
        end_date: endDate,
        reason: reason || 'AI-genererad',
        ai_parsed: true,
      })

      await sendToAdmin(`✅ Lade till ledighet för ${player.name}: ${startDate} - ${endDate}`)
    }

    return { success: true }
  }

  if (body?.messages && Array.isArray(body.messages)) {
    const supabase = getSupabaseAdmin()

    for (const msg of body.messages) {
      const phoneNumber = msg.phoneNumber
      const text = msg.text

      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('phone', phoneNumber)
        .single()

      if (!player) {
        await sendToAdmin(`Okänd telefon: ${phoneNumber}: ${text}`)
        continue
      }

      await supabase.from('messages').insert({
        player_id: player.id,
        direction: 'incoming',
        content: text,
      })

      try {
        const aiResult = await analyzeIncomingMessage(text, player.name)
        
        await supabase.from('ai_response_suggestions').insert({
          player_id: player.id,
          incoming_message: text,
          ai_suggested_response: aiResult.response,
          ai_confidence: aiResult.confidence,
        })

        const messageForAdmin = `
📱 Svar från ${player.name} (${phoneNumber}):
"${text}"

🤖 AI-förslag: "${aiResult.response}"
Konfidens: ${(aiResult.confidence * 100).toFixed(0)}%
${aiResult.shouldCreateUnavailability ? '⚠️ Vill skapa ledighet!' : ''}
      `.trim()

        await sendToAdmin(messageForAdmin)

        if (aiResult.shouldCreateUnavailability && aiResult.unavailability) {
          const { startDate, endDate, reason } = aiResult.unavailability
          
          await supabase.from('unavailabilities').insert({
            player_id: player.id,
            start_date: startDate,
            end_date: endDate,
            reason: reason || 'AI-genererad',
            ai_parsed: true,
          })

          await sendToAdmin(`✅ Lade till ledighet för ${player.name}: ${startDate} - ${endDate}`)
        }

      } catch (error) {
        console.error('AI analysis failed:', error)
        await sendToAdmin(`❌ AI-analys misslyckades för ${player.name}: ${text}`)
      }
    }

    return { success: true }
  }

  throw createError({ statusCode: 400, message: 'Invalid payload' })
})