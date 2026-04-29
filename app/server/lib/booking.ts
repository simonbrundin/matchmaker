import { getSupabaseAdmin } from './supabase'
import { getSMSClient } from './sms-gateway'
import type {
  Player,
  Booking,
  BookingBase,
  BookedPlayer,
  WeeklyTime,
  Unavailability,
  InviteCandidate,
} from '~/types/database'

const CONFIRMATION_MESSAGE = `🎉 Padel imorgon kl {time} är bekräftad! {count}/4 spelare klara. Välkommen!`

export class BookingService {
  private supabase: any = null

  private getSupabase() {
    if (!this.supabase) {
      this.supabase = getSupabaseAdmin()
    }
    return this.supabase
  }

  async notifyAllPlayers(booking: Booking): Promise<void> {
    const smsClient = getSMSClient()
    
    const { data: bookedPlayers } = await this.getSupabase()
      .from('booked_players')
      .select('*, player:players(*)')
      .eq('booking_id', booking.id)
      .eq('status', 'confirmed')

    if (!bookedPlayers || bookedPlayers.length < 4) return

    const message = CONFIRMATION_MESSAGE
      .replace('{time}', booking.scheduled_time)
      .replace('{count}', bookedPlayers.length.toString())

    for (const bp of bookedPlayers) {
      if (bp.player?.phone) {
        try {
          await smsClient.sendMessage(bp.player.phone, message)
        } catch (error) {
          console.error(`Failed to notify ${bp.player.name}:`, error)
        }
      }
    }
  }

  async getWeeklyTimesForDate(date: string): Promise<WeeklyTime[]> {
    const dayOfWeek = new Date(date).getDay()
    const { data, error } = await this.getSupabase()
      .from('weekly_times')
      .select('*')
      .eq('is_active', true)
      .eq('day_of_week', dayOfWeek)

    if (error) throw error
    return data || []
  }

  async getPlayerAvailability(
    playerId: string,
    date: string
  ): Promise<boolean> {
    const { data: unavailabilities } = await this.getSupabase()
      .from('unavailabilities')
      .select('*')
      .eq('player_id', playerId)
      .lte('start_date', date)
      .gte('end_date', date)

    return !unavailabilities || unavailabilities.length === 0
  }

  async getEligibleCandidates(
    bookingId: string,
    hostElo: number,
    date: string,
    time: string
  ): Promise<InviteCandidate[]> {
    const { data: players, error } = await this.getSupabase()
      .from('players')
      .select('*')
      .eq('is_active', true)
      .gte('elo', hostElo - 200)
      .lte('elo', hostElo + 200)

    if (error) throw error
    if (!players) return []

    const eligible: InviteCandidate[] = []

    for (const player of players) {
      const isAvailable = await this.getPlayerAvailability(player.id, date)
      if (!isAvailable) continue

      const { data: lastMessage } = await this.getSupabase()
        .from('messages')
        .select('sent_at')
        .eq('player_id', player.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      const { data: friends } = await this.getSupabase()
        .from('friends')
        .select('*')
        .eq('friend_id', player.id)
        .limit(1)

      const probability = await this.calculateAcceptProbability(
        player,
        friends && friends.length > 0
      )

      eligible.push({
        player,
        probability,
        is_friend: friends && friends.length > 0,
        last_contacted_at: lastMessage?.sent_at || null,
      })
    }

    return eligible.sort((a, b) => {
      if (a.is_friend !== b.is_friend) return b.is_friend ? 1 : -1
      if (!a.last_contacted_at) return -1
      if (!b.last_contacted_at) return 1
      return (
        new Date(a.last_contacted_at).getTime() -
        new Date(b.last_contacted_at).getTime()
      )
    })
  }

  private async calculateAcceptProbability(
    player: Player,
    isFriend: boolean
  ): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentMessages } = await this.getSupabase()
      .from('messages')
      .select('response')
      .eq('player_id', player.id)
      .gte('sent_at', thirtyDaysAgo.toISOString())
      .not('response', 'is', null)

    if (!recentMessages || recentMessages.length === 0) {
      const baseProbability = 0.3
      const friendBonus = isFriend ? 0.2 : 0
      return Math.min(baseProbability + friendBonus, 0.8)
    }

