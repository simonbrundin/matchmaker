import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const firstName = body.first_name || body.name;

  if (!body.phone) {
    throw createError({ statusCode: 400, message: "phone required" });
  }
  if (!firstName) {
    throw createError({
      statusCode: 400,
      message: "first_name or name required",
    });
  }

  try {
    const result = await postgresPool.query(
      `INSERT INTO players (phone, first_name, last_name, elo)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [body.phone, firstName, body.last_name || null, body.elo || 1200],
    );

    return { success: true, player: result.rows[0] };
  } catch (error: any) {
    if (error.code === "23505") {
      throw createError({
        statusCode: 409,
        message: "Player with this phone already exists",
      });
    }
    throw createError({ statusCode: 400, message: error.message });
  }
});
