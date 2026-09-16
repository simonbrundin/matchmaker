import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, "id");
  const body = await readBody<{ name?: string }>(event);
  const searchTerm = body.name?.trim();

  if (!playerId || !searchTerm || searchTerm.length < 2) {
    throw createError({
      statusCode: 400,
      message: "Namnet måste innehålla minst 2 tecken",
    });
  }

  const client = await postgresPool.connect();
  try {
    const result = await client.query(
      `SELECT p.id, p.first_name, p.last_name, p.elo
       FROM players p
       WHERE p.id <> $1
         AND p.is_active = true
         AND (p.first_name ILIKE $2 OR p.last_name ILIKE $2)
         AND NOT EXISTS (
           SELECT 1 FROM friends f
           WHERE f.player_id = $1 AND f.friend_id = p.id
         )
       ORDER BY p.first_name, p.last_name
       LIMIT 20`,
      [playerId, `%${searchTerm}%`],
    );

    return { players: result.rows };
  } finally {
    client.release();
  }
});
