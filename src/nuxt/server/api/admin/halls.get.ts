import { postgresPool } from "~~/server/lib/postgres";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const sportId = typeof query.sport_id === "string" ? query.sport_id : null;

  const sql = `
    SELECT
      h.id,
      h.sport_id,
      h.name,
      h.slug,
      h.booking_system,
      h.court22_venue_id,
      h.court22_slug,
      h.matchi_url,
      h.matchi_facility_id,
      h.address,
      h.city,
      h.default_court_duration_minutes,
      h.default_capacity,
      h.is_active,
      h.notes,
      h.created_at,
      h.updated_at,
      json_build_object(
        'id', s.id,
        'name', s.name,
        'slug', s.slug
      ) as sport
    FROM halls h
    JOIN sports s ON s.id = h.sport_id
    WHERE ($1::uuid IS NULL OR h.sport_id = $1::uuid)
      AND h.is_active = true
    ORDER BY s.name ASC, h.name ASC
  `;
  const result = await postgresPool.query(sql, [sportId]);
  return { halls: result.rows };
});
