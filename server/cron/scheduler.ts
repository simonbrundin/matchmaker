import cron from 'node-cron'
import { getBookingService } from '../lib/booking'
import { getSMSClient } from '../lib/sms-gateway'
import { generateInviteMessage } from '../lib/ai'
import { postgresPool } from '../lib/postgres'
import { sendToAdmin } from '../lib/telegram'
import { HOST_DAYS_AHEAD, PLAYER_DAYS_AHEAD } from '../lib/config'

let bookingService: ReturnType<typeof getBookingService> | null = null
let smsClient: ReturnType<typeof getSMSClient> | null = null

function getServices() {
  if (!bookingService) bookingService = getBookingService()
  if (!smsClient) smsClient = getSMSClient()
  return { bookingService, smsClient }
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
  const { bookingService, smsClient } = getServices()
  const target = new Date()
  target.setDate(target.getDate() + HOST_DAYS_AHEAD)
  const dateStr = target.toISOString().split('T')[0]
  const dayNum = target.getDay()

  await sendToAdmin(`📅 Värdinbjudningar för ${dateStr}...`)

  const wtsResult = await postgresPool.query(
    `SELECT wt.*, p.phone, p.first_name, p.last_name
     FROM weekly_times wt
     JOIN players p ON p.id = wt.player_id
     WHERE wt.day_of_week = $1 AND wt.is_active = true AND wt.interval_days IS NULL`,
    [dayNum],
  )
  const wts = wtsResult.rows
  if (!wts.length) return

  for (const wt of wts) {
    const bookingResult = await postgresPool.query(
      `SELECT * FROM bookings WHERE scheduled_date = $1 AND scheduled_time = $2`,
      [dateStr, wt.time],
    )
    const existingBooking = bookingResult.rows[0]

    if (existingBooking?.host_confirmed) continue

    const newBooking = existingBooking
      ? existingBooking
      : await bookingService.createBooking(wt.player_id as string, dateStr, wt.time as string)

    if (!wt.phone) continue

    const firstName = wt.first_name || 'spelare'
    const msg = `Hej ${firstName}! Padel ${getSwedishDate(dateStr)} kl ${wt.time!} - kan du spela denna vecka? Svara ja/nej.`

    try {
      await smsClient.sendMessage(wt.phone, msg)
      await postgresPool.query(
        `INSERT INTO messages (booking_id, player_id, direction, content, invite_round)
         VALUES ($1, $2, 'outgoing', $3, 1)`,
        [newBooking.id, wt.player_id as string, msg],
      )
      await sendToAdmin(`📨 Värdinbjudan till ${firstName}`)
    } catch (e) {
      console.error('Värd failed:', e)
    }
  }
}

async function sendHostReminders() {
  const { smsClient } = getServices()
  for (let days = 5; days >= 1; days--) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const dateStr = target.toISOString().split('T')[0]
    const dayNum = target.getDay()

    const wtsResult = await postgresPool.query(
      `SELECT wt.*, p.phone, p.first_name, p.last_name
       FROM weekly_times wt
       JOIN players p ON p.id = wt.player_id
       WHERE wt.day_of_week = $1 AND wt.is_active = true AND wt.interval_days IS NULL`,
      [dayNum],
    )
    const wts = wtsResult.rows
    if (!wts.length) continue

    for (const wt of wts) {
      const bookingResult = await postgresPool.query(
        `SELECT * FROM bookings WHERE scheduled_date = $1 AND scheduled_time = $2`,
        [dateStr, wt.time],
      )
      const booking = bookingResult.rows[0]
      if (!booking || booking.host_confirmed) continue

      const lastMsgResult = await postgresPool.query(
        `SELECT sent_at FROM messages
         WHERE booking_id = $1 AND player_id = $2 AND direction = 'outgoing'
         ORDER BY sent_at DESC LIMIT 1`,
        [booking.id, wt.player_id as string],
      )

      if (lastMsgResult.rows[0]) {
        const hours = (Date.now() - new Date(lastMsgResult.rows[0].sent_at).getTime()) / (1000 * 60 * 60)
        if (hours < 5) continue
      }

      if (!wt.phone) continue

      const firstName = wt.first_name || 'spelare'
      const msg = `Hej! Påminnelse - kan du spela padel ${getSwedishDate(dateStr)} kl ${wt.time as string}? Svara ja/nej.`

      try {
        await smsClient.sendMessage(wt.phone, msg)
        await postgresPool.query(
          `INSERT INTO messages (booking_id, player_id, direction, content, invite_round)
           VALUES ($1, $2, 'outgoing', $3, 2)`,
          [booking.id, wt.player_id as string, msg],
        )
        await sendToAdmin(`📨 Påminnelse till ${firstName}`)
      } catch (e) {
        console.error('Reminder failed:', e)
      }
    }
  }
}

