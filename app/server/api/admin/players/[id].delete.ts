import { getSupabaseAdmin } from '~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 400, message: error.message })
  }

  return { success: true }
})