import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://erxniluxdhxznbbjvqvz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_f-Qo9CQnTfA1OzbzZ-si6g_FyT5odpv'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Insert demo players
const players = [
  { id: 'd1b2c3d4-0000-0000-0000-000000000010', phone: '+46701234570', first_name: 'Erik', last_name: 'Eriksson', elo: 1250, is_active: true },
  { id: 'd1b2c3d4-0000-0000-0000-000000000011', phone: '+46701234571', first_name: 'Anna', last_name: 'Andersson', elo: 1300, is_active: true },
  { id: 'd1b2c3d4-0000-0000-0000-000000000012', phone: '+46701234572', first_name: 'Karl', last_name: 'Karlsson', elo: 1150, is_active: true },
  { id: 'd1b2c3d4-0000-0000-0000-000000000013', phone: '+46701234573', first_name: 'Maria', last_name: 'Martinsson', elo: 1200, is_active: true },
]

// Insert demo bookings (without host_confirmed/host_player_id - columns don't exist)
const bookings = [
  { id: 'e1b2c3d4-0000-0000-0000-000000000001', scheduled_date: '2026-05-10', scheduled_time: '18:00:00', status: 'confirmed' },
  { id: 'e1b2c3d4-0000-0000-0000-000000000002', scheduled_date: '2026-05-07', scheduled_time: '19:00:00', status: 'pending' },
]

// Insert booked players (without explicit IDs)
const bookedPlayers = [
  // Full booking (4/4)
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'a1b2c3d4-0000-0000-0000-000000000001', status: 'confirmed', response: 'ja', invite_number: 1 },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000010', status: 'confirmed', response: 'ja', invite_number: 1 },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000011', status: 'confirmed', response: 'ja', invite_number: 2 },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000012', status: 'confirmed', response: 'ja', invite_number: 1 },
  // Half full (2/4)
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'a1b2c3d4-0000-0000-0000-000000000001', status: 'confirmed', response: 'ja', invite_number: 1 },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'd1b2c3d4-0000-0000-0000-000000000010', status: 'confirmed', response: 'ja', invite_number: 1 },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'd1b2c3d4-0000-0000-0000-000000000011', status: 'invited', response: null, invite_number: 1 },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'd1b2c3d4-0000-0000-0000-000000000012', status: 'invited', response: null, invite_number: 1 },
]

// Insert messages (without explicit IDs - let them be auto-generated)
const now = new Date()
const messages = [
  // Full booking messages - all on round 1
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'a1b2c3d4-0000-0000-0000-000000000001', direction: 'outgoing', content: 'Hej Anna! Vill du spela padel lördag 18:00?', sent_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'a1b2c3d4-0000-0000-0000-000000000001', direction: 'incoming', content: 'Ja, absolut!', sent_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), response_received_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), response: 'ja' },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000010', direction: 'outgoing', content: 'Hej Erik! Vill du spela padel lördag 18:00?', sent_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000010', direction: 'incoming', content: 'Ja, det låter kul!', sent_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), response_received_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), response: 'ja' },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000011', direction: 'outgoing', content: 'Hej Anna! Vill du spela padel lördag 18:00?', sent_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000011', direction: 'incoming', content: 'Ja, jag kommer!', sent_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), response_received_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), response: 'ja' },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000012', direction: 'outgoing', content: 'Hej Karl! Vill du spela padel lördag 18:00?', sent_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000001', player_id: 'd1b2c3d4-0000-0000-0000-000000000012', direction: 'incoming', content: 'Ja, kör vi!', sent_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), response_received_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), response: 'ja' },
  // Half full booking messages - all on round 1
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'a1b2c3d4-0000-0000-0000-000000000001', direction: 'outgoing', content: 'Hej Anna! Vill du spela onsdag 19:00?', sent_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'a1b2c3d4-0000-0000-0000-000000000001', direction: 'incoming', content: 'Ja, jag kan!', sent_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), response_received_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), response: 'ja' },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'd1b2c3d4-0000-0000-0000-000000000010', direction: 'outgoing', content: 'Hej Erik! Vill du spela onsdag 19:00?', sent_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'd1b2c3d4-0000-0000-0000-000000000010', direction: 'incoming', content: 'Ja, kör!', sent_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), response_received_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), response: 'ja' },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'd1b2c3d4-0000-0000-0000-000000000011', direction: 'outgoing', content: 'Hej Anna! Vill du spela onsdag 19:00?', sent_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { booking_id: 'e1b2c3d4-0000-0000-0000-000000000002', player_id: 'd1b2c3d4-0000-0000-0000-000000000012', direction: 'outgoing', content: 'Hej Karl! Vill du spela onsdag 19:00?', sent_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString() },
]

async function insertData() {
  // Clean up old demo data first
  console.log('Cleaning up old demo data...')
  await supabase.from('messages').delete().eq('booking_id', 'e1b2c3d4-0000-0000-0000-000000000001')
  await supabase.from('messages').delete().eq('booking_id', 'e1b2c3d4-0000-0000-0000-000000000002')
  await supabase.from('booked_players').delete().eq('booking_id', 'e1b2c3d4-0000-0000-0000-000000000001')
  await supabase.from('booked_players').delete().eq('booking_id', 'e1b2c3d4-0000-0000-0000-000000000002')
  await supabase.from('bookings').delete().eq('id', 'e1b2c3d4-0000-0000-0000-000000000001')
  await supabase.from('bookings').delete().eq('id', 'e1b2c3d4-0000-0000-0000-000000000002')

  console.log('Inserting players...')
  for (const player of players) {
    const { error } = await supabase.from('players').upsert(player, { onConflict: 'id' })
    if (error) console.log('Player error:', error.message)
  }
  console.log('Players done')

  console.log('Inserting bookings...')
  for (const booking of bookings) {
    const { error } = await supabase.from('bookings').upsert(booking, { onConflict: 'id' })
    if (error) console.log('Booking error:', error.message)
  }
  console.log('Bookings done')

  console.log('Inserting booked_players...')
  for (const bp of bookedPlayers) {
    const { error } = await supabase.from('booked_players').insert(bp)
    if (error) console.log('Booked player error:', error.message)
  }
  console.log('Booked players done')

  console.log('Inserting messages...')
  for (const msg of messages) {
    const { error } = await supabase.from('messages').insert(msg)
    if (error) console.log('Message error:', error.message)
  }
  console.log('Messages done')

  console.log('All done!')
}

insertData()