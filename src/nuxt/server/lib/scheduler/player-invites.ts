/**
 * Player invite logic for the scheduler.
 */

import { postgresPool } from "../postgres";
import { sendToAdmin } from "../telegram";
import { isHallAvailable } from "../booking-systems";
import { generateInviteMessage } from "../ai";
import { getBookingService } from "../booking";
import type { SMSGatewayClient } from "../sms-gateway";
import {
  fetchWeeklyTimesForDay,
  getBookingWithPlayers,
} from "./weekly-times";
import { sendPlayerInvite } from "./sms-helpers";
import type { ValidatedWeeklyTimeRow } from "./types";

const TARGET_PLAYERS = 4;
const INVITE_MULTIPLIER = 3;
const ROUND_BONUS_FACTOR = 1 / 36;

export async function sendPlayerInvites(
  smsClient: SMSGatewayClient,
  dateStr: string,
  dayNum: number,
  round: number,
): Promise<void> {
  const bookingService = getBookingService();

  await sendToAdmin(`📨 Spelarinbjudningar (runda ${round})...`);

  const weeklyTimes = await fetchWeeklyTimesForDay(dayNum);
  if (weeklyTimes.length === 0) return;

  for (const wt of weeklyTimes) {
    await processBookingForPlayerInvites(
      smsClient,
      bookingService,
      wt,
      dateStr,
      round,
    );
  }
}

async function processBookingForPlayerInvites(
  smsClient: SMSGatewayClient,
  bookingService: ReturnType<typeof getBookingService>,
  wt: ValidatedWeeklyTimeRow,
  dateStr: string,
  round: number,
): Promise<void> {
  const booking = await getBookingWithPlayers(wt.hall_id || "", dateStr, wt.time);

  if (!booking || !booking.host_confirmed) return;
  if (booking.status === "confirmed") return;

  const confirmedCount = countConfirmedPlayers(booking);
  if (confirmedCount >= TARGET_PLAYERS) {
    await markBookingConfirmed(booking.id);
    await sendToAdmin(`🎉 ${dateStr} ${wt.time} fullbemannad!`);
    return;
  }

  // Check hall availability
  const gate = await isHallAvailable(wt.hall_id, dateStr, wt.time);
  if (!gate.ok) {
    await sendToAdmin(
      `⏸ Skippade spelarinbjudningar ${dateStr} ${wt.time} — ${gate.reason ?? "bokningssystem otillgängligt"}`,
    );
    return;
  }

  const slots = TARGET_PLAYERS - confirmedCount;
  await sendInvitesForBooking(
    smsClient,
    bookingService,
    booking,
    dateStr,
    wt.time,
    confirmedCount,
    slots,
    round,
  );
}

async function sendInvitesForBooking(
  smsClient: SMSGatewayClient,
  bookingService: ReturnType<typeof getBookingService>,
  booking: { id: string },
  dateStr: string,
  time: string,
  confirmed: number,
  slots: number,
  round: number,
): Promise<void> {
  if (slots <= 0) return;

  // Get already contacted players
  const contactedResult = await postgresPool.query(
    `SELECT player_id FROM booked_players WHERE booking_id = $1`,
    [booking.id],
  );
  const contacted = new Set(contactedResult.rows.map((p) => p.player_id));

  const candidates = await bookingService.getEligibleCandidates(
    booking.id,
    1200,
    dateStr,
    time,
  );

  const newCands = candidates.filter((c) => !contacted.has(c.player.id));
  const top = newCands.slice(0, slots * INVITE_MULTIPLIER);

  let sent = 0;

  for (let i = 0; i < top.length && sent < slots; i++) {
    const cand = top[i];
    if (!cand) continue;

    const threshold = (slots - i) * ROUND_BONUS_FACTOR;
    if (cand.probability < threshold) continue;

    try {
      await bookingService.invitePlayer(booking.id, cand.player.id, sent + 1);

      const firstName = cand.player.first_name || "spelare";
      const message = await generateInviteMessage(firstName, dateStr, time);

      await sendPlayerInvite(
        smsClient,
        cand.player.phone,
        message,
        booking.id,
        cand.player.id,
        round,
      );

      sent++;
    } catch (error) {
      console.error(`[player-invites] Invite failed for candidate ${i}:`, error);
    }
  }
}

function countConfirmedPlayers(booking: { booked_players_arr?: { status: string }[] }): number {
  return (booking.booked_players_arr || []).filter(
    (p) => p.status === "confirmed",
  ).length;
}

async function markBookingConfirmed(bookingId: string): Promise<void> {
  await postgresPool.query(
    `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
    [bookingId],
  );
}
