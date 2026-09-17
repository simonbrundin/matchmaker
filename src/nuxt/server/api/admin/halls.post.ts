import { postgresPool } from "~~/server/lib/postgres";

interface CreateHallInput {
  sport_id?: string;
  name?: string;
  slug?: string;
  booking_system?: "court22" | "matchi" | null | "";
  court22_venue_id?: string;
  court22_slug?: string;
  matchi_url?: string;
  matchi_facility_id?: string;
  address?: string;
  city?: string;
  default_court_duration_minutes?: number;
  default_capacity?: number;
  notes?: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateHallInput>(event);

  if (!body.sport_id) {
    throw createError({ statusCode: 400, message: "sport_id required" });
  }
  if (!body.name) {
    throw createError({ statusCode: 400, message: "name required" });
  }

  const client = await postgresPool.connect();
  try {
    // Confirm the sport exists.
    const sportCheck = await client.query(
      `SELECT id FROM sports WHERE id = $1`,
      [body.sport_id],
    );
    if (sportCheck.rowCount === 0) {
      throw createError({ statusCode: 400, message: "sport_id not found" });
    }

    const result = await client.query(
      `INSERT INTO halls (
        sport_id, name, slug, booking_system,
        court22_venue_id, court22_slug,
        matchi_url, matchi_facility_id,
        address, city, default_court_duration_minutes, default_capacity, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        body.sport_id,
        body.name,
        body.slug || null,
        !body.booking_system ? null : body.booking_system,
        body.court22_venue_id || null,
        body.court22_slug || null,
        body.matchi_url || null,
        body.matchi_facility_id || null,
        body.address || null,
        body.city || null,
        body.default_court_duration_minutes || 90,
        body.default_capacity || 4,
        body.notes || null,
      ],
    );
    return { success: true, hall: result.rows[0] };
  } finally {
    client.release();
  }
});
