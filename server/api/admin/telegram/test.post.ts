import { sendToAdmin } from '~/server/lib/telegram'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message } = body

  try {
    await sendToAdmin(message || 'Testmeddelande från Matchmaker')
    return { success: true }
  } catch (err: any) {
    throw createError({ statusCode: 500, message: err.message })
  }
})