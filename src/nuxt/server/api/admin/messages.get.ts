import { postgresPool } from "~~/server/lib/postgres";

const PLAYER_DAYS_AHEAD = 4;
const PLAYER_CONTACT_TIMES = ["08:00", "12:30", "17:00"];
const MAX_PLAYERS_PER_BOOKING = 4;

interface BookingMessage {
  booking_id: string;
  player_id: string;
  direction: string;
  invite_round: number | null;
}

interface EnrichedBooking {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  booked_players: BookedPlayerData[];
  player_messages: Record<string, PlayerMessageData>;
  message_count: number;
  confirmed_count: number;
  fill_status: "green" | "yellow" | "red";
  invited_rounds: number;
  max_rounds: number;
}

interface BookedPlayerData {
  id: string;
  player_id: string;
  status: string;
  response: string | null;
  player: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
}

interface PlayerMessageData {
  player: BookedPlayerData["player"];
  status: string;
  response: string | null;
  messages: BookingMessage[];
}

export default defineEventHandler(async () => {
  const client = await postgresPool.connect();
  try {
    // Get all bookings that have messages
    const bookingsResult = await client.query<{ booking_id: string }>(
      `SELECT DISTINCT booking_id FROM messages WHERE booking_id IS NOT NULL`,
    );

    const bookingIds = bookingsResult.rows.map((r) => r.booking_id);
    if (bookingIds.length === 0) {
      return { messages: [] };
    }

    // Get bookings with booked_players and players in one query
    const bookingsData = await client.query<{
      id: string;
      scheduled_date: string;
      scheduled_time: string;
      status: string;
      booked_players: BookedPlayerData[];
    }>(
      `SELECT
        b.id,
        b.scheduled_date,
        b.scheduled_time,
        b.status,
        COALESCE(
          (
            SELECT json_agg(build_row)
            FROM (
              SELECT
                bp.id,
                bp.player_id,
                bp.status,
                bp.response,
                json_build_object(
                  'id', p.id,
                  'first_name', p.first_name,
                  'last_name', p.last_name,
                  'phone', p.phone
                ) as player
              FROM booked_players bp
              JOIN players p ON p.id = bp.player_id
              WHERE bp.booking_id = b.id
            ) build_row
          ),
          '[]'::json
        ) as booked_players
      FROM bookings b
      WHERE b.id = ANY($1)
      ORDER BY b.scheduled_date DESC, b.scheduled_time DESC`,
      [bookingIds],
    );

    // Get all messages for these bookings
    const messagesResult = await client.query<BookingMessage & { player_id: string; first_name: string | null }>(
      `SELECT
        m.booking_id,
        m.player_id,
        m.direction,
        m.invite_round,
        p.first_name
      FROM messages m
      JOIN players p ON p.id = m.player_id
      WHERE m.booking_id = ANY($1)
      ORDER BY m.sent_at ASC`,
      [bookingIds],
    );

    // Build message index: bookingId -> playerId -> messages[]
    const messageIndex = buildMessageIndex(messagesResult.rows);

    // Enrich bookings with messages
    const enrichedBookings: EnrichedBooking[] = [];

    for (const booking of bookingsData.rows) {
      const enriched = enrichBooking(booking, messageIndex);
      if (enriched.message_count > 0) {
        enrichedBookings.push(enriched);
      }
    }

    return { messages: enrichedBookings };
  } finally {
    client.release();
  }
});

function buildMessageIndex(
  messages: (BookingMessage & { player_id: string; first_name: string | null })[],
): Map<string, Map<string, BookingMessage[]>> {
  const index = new Map<string, Map<string, BookingMessage[]>>();

  for (const msg of messages) {
    if (!msg.booking_id) continue;

    let bookingMap = index.get(msg.booking_id);
    if (!bookingMap) {
      bookingMap = new Map();
      index.set(msg.booking_id, bookingMap);
    }

    let playerMessages = bookingMap.get(msg.player_id);
    if (!playerMessages) {
      playerMessages = [];
      bookingMap.set(msg.player_id, playerMessages);
    }

    playerMessages.push(msg);
  }

  return index;
}

function enrichBooking(
  booking: {
    id: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    booked_players: BookedPlayerData[];
  },
  messageIndex: Map<string, Map<string, BookingMessage[]>>,
): EnrichedBooking {
  let confirmedCount = 0;
  let maxInviteRound = 0;
  const playerMessages: Record<string, PlayerMessageData> = {};

  for (const bp of booking.booked_players || []) {
    if (bp.status === "confirmed") {
      confirmedCount++;
    }

    const messages = messageIndex.get(booking.id)?.get(bp.player_id) || [];

    for (const msg of messages) {
      if (msg.direction === "outgoing" && msg.invite_round) {
        maxInviteRound = Math.max(maxInviteRound, msg.invite_round);
      }
    }

    if (messages.length > 0) {
      playerMessages[bp.player_id] = {
        player: bp.player,
        status: bp.status,
        response: bp.response,
        messages,
      };
    }
  }

  const maxRounds = PLAYER_DAYS_AHEAD * PLAYER_CONTACT_TIMES.length;
  const fillStatus =
    confirmedCount >= MAX_PLAYERS_PER_BOOKING
      ? "green"
      : booking.status === "pending"
        ? "yellow"
        : "red";

  return {
    ...booking,
    player_messages: playerMessages,
    message_count: Object.values(playerMessages).reduce(
      (sum, pm) => sum + pm.messages.length,
      0,
    ),
    confirmed_count: confirmedCount,
    fill_status: fillStatus,
    invited_rounds: maxInviteRound,
    max_rounds: maxRounds,
  };
}
