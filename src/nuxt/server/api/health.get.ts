import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async () => {
  try {
    await postgresPool.query("SELECT 1");
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    };
  } catch (error) {
    return {
      status: "error",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: String(error),
    };
  }
});
