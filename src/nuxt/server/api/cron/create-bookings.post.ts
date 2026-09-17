import { postgresPool } from "~~/server/lib/postgres";
import { getBookingService } from "~~/server/lib/booking";
import { getSMSClient } from "~~/server/lib/sms-gateway";
import { generateInviteMessage } from "~~/server/lib/ai";
import { sendToAdmin } from "~~/server/lib/telegram";

const NEEDED_PLAYERS = 3;
const CANDIDATES_MULTIPLIER = 3;
const SLEEP_BETWEEN_SMS_MS = 1000;

export default defineEventHandler(async (event) => {
  const bookingService = getBookingService();
  const smsClient = await getSMSClient();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  await sendToAdmin(`📅 Skapar bokningar för ${dateStr}...`);

  const weeklyTimes = await bookingService.getWeeklyTimesForDate(dateStr);
  let bookingsCreated = 0;

  for (const wt of weeklyTimes) {
    if (!wt.player_id || !wt.time) continue;

    // Check if booking already exists
    const existingResult = await postgresPool.query(
      `SELECT id FROM bookings WHERE scheduled_date = $1 AND scheduled_time = $2 LIMIT 1`,
      [dateStr, wt.time],
    );

    if (existingResult.rows[0]) {
      continue;
    }

    const booking = await bookingService.createBooking(
      wt.player_id,
      dateStr,
      wt.time,
    );

    bookingsCreated++;

    const candidates = await bookingService.getEligibleCandidates(
      booking.id,
      1200,
      dateStr,
      wt.time,
    );

    const topCandidates = candidates.slice(0, NEEDED_PLAYERS * CANDIDATES_MULTIPLIER);

    let sentCount = 0;

    for (let i = 0; i < topCandidates.length && sentCount < NEEDED_PLAYERS; i++) {
      const candidate = topCandidates[i];
      if (!candidate) continue;

      const probabilityThreshold = (NEEDED_PLAYERS - i) / 36;

      if (candidate.probability < probabilityThreshold) {
        continue;
      }

      try {
        await bookingService.invitePlayer(
          booking.id,
          candidate.player.id,
          i + 1,
        );

        const message = await generateInviteMessage(
          candidate.player.first_name,
          dateStr,
          wt.time,
        );

        await smsClient.sendMessage(candidate.player.phone, message);

        await postgresPool.query(
          `INSERT INTO messages (booking_id, player_id, direction, content)
           VALUES ($1, $2, 'outgoing', $3)`,
          [booking.id, candidate.player.id, message],
        );

        sentCount++;

        if (sentCount >= NEEDED_PLAYERS) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, SLEEP_BETWEEN_SMS_MS));
      } catch (error) {
        console.error(
          `[create-bookings] Failed to invite ${candidate.player.first_name}:`,
          error,
        );
      }
    }

    await sendToAdmin(
      `✅ Skapade bokning för ${dateStr} ${wt.time}. Skickade ${sentCount} inbjudningar.`,
    );
  }

  return {
    success: true,
    bookingsCreated,
    date: dateStr,
  };
});
