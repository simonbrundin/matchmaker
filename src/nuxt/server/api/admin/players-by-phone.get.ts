import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const phone = String(getQuery(event).phone || "");
  if (!phone) {
    throw createError({ statusCode: 400, message: "phone required" });
  }

  const result = await postgresPool.query(
    `SELECT id, first_name, last_name, phone, elo
     FROM players
     WHERE phone = $1`,
    [phone],
  );

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, message: "Player not found" });
  }

  return { player: result.rows[0] };
});
