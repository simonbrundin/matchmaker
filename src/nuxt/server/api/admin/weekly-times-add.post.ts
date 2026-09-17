import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const {
    player_id,
    weekday,
    time,
    type = "weekly",
    interval_days,
    start_date,
    week_parity = "all",
    is_active = true,
    sport_id,
    hall_id,
  } = body;

  if (!player_id) {
    throw createError({ statusCode: 400, message: "player_id required" });
  }

  if (type !== "weekly" && type !== "interval") {
    throw createError({ statusCode: 400, message: "invalid schedule type" });
  }

  if (type === "weekly" && (weekday === undefined || weekday === null)) {
    throw createError({ statusCode: 400, message: "weekday required" });
  }

  if (type === "interval" && (!interval_days || Number(interval_days) < 1)) {
    throw createError({
      statusCode: 400,
      message: "interval_days must be at least 1",
    });
  }

  if (!time) {
    throw createError({ statusCode: 400, message: "time required" });
  }

  if (!sport_id) {
    throw createError({ statusCode: 400, message: "sport_id required" });
  }

  if (!hall_id) {
    throw createError({ statusCode: 400, message: "hall_id required" });
  }

  // Convert the UI's 1-7 (Mon-Sun) to PostgreSQL's 0-6 (Sun-Sat).
  const dayOfWeek =
    type === "weekly" ? (Number(weekday) === 7 ? 0 : Number(weekday)) : null;

  if (type === "weekly" && (dayOfWeek! < 0 || dayOfWeek! > 6)) {
    throw createError({ statusCode: 400, message: "weekday must be 1-7" });
  }

  const client = await postgresPool.connect();
  try {
    // Validate that the hall exists, is active, and matches the sport.
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

    const result = await client.query(
      `
      INSERT INTO weekly_times (
        player_id, day_of_week, time, week_parity, interval_days, start_date, is_active,
        sport_id, hall_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [
        player_id,
        dayOfWeek,
        time,
        type === "weekly" ? week_parity : null,
        type === "interval" ? Number(interval_days) : null,
        start_date || null,
        is_active,
        sport_id,
        hall_id,
      ],
    );

    return { success: true, weeklyTime: result.rows[0] };
  } finally {
    client.release();
  }
});
