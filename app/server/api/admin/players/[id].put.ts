import { getSupabaseAdmin } from '~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = getSupabaseAdmin()

  console.log('body received:', body)

  if (body.phone !== undefined && body.phone !== null && body.phone !== '') {
    const { data: existing } = await supabase
      .from('players')
      .select('id, phone')
      .eq('phone', body.phone)
      .neq('id', id)
      .single()

    if (existing) {
      throw createError({ statusCode: 400, message: 'Telefonnumret används redan av en annan spelare' })
    }
  }

  const updateData: any = {}

  for (const [key, value] of Object.entries(body)) {
    if (value === '' || value === undefined || value === null) {
      updateData[key] = null
    } else {
      updateData[key] = value
    }
  }

  if ('elo' in updateData && (updateData.elo === '' || updateData.elo === null)) {
    updateData.elo = null
  }

  console.log('updateData:', updateData)

  const { error } = await supabase
    .from('players')
    .update(updateData)
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true }
})