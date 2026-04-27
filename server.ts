import { createApp, eventHandler, readBody, toNodeListener } from 'h3'
import { createServer } from 'http'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://erxniluxdhxznbbjvqvz.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_f-Qo9CQnTfA1OzbzZ-si6g_FyT5odpv'
const supabase = createClient(supabaseUrl, supabaseKey)

const app = createApp()

app.use('/api/health', eventHandler(async () => {
  const { data } = await supabase.from('players').select('id').limit(1)
  return { status: 'ok', database: data ? 'connected' : 'error' }
}))

app.use('/api/admin/players', eventHandler(async (event) => {
  const { data: players } = await supabase.from('players').select('*')
  return { players }
}))

app.use('/api/admin/players', eventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, name, elo } = body
  const { data: player } = await supabase.from('players').insert({ phone, name, elo }).select().single()
  return { player }
}))

const server = createServer(toNodeListener(app))
server.listen(4000, () => {
  console.log('Server running on port 4000')
})