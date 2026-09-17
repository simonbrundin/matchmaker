import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async () => {
  const client = await postgresPool.connect();
  try {
    // Get the latest balance
    const balanceResult = await client.query(
      `SELECT * FROM cashcard_balances ORDER BY checked_at DESC LIMIT 1`,
    );
    const latestBalance = balanceResult.rows[0] ?? null;

    // Get config
    const configResult = await client.query(
      `SELECT * FROM cashcard_config LIMIT 1`,
    );
    const config = configResult.rows[0] ?? null;

    return {
      balance: latestBalance,
      config,
      lastChecked: latestBalance?.checked_at || null,
    };
  } finally {
    client.release();
  }
});
