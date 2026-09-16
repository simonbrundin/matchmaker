import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, "id");
  if (!playerId) {
    throw createError({ statusCode: 400, message: "id required" });
  }

  const result = await postgresPool.query(
    "DELETE FROM players WHERE id = $1 RETURNING id",
    [playerId],
  );

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, message: "Player not found" });
  }

  return { success: true };
});
