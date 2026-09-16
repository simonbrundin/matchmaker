import { postgresPool } from "~~/server/lib/postgres";

const PLAYER_DAYS_AHEAD = 4;
const PLAYER_CONTACT_TIMES = ["08:00", "12:30", "17:00"];

function calculateMaxRounds(scheduledDate: string): number {
  return PLAYER_DAYS_AHEAD * PLAYER_CONTACT_TIMES.length;
}

export default defineEventHandler(async () => {
  const client = await postgresPool.connect();
  try {
    // Get all bookings that have messages
    const bookingsResult = await client.query(`
      SELECT DISTINCT booking_id
      FROM messages
      WHERE booking_id IS NOT NULL
    `);

    const uniqueBookingIds = bookingsResult.rows.map((r) => r.booking_id);

    if (uniqueBookingIds.length === 0) {
      return { messages: [] };
    }

    // Get bookings with booked_players and players
    const bookingsData = await client.query(
      `
      SELECT
        b.id,
        b.scheduled_date,
        b.scheduled_time,
        b.status,
        json_agg(
          json_build_object(
            'id', bp.id,
            'player_id', bp.player_id,
            'status', bp.status,
            'response', bp.response,
            'player', json_build_object(
              'id', p.id,
              'first_name', p.first_name,
              'last_name', p.last_name,
              'phone', p.phone
            )
          )
        ) FILTER (WHERE bp.id IS NOT NULL) as booked_players
      FROM bookings b
      LEFT JOIN booked_players bp ON bp.booking_id = b.id
      LEFT JOIN players p ON p.id = bp.player_id
      WHERE b.id = ANY($1)
      GROUP BY b.id
      ORDER BY b.scheduled_date DESC, b.scheduled_time DESC
    `,
      [uniqueBookingIds],
    );

    // Get all messages for these bookings
    const messagesResult = await client.query(
      `
      SELECT m.*,
        json_build_object(
          'id', p.id,
          'first_name', p.first_name,
          'last_name', p.last_name
        ) as player
      FROM messages m
      JOIN players p ON p.id = m.player_id
      WHERE m.booking_id = ANY($1)
      ORDER BY m.sent_at ASC
    `,
      [uniqueBookingIds],
    );

    // Group messages by booking_id and player_id
    const messagesByBookingAndPlayer: Record<
      string,
      Record<string, any[]>
    > = {};
    for (const msg of messagesResult.rows) {
      const bookingMessages = (messagesByBookingAndPlayer[msg.booking_id] ??=
        {});
      const playerMessages = (bookingMessages[msg.player_id] ??= []);
      playerMessages.push(msg);
    }

    // Enrich bookings with messages
    const enrichedBookings = bookingsData.rows
      .map((booking) => {
        const playerMessages: Record<string, any> = {};
        let confirmedCount = 0;
        let maxInviteRound = 0;

        for (const bp of booking.booked_players || []) {
          if (bp.status === "confirmed") confirmedCount++;

          const messages =
            messagesByBookingAndPlayer[booking.id]?.[bp.player_id] || [];

          for (const msg of messages) {
            if (msg.direction === "outgoing") {
              const round = msg.invite_round || 1;
              if (round > maxInviteRound) {
                maxInviteRound = round;
              }
            }
          }

          if (messages.length > 0) {
            playerMessages[bp.player_id] = {
              player: bp.player,
              status: bp.status,
              response: bp.response,
              messages: messages,
            };
          }
        }

        const maxRounds = calculateMaxRounds(booking.scheduled_date);
        const fillStatus =
          confirmedCount >= 4
            ? "green"
            : booking.status === "pending"
              ? "yellow"
              : "red";

        return {
          ...booking,
          player_messages: playerMessages,
          message_count: Object.values(playerMessages).reduce(
            (sum, pm: any) => sum + pm.messages.length,
            0,
          ),
          confirmed_count: confirmedCount,
          fill_status: fillStatus,
          invited_rounds: maxInviteRound,
          max_rounds: maxRounds,
        };
      })
      .filter((b: any) => b.message_count > 0);

    return { messages: enrichedBookings };
  } finally {
    client.release();
  }
});
