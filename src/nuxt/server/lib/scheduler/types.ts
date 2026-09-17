/**
 * Shared types for the scheduler system.
 */

export interface WeeklyTimeRow {
  player_id: string;
  time: string;
  phone: string;
  first_name: string | null;
  hall_id: string | null;
  day_of_week: number;
}

/**
 * Validated row shape where required fields are guaranteed string.
 * Null is acceptable for nullable fields like first_name and hall_id.
 */
export interface ValidatedWeeklyTimeRow {
  player_id: string;
  time: string;
  phone: string;
  first_name: string | null;
  hall_id: string | null;
}

export interface BookingRow {
  id: string;
  host_confirmed: boolean;
  status: string;
  booked_players_arr?: BookedPlayerSlot[];
}

export interface BookedPlayerSlot {
  id: string;
  player_id: string;
  status: string;
}
