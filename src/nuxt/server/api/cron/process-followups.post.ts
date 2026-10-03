import { postgresPool } from "~~/server/lib/postgres";
import { getSMSClient } from "~~/server/lib/sms-gateway";
import { sendToAdmin } from "~~/server/lib/telegram";

const MAX_DAYS_SINCE_INVITE = 4;
const MAX_MESSAGES_PER_DAY = 3;
const FOLLOWUP_MESSAGES = [
  "Hej! Påminnelse om padel imorgon. Kan du?",
  "Vad gäller med padeln imorgon?",
  "Sista chansen att svara - kan du spela imorgon?",
];

interface PendingInvite {
  id: string;
  booking_id: string;
  player_id: string;
  invited_at: string;
  player: {
    id: string;
    phone: string;
    first_name: string;
  };
}

export default defineEventHandler(async (event) => {
  const smsClient = await getSMSClient();

  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = Math.floor(now.getTime() / (1000 * 60 * 60 * 24));

  // Get pending bookings that are due (today, time already passed)
  const pendingResult = await postgresPool.query(
    `SELECT * FROM bookings
     WHERE status = 'pending'
       AND scheduled_date = CURRENT_DATE
       AND scheduled_time <= CURRENT_TIME`,
  );

  let messagesSent = 0;

  for (const booking of pendingResult.rows) {
    const invites = await getPendingInvitesForBooking(booking.id);
    if (invites.length === 0) continue;

    for (const invite of invites) {
      const invitedAt = new Date(invite.invited_at);
      const dayInvited = Math.floor(invitedAt.getTime() / (1000 * 60 * 60 * 24));
      const daysSinceInvite = currentDay - dayInvited;

      if (daysSinceInvite > MAX_DAYS_SINCE_INVITE) continue;

      const maxMessages = (daysSinceInvite + 1) * MAX_MESSAGES_PER_DAY;
      const currentDayMessages = getMessageCountForHour(currentHour);

      if (currentDayMessages >= MAX_MESSAGES_PER_DAY) continue;

      const existingCount = await getOutgoingMessageCount(
        booking.id,
        invite.player_id,
      );

      if (existingCount >= maxMessages) continue;

      const messageIndex = Math.min(daysSinceInvite, FOLLOWUP_MESSAGES.length - 1);
      const message = FOLLOWUP_MESSAGES[messageIndex];

      try {
        await smsClient.sendMessage(invite.player.phone, message);

        await postgresPool.query(
          `INSERT INTO messages (booking_id, player_id, direction, content)
           VALUES ($1, $2, 'outgoing', $3)`,
          [booking.id, invite.player_id, message],
        );

        messagesSent++;
      } catch (error) {
        console.error(
          `[process-followups] Failed to send followup to ${invite.player.first_name}:`,
          error,
        );
      }
    }
  }

  await sendToAdmin(`📨 Skickade ${messagesSent} uppföljningsmeddelanden`);

  return {
    success: true,
    messagesSent,
  };
});

async function getPendingInvitesForBooking(bookingId: string): Promise<PendingInvite[]> {
  const result = await postgresPool.query(
    `SELECT bp.id, bp.booking_id, bp.player_id, bp.invited_at,
            p.id as "player.id", p.phone as "player.phone", p.first_name as "player.first_name"
     FROM booked_players bp
     JOIN players p ON p.id = bp.player_id
     WHERE bp.booking_id = $1 AND bp.status = 'invited' AND bp.response IS NULL`,
    [bookingId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    booking_id: row.booking_id,
    player_id: row.player_id,
    invited_at: row.invited_at,
    player: {
      id: row["player.id"],
      phone: row["player.phone"],
      first_name: row["player.first_name"],
    },
  }));
}

async function getOutgoingMessageCount(
  bookingId: string,
  playerId: string,
): Promise<number> {
  const result = await postgresPool.query(
    `SELECT COUNT(*) as count FROM messages
     WHERE booking_id = $1 AND player_id = $2 AND direction = 'outgoing'`,
    [bookingId, playerId],
  );
  return parseInt(result.rows[0].count, 10);
}

function getMessageCountForHour(hour: number): number {
  if (hour >= 8 && hour < 12) return 1;
  if (hour >= 12 && hour < 17) return 2;
  if (hour >= 17) return 3;
  return 0;
}
