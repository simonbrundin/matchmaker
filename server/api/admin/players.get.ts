import { getSupabaseAdmin } from '~~/server/lib/supabase'

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

  const { data: players, error } = await queryBuilder.order('last_name').order('first_name')

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { players }
})