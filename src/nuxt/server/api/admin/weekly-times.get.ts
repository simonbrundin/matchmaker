import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const showAll = query.active === "all";

  const client = await postgresPool.connect();
  try {
    // Get all active weekly times
    const result = await client.query(
      `
      SELECT
        wt.id,
        wt.player_id,
        wt.day_of_week,
        wt.time,
        wt.week_parity,
        wt.interval_days,
        wt.start_date,
        wt.is_active,
        wt.created_at,
        json_build_object(
          'id', p.id,
          'first_name', p.first_name,
          'last_name', p.last_name,
          'phone', p.phone
        ) as player
      FROM weekly_times wt
      JOIN players p ON p.id = wt.player_id
      WHERE ($1 OR wt.is_active = true)
      ORDER BY wt.day_of_week ASC NULLS LAST, wt.time ASC
    `,
      [showAll],
    );

    const weeklyTimes = result.rows.map((wt) => ({
      ...wt,
      // The UI uses 1-7 (Monday-Sunday); PostgreSQL uses 0-6 (Sunday-Saturday).
      weekday: wt.day_of_week === 0 ? 7 : wt.day_of_week,
    }));

    const activePlayers = new Set(
      weeklyTimes.map((wt) => wt.player?.id).filter(Boolean),
    );

    // Calculate schedule types
    const weekdaySchedules = weeklyTimes.filter(
      (wt) => wt.interval_days === null || wt.interval_days === undefined,
    );
    const intervalSchedules = weeklyTimes.filter(
      (wt) => wt.interval_days !== null && wt.interval_days !== undefined,
    );

    // Calculate average occurrences per week.
    // Weekly schedules count as 1 (or 0.5 for odd/even weeks).
    // An interval of N days occurs 7 / N times per week.
    const timesPerWeek = weeklyTimes.reduce((total, wt) => {
      if (wt.interval_days) {
        return total + 7 / Number(wt.interval_days);
      }

      const parity = wt.week_parity || "all";
      return total + (parity === "all" ? 1 : 0.5);
    }, 0);

    return {
      summary: {
        activePlayers: activePlayers.size,
        weekdaySchedules: weekdaySchedules.length,
        intervalSchedules: intervalSchedules.length,
        timesPerWeek: Number(timesPerWeek.toFixed(2)),
      },
      schedules: weeklyTimes,
    };
  } finally {
    client.release();
  }
});
