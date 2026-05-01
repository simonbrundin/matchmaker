import { getSupabaseAdmin } from '~~/server/lib/supabase'
import { getSMSClient } from '~~/server/lib/sms-gateway'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { suggestionId, approved, customResponse } = body

  if (!suggestionId) {
    throw createError({ statusCode: 400, message: 'suggestionId required' })
  }

  const supabase = getSupabaseAdmin()
  const smsClient = getSMSClient()

  const { data: suggestion, error: fetchError } = await supabase
    .from('ai_response_suggestions')
    .select('*, player:players(*)')
    .eq('id', suggestionId)
    .single()

  if (fetchError || !suggestion) {
    throw createError({ statusCode: 404, message: 'Suggestion not found' })
  }

  await supabase
    .from('ai_response_suggestions')
    .update({ approved })
    .eq('id', suggestionId)

  const responseToSend = customResponse || suggestion.ai_suggested_response

  if (approved && responseToSend) {
    await smsClient.sendMessage(suggestion.player.phone, responseToSend)

    await supabase.from('messages').insert({
      player_id: suggestion.player_id,
      direction: 'outgoing',
      content: responseToSend,
    })
  }

  return { success: true, approved }
})