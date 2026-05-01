import cron from 'node-cron'
import { getBookingService } from '../lib/booking'
import { getSMSClient } from '../lib/sms-gateway'
import { generateInviteMessage } from '../lib/ai'
import { getSupabaseAdmin } from '../lib/supabase'
import { sendToAdmin } from '../lib/telegram'
import { HOST_DAYS_AHEAD, HOST_CONTACT_TIMES, PLAYER_DAYS_AHEAD, PLAYER_CONTACT_TIMES } from '../lib/config'

let bookingService: any = null
let smsClient: any = null
let supabase: any = null

function getServices() {
  if (!bookingService) bookingService = getBookingService()
  if (!smsClient) smsClient = getSMSClient()
  if (!supabase) supabase = getSupabaseAdmin()
  return { bookingService, smsClient, supabase }
}

function getSwedishDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

function getRound(): number {
  const hour = new Date().getHours()
  if (hour < 10) return 3
  if (hour < 13) return 4
  if (hour < 18) return 5
  return 6
}

export function startCronJobs() {
  console.log('📅 Starting cron jobs...')

  cron.schedule('0 8 * * *', async () => {
    console.log('📅 Running 08:00...')
    await sendHostConfirmations()
    await sendPlayerInvites()
  })

  cron.schedule('30 12 * * *', async () => {
    const day = new Date().getDay()
    if (day >= 1 && day <= 4) {
      console.log('📨 Running 12:30...')
      await sendPlayerInvites()
    }
  })

  cron.schedule('0 17 * * *', async () => {
    const day = new Date().getDay()
    if (day >= 1 && day <= 4) {
      console.log('📨 Running 17:00...')
      await sendPlayerInvites()
    }
  })

  cron.schedule('0 13 * * *', async () => {
    console.log('📨 Running 13:00 host reminders...')
    await sendHostReminders()
  })

  console.log('✅ Cron: 08:00 (hosts+players), 12:30 & 17:00 (mon-thu), 13:00 (host reminders)')
}

async function sendHostConfirmations() {
  const { bookingService, smsClient, supabase } = getServices()
  const target = new Date()
  target.setDate(target.getDate() + HOST_DAYS_AHEAD)
  const dateStr = target.toISOString().split('T')[0]
  const dayNum = target.getDay()

  await sendToAdmin(`📅 Värdinbjudningar för ${dateStr}...`)

  const { data: wts } = await supabase
    .from('weekly_times')
    .select('*, player:players(*)')
    .eq('day_of_week', dayNum)
    .eq('is_active', true)

  if (!wts?.length) return

  for (const wt of wts) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('scheduled_date', dateStr)
      .eq('scheduled_time', wt.time)
      .single()

    if (booking?.host_confirmed) continue

    const newBooking = !booking
      ? await bookingService.createBooking(wt.player_id, dateStr, wt.time)
      : booking

    const player = wt.player
    if (!player?.phone) continue

    const msg = `Hej ${player.name}! Padel ${getSwedishDate(dateStr)} kl ${wt.time} - kan du spela denna vecka? Svara ja/nej.`

    try {
      await smsClient.sendMessage(player.phone, msg)
      await supabase.from('messages').insert({
        booking_id: newBooking.id,
        player_id: wt.player_id,
        direction: 'outgoing',
        content: msg,
        invite_round: 1,
      })
      await sendToAdmin(`📨 Värdinbjudan till ${player.name}`)
    } catch (e) {
      console.error('Värd failed:', e)
    }
  }
}

