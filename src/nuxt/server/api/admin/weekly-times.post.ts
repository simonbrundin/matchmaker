import { postgresPool } from "~~/server/lib/postgres";

interface ScheduleInput {
  player_id?: string;
  day_of_week?: number;
  weekday?: number;
  time?: string;
  week_parity?: string;
  interval_days?: number;
  start_date?: string;
  phone?: string;
  name?: string;
  elo?: number;
  sport_id?: string;
  hall_id?: string;
}

function resolveDayOfWeek(body: ScheduleInput): number | null {
  if (body.interval_days) return null;
  if (body.weekday !== undefined) {
    return Number(body.weekday) === 7 ? 0 : Number(body.weekday);
  }
  if (body.day_of_week !== undefined) return Number(body.day_of_week);
  return null;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ScheduleInput>(event);
  const client = await postgresPool.connect();

  try {
    await client.query("BEGIN");

    let playerId = body.player_id;
    if (!playerId && body.phone && body.name) {
      const existingPlayer = await client.query(
        "SELECT id FROM players WHERE phone = $1",
        [body.phone],
      );
      playerId = existingPlayer.rows[0]?.id;

      if (!playerId) {
        const newPlayer = await client.query(
          `INSERT INTO players (phone, first_name, elo)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [body.phone, body.name, body.elo || 1200],
        );
        playerId = newPlayer.rows[0].id;
      }
    }

    if (!playerId) {
      throw createError({
        statusCode: 400,
        message: "player_id or (phone + name) required",
      });
    }
    if (!body.time) {
      throw createError({ statusCode: 400, message: "time required" });
    }
    if (body.interval_days !== undefined && Number(body.interval_days) < 1) {
      throw createError({
        statusCode: 400,
        message: "interval_days must be at least 1",
      });
    }

    if (!body.sport_id) {
      throw createError({ statusCode: 400, message: "sport_id required" });
    }
    if (!body.hall_id) {
      throw createError({ statusCode: 400, message: "hall_id required" });
    }

    const dayOfWeek = resolveDayOfWeek(body);
    if (dayOfWeek === null && !body.interval_days) {
      throw createError({
        statusCode: 400,
        message: "weekday or interval_days required",
      });
    }

    // Validate hall exists, is active, and matches the selected sport.
    const hallCheck = await client.query(
      `SELECT id, sport_id FROM halls WHERE id = $1 AND is_active = true`,
      [body.hall_id],
    );
    if (hallCheck.rowCount === 0) {
      throw createError({
        statusCode: 400,
        message: "hall_id not found or inactive",
      });
    }
    if (hallCheck.rows[0].sport_id !== body.sport_id) {
      throw createError({
        statusCode: 400,
        message: "hall does not belong to the selected sport",
      });
    }

    const result = await client.query(
      `INSERT INTO weekly_times (
        player_id, day_of_week, time, week_parity, interval_days, start_date, is_active,
        sport_id, hall_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
      RETURNING *`,
      [
        playerId,
        dayOfWeek,
        body.time,
        body.interval_days ? null : body.week_parity || "all",
        body.interval_days ? Number(body.interval_days) : null,
        body.start_date || null,
        body.sport_id,
        body.hall_id,
      ],
    );

    await client.query("COMMIT");
    return { success: true, weeklyTime: result.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
