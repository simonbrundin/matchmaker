import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async () => {
   const result = await postgresPool.query(
      `SELECT id, name, slug, is_active, created_at, updated_at
     FROM sports
     ORDER BY name ASC`,
   );
   return { sports: result.rows };
});
