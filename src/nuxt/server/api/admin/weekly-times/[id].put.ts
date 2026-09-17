import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "id required" });
  }

  const body = await readBody(event);
  const {
    player_id,
    time,
    weekday,
    week_parity = "all",
    interval_days,
    start_date,
    is_active = true,
    sport_id,
    hall_id,
  } = body;

  if (!player_id) {
    throw createError({ statusCode: 400, message: "player_id required" });
  }

  const isInterval = interval_days !== undefined && interval_days !== null;
  if (!isInterval && (weekday === undefined || weekday === null)) {
    throw createError({ statusCode: 400, message: "weekday required" });
  }
  if (isInterval && Number(interval_days) < 1) {
    throw createError({
      statusCode: 400,
      message: "interval_days must be at least 1",
    });
  }

  const dayOfWeek = isInterval
    ? null
    : Number(weekday) === 7
      ? 0
      : Number(weekday);

  const client = await postgresPool.connect();
  try {
    // If a hall is provided, validate it matches the sport.
    if (hall_id) {
      if (!sport_id) {
        throw createError({
          statusCode: 400,
          message: "sport_id required when hall_id is provided",
        });
      }
      const hallCheck = await client.query(
        `SELECT id, sport_id FROM halls WHERE id = $1 AND is_active = true`,
        [hall_id],
      );
      if (hallCheck.rowCount === 0) {
        throw createError({
          statusCode: 400,
          message: "hall_id not found or inactive",
        });
      }
      if (hallCheck.rows[0].sport_id !== sport_id) {
        throw createError({
          statusCode: 400,
          message: "hall does not belong to the selected sport",
        });
      }
    }

    const result = await client.query(
      `
        UPDATE weekly_times
        SET player_id = $1,
            day_of_week = $2,
            time = $3,
            week_parity = $4,
            interval_days = $5,
            start_date = $6,
            is_active = $7,
            sport_id = COALESCE($8, sport_id),
            hall_id = COALESCE($9, hall_id)
        WHERE id = $10
        RETURNING *
      `,
      [
        player_id,
        dayOfWeek,
        time,
        isInterval ? null : week_parity,
        isInterval ? Number(interval_days) : null,
        start_date || null,
        is_active,
        sport_id ?? null,
        hall_id ?? null,
        id,
      ],
    );

    if (result.rowCount === 0) {
      throw createError({ statusCode: 404, message: "weekly time not found" });
    }

    return { success: true, weeklyTime: result.rows[0] };
  } finally {
    client.release();
  }
});
