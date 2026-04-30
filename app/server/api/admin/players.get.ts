import { getSupabaseAdmin } from '~/server/lib/supabase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const supabase = getSupabaseAdmin()

  let queryBuilder = supabase.from('players').select('*')

  if (query.active === 'true') {
    queryBuilder = queryBuilder.eq('is_active', true)
  }

  if (query.search) {
    queryBuilder = queryBuilder.or(`first_name.ilike.*${query.search}*,last_name.ilike.*${query.search}*,phone.ilike.*${query.search}*`)
  }

  const sortableColumns = ['first_name', 'last_name', 'phone', 'elo', 'is_active', 'total_matches_played']
  const sortColumn = sortableColumns.includes(query.sort as string) ? query.sort as string : 'last_name'
  const sortDirection = query.direction === 'asc'

  const { data: players, error } = await queryBuilder
    .order(sortColumn, { ascending: sortDirection })
    .order('first_name', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { players }
})