    const yesCount = recentMessages.filter((m) => m.response === 'ja').length
    const winRate = yesCount / recentMessages.length

    return 0.3 + winRate * 0.4 + (isFriend ? 0.2 : 0)
  }

  async createBooking(
    hostPlayerId: string,
    date: string,
    time: string
  ): Promise<Booking> {
    const { data: booking, error } = await this.getSupabase()
      .from('bookings')
      .insert({
        scheduled_date: date,
        scheduled_time: time,
        status: 'pending',
        host_confirmed: false,
        host_player_id: hostPlayerId,
      })
      .select()
      .single()

    if (error) throw error

    return booking

    const { error: hostError } = await this.getSupabase()
      .from('booked_players')
      .insert({
        booking_id: booking.id,
        player_id: hostPlayerId,
        status: 'confirmed',
        invite_number: 0,
      })

    if (hostError) throw hostError

    return booking
  }

  async invitePlayer(
    bookingId: string,
    playerId: string,
    inviteNumber: number
  ): Promise<BookedPlayer> {
    const { data, error } = await this.getSupabase()
      .from('booked_players')
      .insert({
        booking_id: bookingId,
        player_id: playerId,
        status: 'invited',
        invite_number: inviteNumber,
      })
      .select()
      .single()

    if (error) throw error

    await this.getSupabase()
      .from('players')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', playerId)

    return data
  }

  async updatePlayerResponse(
    bookedPlayerId: string,
    response: 'ja' | 'nej' | 'kanske'
  ): Promise<void> {
    const { data: bookedPlayer } = await this.getSupabase()
      .from('booked_players')
      .select('*')
      .eq('id', bookedPlayerId)
      .single()

    if (!bookedPlayer) throw new Error('Booked player not found')

    await this.updatePlayerResponseWithBooking(bookedPlayerId, response, bookedPlayer.booking_id)
  }

  async updatePlayerResponseWithBooking(
    bookedPlayerId: string,
    response: 'ja' | 'nej' | 'kanske',
    bookingId: string
  ): Promise<void> {
    const status = response === 'ja' ? 'confirmed' : response === 'nej' ? 'declined' : 'waitlist'

    await this.getSupabase()
      .from('booked_players')
      .update({
        response,
        status,
        responded_at: new Date().toISOString(),
      })
      .eq('id', bookedPlayerId)

    const { data: booking } = await this.getSupabase()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) return

    const { data: confirmedPlayers } = await this.getSupabase()
      .from('booked_players')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('status', 'confirmed')

    if (confirmedPlayers && confirmedPlayers.length >= 4) {
      await this.getSupabase()
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id)
    }
  }

  async getPlayerPendingBookings(playerId: string): Promise<Booking[]> {
    const { data: bookedPlayers } = await this.getSupabase()
      .from('booked_players')
      .select('booking_id, booking:bookings(*)')
      .eq('player_id', playerId)
      .eq('status', 'invited')

    if (!bookedPlayers || bookedPlayers.length === 0) return []

    const bookings: Booking[] = []
    for (const bp of bookedPlayers) {
      if (bp.booking?.status === 'pending') {
        bookings.push(bp.booking as Booking)
      }
    }
    return bookings
  }

  async getBookingWithPlayers(bookingId: string): Promise<Booking | null> {
    const { data: booking, error } = await this.getSupabase()
      .from('bookings')
      .select('*, booked_players(*, player:players(*))')
      .eq('id', bookingId)
      .single()

    if (error) throw error
    return booking
  }

  async findBookingByShortRef(shortRef: string): Promise<Booking | null> {
    const normalizedRef = shortRef.toUpperCase()
    const { data: bookings, error } = await this.getSupabase()
      .from('bookings')
      .select('*')
      .eq('status', 'pending')
      .ilike('id', `%${normalizedRef}%`)
      .limit(1)
      .single()

    if (error || !bookings) return null
    return bookings
  }
}

let bookingService: BookingService | null = null

export function getBookingService(): BookingService {
  if (!bookingService) {
    bookingService = new BookingService()
  }
  return bookingService
}