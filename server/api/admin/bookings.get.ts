import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async () => {
  const client = await postgresPool.connect();
  try {
    const result = await client.query(`
      SELECT
        b.*,
        json_agg(
          json_build_object(
            'id', bp.id,
            'booking_id', bp.booking_id,
            'player_id', bp.player_id,
            'status', bp.status,
            'invited_at', bp.invited_at,
            'responded_at', bp.responded_at,
            'response', bp.response,
            'invite_number', bp.invite_number,
            'player', json_build_object(
              'id', p.id,
              'first_name', p.first_name,
              'last_name', p.last_name,
              'phone', p.phone,
              'elo', p.elo
            )
          )
        ) FILTER (WHERE bp.id IS NOT NULL) as booked_players
      FROM bookings b
      LEFT JOIN booked_players bp ON bp.booking_id = b.id
      LEFT JOIN players p ON p.id = bp.player_id
      GROUP BY b.id
      ORDER BY b.scheduled_date DESC
      LIMIT 50
    `);

    return { bookings: result.rows };
  } finally {
    client.release();
  }
});
