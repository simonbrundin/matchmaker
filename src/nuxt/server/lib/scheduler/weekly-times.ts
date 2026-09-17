/**
 * SQL queries for weekly times used by the scheduler.
 */

import { postgresPool } from "../postgres";
import type {
  WeeklyTimeRow,
  ValidatedWeeklyTimeRow,
  BookingRow,
} from "./types";

/**
 * Runtime-validate a raw SQL row into a ValidatedWeeklyTimeRow.
 * Returns null if any required field is missing.
 */
function validateRow(raw: unknown): ValidatedWeeklyTimeRow | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.player_id !== "string") return null;
  if (typeof r.time !== "string") return null;
  if (typeof r.phone !== "string") return null;
  return {
    player_id: r.player_id,
    time: r.time,
    phone: r.phone,
    first_name: typeof r.first_name === "string" ? r.first_name : null,
    hall_id: typeof r.hall_id === "string" ? r.hall_id : null,
  };
}

/**
 * Filter and validate raw SQL rows, returning only valid entries.
 */
export function validatedWeeklyTimeRows(rows: unknown[]): ValidatedWeeklyTimeRow[] {
  const out: ValidatedWeeklyTimeRow[] = [];
  for (const r of rows) {
    const v = validateRow(r);
    if (v) out.push(v);
  }
  return out;
}

/**
 * Fetch weekly times for a specific day of week.
 * Only returns active schedules with no interval (regular weekly times).
 */
export async function fetchWeeklyTimesForDay(
  dayNum: number,
): Promise<ValidatedWeeklyTimeRow[]> {
  const result = await postgresPool.query<WeeklyTimeRow>(
    `SELECT wt.player_id, wt.time, p.phone, p.first_name, wt.hall_id
     FROM weekly_times wt
     JOIN players p ON p.id = wt.player_id
     WHERE wt.day_of_week = $1
       AND wt.is_active = true
       AND wt.interval_days IS NULL`,
    [dayNum],
  );

  return validatedWeeklyTimeRows(result.rows);
}

/**
 * Check if a booking already exists for the given date and time.
 */
export async function findExistingBooking(
  dateStr: string,
  time: string,
): Promise<BookingRow | null> {
  const result = await postgresPool.query<BookingRow>(
    `SELECT * FROM bookings WHERE scheduled_date = $1 AND scheduled_time = $2`,
    [dateStr, time],
  );
  return result.rows[0] ?? null;
}

/**
 * Get booking with its booked players.
 */
export async function getBookingWithPlayers(
  bookingId: string,
): Promise<BookingRow | null> {
  const result = await postgresPool.query<BookingRow>(
    `SELECT b.*,
            array_agg(
              json_build_object('id', bp.id, 'player_id', bp.player_id, 'status', bp.status)
            ) FILTER (WHERE bp.id IS NOT NULL) as booked_players_arr
     FROM bookings b
     LEFT JOIN booked_players bp ON bp.booking_id = b.id
     WHERE b.id = $1
     GROUP BY b.id`,
    [bookingId],
  );
  return result.rows[0] ?? null;
}

/**
 * Get the last outgoing message sent time for a player/booking.
 */
export async function getLastMessageTime(
  bookingId: string,
  playerId: string,
): Promise<Date | null> {
  const result = await postgresPool.query(
    `SELECT sent_at FROM messages
     WHERE booking_id = $1 AND player_id = $2 AND direction = 'outgoing'
     ORDER BY sent_at DESC LIMIT 1`,
    [bookingId, playerId],
  );
  return result.rows[0]?.sent_at
    ? new Date(result.rows[0].sent_at)
    : null;
}

/**
 * Record an outgoing message in the database.
 */
export async function recordOutgoingMessage(
  bookingId: string,
  playerId: string,
  content: string,
  inviteRound: number,
): Promise<void> {
  await postgresPool.query(
    `INSERT INTO messages (booking_id, player_id, direction, content, invite_round)
     VALUES ($1, $2, 'outgoing', $3, $4)`,
    [bookingId, playerId, content, inviteRound],
  );
}
