import { getSupabaseAdmin } from '~/server/lib/supabase'
import { getSMSClient } from '~/server/lib/sms-gateway'
import { sendToAdmin } from '~/server/lib/telegram'
import { analyzeIncomingMessage } from '~/server/lib/ai'
import { playerFullName } from '~/utils'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (!body?.messages || !Array.isArray(body.messages)) {
    throw createError({ statusCode: 400, message: 'Invalid payload' })
  }

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
      const aiResult = await analyzeIncomingMessage(text, playerFullName(player))
      
      await supabase.from('ai_response_suggestions').insert({
        player_id: player.id,
        incoming_message: text,
        ai_suggested_response: aiResult.response,
        ai_confidence: aiResult.confidence,
      })

      const messageForAdmin = `
📱 Svar från ${playerFullName(player)} (${phoneNumber}):
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

        await sendToAdmin(`✅ Lade till ledighet för ${playerFullName(player)}: ${startDate} - ${endDate}`)
      }

    } catch (error) {
      console.error('AI analysis failed:', error)
      await sendToAdmin(`❌ AI-analys misslyckades för ${playerFullName(player)}: ${text}`)
    }
  }

  return { success: true }
})