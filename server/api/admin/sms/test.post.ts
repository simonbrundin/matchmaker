import { getSMSClient } from '~~/server/lib/sms-gateway'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.phoneNumber || !body?.message) {
    throw createError({ statusCode: 400, message: 'phoneNumber and message are required' })
  }

  const client = getSMSClient()
  const result = await client.sendMessage(body.phoneNumber, body.message)

  return { success: true, messageId: result.id }
})