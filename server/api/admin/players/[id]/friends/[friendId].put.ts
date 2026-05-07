import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const friendId = getRouterParam(event, 'friendId')
  const supabase = getSupabaseAdmin()

  const { error } = await supabase
    .from('friends')
    .insert({ player_id: id, friend_id: friendId })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})