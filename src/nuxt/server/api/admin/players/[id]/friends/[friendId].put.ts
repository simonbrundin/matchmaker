import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, "id");
  const friendId = getRouterParam(event, "friendId");

  if (!playerId || !friendId || playerId === friendId) {
    throw createError({ statusCode: 400, message: "Ogiltiga spelar-id:n" });
  }

  const client = await postgresPool.connect();
  try {
    await client.query(
      `INSERT INTO friends (player_id, friend_id)
       VALUES ($1, $2)
       ON CONFLICT (player_id, friend_id) DO NOTHING`,
      [playerId, friendId],
    );

    return { success: true };
  } finally {
    client.release();
  }
});
