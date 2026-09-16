import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, "id");
  if (!playerId) {
    throw createError({ statusCode: 400, message: "Spelar-id krävs" });
  }

  const client = await postgresPool.connect();
  try {
    const result = await client.query(
      `SELECT p.id, p.first_name, p.last_name, p.elo
       FROM friends f
       JOIN players p ON p.id = f.friend_id
       WHERE f.player_id = $1
       ORDER BY p.first_name, p.last_name`,
      [playerId],
    );

    return { friends: result.rows };
  } finally {
    client.release();
  }
});
