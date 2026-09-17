import { postgresPool } from "~~/server/lib/postgres";

// Manual balance entry (when Lyca SMS response can't be received via webhook)
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { balance, currency, raw_response } = body;

  if (balance === undefined || balance === null) {
    throw createError({ statusCode: 400, message: "balance is required" });
  }

  const client = await postgresPool.connect();
  try {
    const result = await client.query(
      `INSERT INTO cashcard_balances (balance, currency, raw_response)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [parseFloat(balance), currency || "SEK", raw_response || `Manuell inmatning: ${balance}`],
    );

    return { success: true, balance: result.rows[0] };
  } finally {
    client.release();
  }
});
