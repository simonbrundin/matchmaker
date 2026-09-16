import { postgresPool } from "./postgres";
import { getSMSClient } from "./sms-gateway";
import type {
  Player,
  Booking,
  BookedPlayer,
  WeeklyTime,
  InviteCandidate,
} from "../../app/types/database";

const CONFIRMATION_MESSAGE = `🎉 Padel imorgon kl {time} är bekräftad! {count}/4 spelare klara. Välkommen!`;

export class BookingService {
  async notifyAllPlayers(booking: Booking): Promise<void> {
    const smsClient = await getSMSClient();

    const result = await postgresPool.query(
      `SELECT bp.*, p.id as "playerId", p.phone, p.first_name, p.last_name
       FROM booked_players bp
       JOIN players p ON p.id = bp.player_id
       WHERE bp.booking_id = $1 AND bp.status = 'confirmed'`,
      [booking.id],
    );

    const bookedPlayers = result.rows;
    if (bookedPlayers.length < 4) return;

    const message = CONFIRMATION_MESSAGE.replace(
      "{time}",
      booking.scheduled_time,
    ).replace("{count}", String(bookedPlayers.length));

    for (const bp of bookedPlayers) {
      if (bp.phone) {
        try {
          await smsClient.sendMessage(bp.phone, message);
        } catch (error) {
          console.error("Failed to notify player:", error);
        }
      }
    }
  }

  async getWeeklyTimesForDate(date: string): Promise<WeeklyTime[]> {
    const dayOfWeek = new Date(date).getDay();
    const result = await postgresPool.query(
      `SELECT * FROM weekly_times
       WHERE is_active = true AND day_of_week = $1 AND interval_days IS NULL`,
      [dayOfWeek],
    );
    return result.rows;
  }

  async getPlayerAvailability(
    playerId: string,
    date: string,
  ): Promise<boolean> {
    const result = await postgresPool.query(
      `SELECT id FROM unavailabilities
       WHERE player_id = $1 AND $2 BETWEEN start_date AND end_date`,
      [playerId, date],
    );
    return result.rowCount === 0;
  }

  async getEligibleCandidates(
    bookingId: string,
    _hostElo: number,
    date: string,
    _time: string,
  ): Promise<InviteCandidate[]> {
    const playersResult = await postgresPool.query(
      `SELECT * FROM players WHERE is_active = true`,
    );
    const players = playersResult.rows;
    const eligible: InviteCandidate[] = [];

    for (const player of players) {
      const isAvailable = await this.getPlayerAvailability(player.id, date);
      if (!isAvailable) continue;

      const lastMsgResult = await postgresPool.query(
        `SELECT sent_at FROM messages
         WHERE player_id = $1 AND booking_id = $2
         ORDER BY sent_at DESC LIMIT 1`,
        [player.id, bookingId],
      );

      const friendResult = await postgresPool.query(
        `SELECT id FROM friends WHERE friend_id = $1 LIMIT 1`,
        [player.id],
      );
      const isFriend = (friendResult.rowCount ?? 0) > 0;

      const probability = await this.calculateAcceptProbability(
        player,
        isFriend,
      );

      eligible.push({
        player,
        probability,
        is_friend: isFriend,
        last_contacted_at: lastMsgResult.rows[0]?.sent_at || null,
      });
    }

    return eligible.sort((a, b) => {
      if (a.is_friend !== b.is_friend) return b.is_friend ? 1 : -1;
      if (!a.last_contacted_at) return -1;
      if (!b.last_contacted_at) return 1;
      return (
        new Date(a.last_contacted_at).getTime() -
        new Date(b.last_contacted_at).getTime()
      );
    });
  }

  private async calculateAcceptProbability(
    player: Player,
    isFriend: boolean,
  ): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await postgresPool.query(
      `SELECT response FROM messages
       WHERE player_id = $1 AND sent_at >= $2 AND response IS NOT NULL`,
      [player.id, thirtyDaysAgo.toISOString()],
    );

