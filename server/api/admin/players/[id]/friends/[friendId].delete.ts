import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const friendId = getRouterParam(event, 'friendId')
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('player_id', id)
    .eq('friend_id', friendId)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})