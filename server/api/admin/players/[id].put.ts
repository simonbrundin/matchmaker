import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, "id");
  if (!playerId) {
    throw createError({ statusCode: 400, message: "id required" });
  }

  const body = await readBody(event);
  const result = await postgresPool.query(
    `UPDATE players
     SET first_name = COALESCE($1, first_name),
         last_name = $2,
         phone = COALESCE($3, phone),
         elo = COALESCE($4, elo),
         is_active = COALESCE($5, is_active)
     WHERE id = $6
     RETURNING *`,
    [
      body.first_name ?? body.name ?? null,
      body.last_name ?? null,
      body.phone ?? null,
      body.elo ?? null,
      body.is_active ?? null,
      playerId,
    ],
  );

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, message: "Player not found" });
  }

  return { success: true, player: result.rows[0] };
});
