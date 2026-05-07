import { getSupabaseAdmin } from '~~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ name: string }>(event)
  const supabase = getSupabaseAdmin()

  if (!body.name || body.name.trim().length < 2) {
    throw createError({ statusCode: 400, message: 'Name must be at least 2 characters' })
  }

  const searchTerm = body.name.trim()

  const { data: existingFriendIds, error: friendError } = await supabase
    .from('friends')
    .select('friend_id')
    .eq('player_id', id)

  if (friendError) {
    throw createError({ statusCode: 500, message: friendError.message })
  }

  const excludeIds = [id, ...(existingFriendIds?.map(f => f.friend_id) || [])]

  const { data: players, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, elo')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .or(`first_name.ilike.*${searchTerm}*,last_name.ilike.*${searchTerm}*`)
    .order('first_name')
    .order('last_name')
    .limit(20)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { players: players || [] }
})