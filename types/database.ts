export interface Player {
  id: string
  phone: string
  first_name: string
  last_name: string | null
  elo: number
  is_active: boolean
  created_at: string
  updated_at: string
  total_matches_played: number
}

export interface WishlistTime {
  id: string
  player_id: string
  preferred_day: number
  preferred_time: string
  created_at: string
}

export interface Unavailability {
  id: string
  player_id: string
  start_date: string
  end_date: string
  reason: string | null
  ai_parsed: boolean
  created_at: string
}

export interface WeeklyTime {
  id: string
  player_id: string
  day_of_week: number
  time: string
  is_active: boolean
  created_at: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface BookingBase {
  id: string
  scheduled_date: string
  scheduled_time: string
  status: BookingStatus
  host_confirmed: boolean
  host_player_id: string
  created_at: string
  updated_at: string
}

export interface Booking extends BookingBase {}

export type BookedPlayerStatus = 'invited' | 'confirmed' | 'declined' | 'waitlist'
export type PlayerResponse = 'ja' | 'nej' | 'kanske' | null

export interface BookedPlayer {
  id: string
  booking_id: string
  player_id: string
  status: BookedPlayerStatus
  invited_at: string
  responded_at: string | null
  response: PlayerResponse
  invite_number: number
  player?: Player
  booking?: Booking
}

export interface Friend {
  id: string
  player_id: string
  friend_id: string
  priority: number
  created_at: string
  player?: Player
  friend?: Player
}

export type MessageDirection = 'outgoing' | 'incoming'

export interface Message {
  id: string
  booking_id: string | null
  player_id: string
  direction: MessageDirection
  content: string
  sent_at: string
  response_received_at: string | null
  response: PlayerResponse
  invite_round: number | null
  player?: Player
}

export interface AIResponseSuggestion {
  id: string
  player_id: string
  incoming_message: string
  ai_suggested_response: string
  ai_confidence: number
  created_at: string
  approved: boolean | null
  telegram_message_id: number | null
  player?: Player
}

export interface BookingWithPlayers extends Booking {
  booked_players: BookedPlayer[]
}

export interface Booking extends BookingBase {
  booked_players?: BookedPlayer[]
}

export interface PlayerWithStats extends Player {
  win_rate?: number
  last_contacted_at?: string | null
}

export interface InviteCandidate {
  player: Player
  probability: number
  is_friend: boolean
  last_contacted_at: string | null
}