    if (result.rowCount === 0) {
      const baseProbability = 0.3;
      const friendBonus = isFriend ? 0.2 : 0;
      return Math.min(baseProbability + friendBonus, 0.8);
    }

    const yesCount = result.rows.filter((m: any) => m.response === "ja").length;
    const winRate = yesCount / (result.rowCount || 1);

    return 0.3 + winRate * 0.4 + (isFriend ? 0.2 : 0);
  }

  async createBooking(
    hostPlayerId: string,
    date: string,
    time: string,
  ): Promise<Booking> {
    const result = await postgresPool.query(
      `INSERT INTO bookings (scheduled_date, scheduled_time, status, host_player_id)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [date, time, hostPlayerId],
    );
    return result.rows[0];
  }

  async invitePlayer(
    bookingId: string,
    playerId: string,
    inviteNumber: number,
  ): Promise<BookedPlayer> {
    const client = await postgresPool.connect();
    try {
      await client.query("BEGIN");

      const insertResult = await client.query(
        `INSERT INTO booked_players (booking_id, player_id, status, invite_number)
         VALUES ($1, $2, 'invited', $3)
         RETURNING *`,
        [bookingId, playerId, inviteNumber],
      );

      await client.query(
        `UPDATE players SET last_contacted_at = NOW() WHERE id = $1`,
        [playerId],
      );

      await client.query("COMMIT");
      return insertResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePlayerResponse(
    bookedPlayerId: string,
    response: "ja" | "nej" | "kanske",
  ): Promise<void> {
    const result = await postgresPool.query(
      `SELECT * FROM booked_players WHERE id = $1`,
      [bookedPlayerId],
    );
    if (result.rowCount === 0) throw new Error("Booked player not found");
    const bookedPlayer = result.rows[0];
    await this.updatePlayerResponseWithBooking(
      bookedPlayerId,
      response,
      bookedPlayer.booking_id,
    );
  }

  async updatePlayerResponseWithBooking(
    bookedPlayerId: string,
    response: "ja" | "nej" | "kanske",
    bookingId: string,
  ): Promise<void> {
    const status =
      response === "ja"
        ? "confirmed"
        : response === "nej"
          ? "declined"
          : "waitlist";
    const client = await postgresPool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE booked_players
         SET response = $1, status = $2, responded_at = NOW()
         WHERE id = $3`,
        [response, status, bookedPlayerId],
      );

      const bookingResult = await client.query(
        `SELECT * FROM bookings WHERE id = $1`,
        [bookingId],
      );
      const booking = bookingResult.rows[0];
      if (!booking) {
        await client.query("COMMIT");
        return;
      }

      const confirmedResult = await client.query(
        `SELECT id FROM booked_players WHERE booking_id = $1 AND status = 'confirmed'`,
        [bookingId],
      );

      if ((confirmedResult.rowCount ?? 0) >= 4) {
        await client.query(
          `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
          [bookingId],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getPlayerPendingBookings(playerId: string): Promise<Booking[]> {
    const result = await postgresPool.query(
      `SELECT b.* FROM bookings b
       JOIN booked_players bp ON bp.booking_id = b.id
       WHERE bp.player_id = $1 AND bp.status = 'invited' AND b.status = 'pending'`,
      [playerId],
    );
    return result.rows;
  }

  async getBookingWithPlayers(bookingId: string): Promise<Booking | null> {
    const bookingResult = await postgresPool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [bookingId],
    );
    if (bookingResult.rowCount === 0) return null;
    const booking = bookingResult.rows[0];

    const playersResult = await postgresPool.query(
      `SELECT bp.*, p.id as "playerId", p.phone, p.first_name, p.last_name, p.elo
       FROM booked_players bp
       JOIN players p ON p.id = bp.player_id
       WHERE bp.booking_id = $1`,
      [bookingId],
    );

    return { ...booking, booked_players: playersResult.rows };
  }
}

let bookingService: BookingService | null = null;

export function getBookingService(): BookingService {
  if (!bookingService) {
    bookingService = new BookingService();
  }
  return bookingService;
}