async function sendHostReminders() {
  const { bookingService, smsClient, supabase } = getServices()
  for (let days = 5; days >= 1; days--) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const dateStr = target.toISOString().split('T')[0]
    const dayNum = target.getDay()

    const { data: wts } = await supabase
      .from('weekly_times')
      .select('*, player:players(*)')
      .eq('day_of_week', dayNum)
      .eq('is_active', true)

    if (!wts?.length) continue

    for (const wt of wts) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('scheduled_date', dateStr)
        .eq('scheduled_time', wt.time)
        .single()

      if (!booking || booking.host_confirmed) continue

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('sent_at')
        .eq('booking_id', booking.id)
        .eq('player_id', wt.player_id)
        .eq('direction', 'outgoing')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      if (lastMsg) {
        const hours = (Date.now() - new Date(lastMsg.sent_at).getTime()) / (1000 * 60 * 60)
        if (hours < 5) continue
      }

      const player = wt.player
      if (!player?.phone) continue

      const msg = `Hej! Påminnelse - kan du spela padel ${getSwedishDate(dateStr)} kl ${wt.time}? Svara ja/nej.`

      try {
        await smsClient.sendMessage(player.phone, msg)
        await supabase.from('messages').insert({
          booking_id: booking.id,
          player_id: wt.player_id,
          direction: 'outgoing',
          content: msg,
          invite_round: 2,
        })
        await sendToAdmin(`📨 Påminnelse till ${player.name}`)
      } catch (e) {
        console.error('Reminder failed:', e)
      }
    }
  }
}

async function sendPlayerInvites() {
  const { bookingService, smsClient, supabase } = getServices()
  const round = getRound()

  await sendToAdmin(`📨 Spelarinbjudningar (runda ${round})...`)

  for (let days = PLAYER_DAYS_AHEAD; days >= 1; days--) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const dateStr = target.toISOString().split('T')[0]
    const dayNum = target.getDay()

    const { data: wts } = await supabase
      .from('weekly_times')
      .select('*, player:players(*)')
      .eq('day_of_week', dayNum)
      .eq('is_active', true)

    if (!wts?.length) continue

    for (const wt of wts) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*, booked_players(*, player:players(*))')
        .eq('scheduled_date', dateStr)
        .eq('scheduled_time', wt.time)
        .single()

      if (!booking || !booking.host_confirmed) continue
      if (booking.status === 'confirmed') continue

      const confirmed = booking.booked_players?.filter(p => p.status === 'confirmed').length || 0

      if (confirmed >= 4) {
        await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', booking.id)
        await bookingService.notifyAllPlayers(booking)
        await sendToAdmin(`🎉 ${dateStr} ${wt.time} fullbemannad!`)
        continue
      }

      await sendInvitesForBooking(booking, dateStr, wt.time, confirmed, round)
    }
  }
}

async function sendInvitesForBooking(booking: any, dateStr: string, time: string, confirmed: number, round: number) {
  const { bookingService, smsClient, supabase } = getServices()
  const { data: bp } = await supabase
    .from('booked_players')
    .select('player_id, status')
    .eq('booking_id', booking.id)

  const contacted = new Set(bp?.map(p => p.player_id) || [])
  const slots = 4 - confirmed
  if (slots <= 0) return

  const candidates = await bookingService.getEligibleCandidates(booking.id, 1200, dateStr, time)
  const newCands = candidates.filter(c => !contacted.has(c.player.id))
  const top = newCands.slice(0, slots * 3)

  let sent = 0

  for (let i = 0; i < top.length && sent < slots; i++) {
    const cand = top[i]
    if (cand.probability < (slots - i) / 36) continue

    try {
      await bookingService.invitePlayer(booking.id, cand.player.id, sent + 1)
      const msg = await generateInviteMessage(cand.player.name, dateStr, time, undefined, booking.id)
      await smsClient.sendMessage(cand.player.phone, msg)
      await supabase.from('messages').insert({
        booking_id: booking.id,
        player_id: cand.player.id,
        direction: 'outgoing',
        content: msg,
        invite_round: round,
      })
      sent++
      await new Promise(r => setTimeout(r, 1000))
    } catch (e) {
      console.error('Invit error:', e)
    }
  }

  await sendToAdmin(`📨 ${dateStr} ${time}: ${sent} nya. ${confirmed}/4 klara.`)
}