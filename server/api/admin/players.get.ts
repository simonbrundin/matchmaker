import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const searchTerm =
    typeof query.search === "string" ? query.search.trim() : "";
  const onlyActive = query.active === "true";
  const searchPattern = `%${searchTerm}%`;
  const result = await postgresPool.query(
    `SELECT * FROM players
     WHERE ($1 = false OR is_active = true)
       AND ($2 = '' OR first_name ILIKE $3 OR last_name ILIKE $3 OR phone ILIKE $3)
     ORDER BY last_name NULLS LAST, first_name`,
    [onlyActive, searchTerm, searchPattern],
  );

  return { players: result.rows };
});
