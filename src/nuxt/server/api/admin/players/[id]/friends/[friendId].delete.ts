import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const playerId = getRouterParam(event, "id");
  const friendId = getRouterParam(event, "friendId");

  if (!playerId || !friendId) {
    throw createError({ statusCode: 400, message: "Spelar-id krävs" });
  }

  const client = await postgresPool.connect();
  try {
    await client.query(
      "DELETE FROM friends WHERE player_id = $1 AND friend_id = $2",
      [playerId, friendId],
    );

    return { success: true };
  } finally {
    client.release();
  }
});