async function sendPlayerInvites() {
  const { bookingService, smsClient } = getServices()
  const round = getRound()

  await sendToAdmin(`📨 Spelarinbjudningar (runda ${round})...`)

  for (let days = PLAYER_DAYS_AHEAD; days >= 1; days--) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    const dateStr = target.toISOString().split('T')[0]
    const dayNum = target.getDay()

    const wtsResult = await postgresPool.query(
      `SELECT wt.*, p.phone, p.first_name, p.last_name
       FROM weekly_times wt
       JOIN players p ON p.id = wt.player_id
       WHERE wt.day_of_week = $1 AND wt.is_active = true AND wt.interval_days IS NULL`,
      [dayNum],
    )
    const wts = wtsResult.rows
    if (!wts.length) continue

    for (const wt of wts) {
      const bookingResult = await postgresPool.query(
        `SELECT b.*, array_agg(json_build_object('id', bp.id, 'player_id', bp.player_id, 'status', bp.status))
               FILTER (WHERE bp.id IS NOT NULL) as booked_players_arr
         FROM bookings b
         LEFT JOIN booked_players bp ON bp.booking_id = b.id
         WHERE b.scheduled_date = $1 AND b.scheduled_time = $2
         GROUP BY b.id`,
        [dateStr, wt.time as string],
      )
      const booking = bookingResult.rows[0]

      if (!booking || !booking.host_confirmed) continue
      if (booking.status === 'confirmed') continue

      const confirmed = (booking.booked_players_arr || [])
        .filter((p: any) => p.status === 'confirmed').length

      if (confirmed >= 4) {
        await postgresPool.query(
          `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
          [booking.id],
        )
        await sendToAdmin(`🎉 ${dateStr} ${wt.time} fullbemannad!`)
        continue
      }

      await sendInvitesForBooking(booking, dateStr, wt.time!, confirmed, round)
    }
  }
}

async function sendInvitesForBooking(booking: any, dateStr: string, time: string, confirmed: number, round: number) {
  const { bookingService, smsClient } = getServices()

  const bpResult = await postgresPool.query(
    `SELECT player_id, status FROM booked_players WHERE booking_id = $1`,
    [booking.id],
  )
  const contacted = new Set(bpResult.rows.map((p) => p.player_id))
  const slots = 4 - confirmed
  if (slots <= 0) return

  const candidates = await bookingService.getEligibleCandidates(booking.id, 1200, dateStr, time)
  const newCands = candidates.filter((c) => !contacted.has(c.player.id))
  const top = newCands.slice(0, slots * 3)

  let sent = 0

  for (let i = 0; i < top.length && sent < slots; i++) {
    const cand = top[i]
    if (!cand) continue
    if (cand.probability < (slots - i) / 36) continue

    try {
      await bookingService.invitePlayer(booking.id, cand.player.id, sent + 1)
      const firstName = cand.player.first_name || 'spelare'
      const msg = await generateInviteMessage(firstName, dateStr, time, undefined, booking.id)
      await smsClient.sendMessage(cand.player.phone, msg)
      await postgresPool.query(
        `INSERT INTO messages (booking_id, player_id, direction, content, invite_round)
         VALUES ($1, $2, 'outgoing', $3, $4)`,
        [booking.id, cand.player.id, msg, round],
      )
      sent++
      await new Promise((r) => setTimeout(r, 1000))
    } catch (e) {
      console.error('Invite failed:', e)
    }
  }
}
