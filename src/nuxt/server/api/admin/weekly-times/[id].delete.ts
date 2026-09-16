import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const scheduleId = getRouterParam(event, "id");
  if (!scheduleId) {
    throw createError({ statusCode: 400, message: "id required" });
  }

  const result = await postgresPool.query(
    "DELETE FROM weekly_times WHERE id = $1 RETURNING id",
    [scheduleId],
  );

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, message: "weekly time not found" });
  }

  return { success: true };
});
