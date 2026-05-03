import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = getSupabaseAdmin()

  if (body.name !== undefined) {
    body.first_name = body.name
    delete body.name
  }

  const { data: existing } = await supabase
    .from('players')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Player not found' })
  }

  const { data: player, error } = await supabase
    .from('players')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true, player }
})