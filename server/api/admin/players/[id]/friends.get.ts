import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = getSupabaseAdmin()

  const { data: friends, error } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('player_id', id)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  if (!friends || friends.length === 0) {
    return { friends: [] }
  }

  const friendIds = friends.map(f => f.friend_id)

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id, first_name, last_name, elo')
    .in('id', friendIds)

  if (playersError) {
    throw createError({ statusCode: 500, message: playersError.message })
  }

  const formattedFriends = (players || []).map(p => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    elo: p.elo,
  }))

  return { friends: formattedFriends }
})