import { postgresPool } from "~~/server/lib/postgres";

interface UpdateHallInput {
  sport_id?: string;
  name?: string;
  slug?: string | null;
  booking_system?: "court22" | "matchi" | null | "";
  court22_venue_id?: string | null;
  court22_slug?: string | null;
  matchi_url?: string | null;
  matchi_facility_id?: string | null;
  address?: string | null;
  city?: string | null;
  default_court_duration_minutes?: number;
  default_capacity?: number;
  is_active?: boolean;
  notes?: string | null;
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "id required" });
  }

  const body = await readBody<UpdateHallInput>(event);

  const client = await postgresPool.connect();
  try {
    // Validate the new sport/hall combination if either is changing.
    const effectiveSportId = body.sport_id;
    if (effectiveSportId !== undefined || body.court22_venue_id !== undefined) {
      const check = await client.query(
        `SELECT sport_id FROM halls WHERE id = $1`,
        [id],
      );
      if (check.rowCount === 0) {
        throw createError({ statusCode: 404, message: "hall not found" });
      }
      const currentSportId = check.rows[0].sport_id;
      const finalSportId = effectiveSportId ?? currentSportId;

      if (body.court22_venue_id) {
        const dup = await client.query(
          `SELECT id FROM halls
           WHERE sport_id = $1 AND court22_venue_id = $2 AND id <> $3`,
          [finalSportId, body.court22_venue_id, id],
        );
        if ((dup.rowCount ?? 0) > 0) {
          throw createError({
            statusCode: 400,
            message:
              "court22_venue_id already used by another hall in this sport",
          });
        }
      }
    }

    // Build a dynamic SET clause so we can accept partial updates.
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const set = (col: string, val: unknown) => {
      fields.push(`${col} = $${idx++}`);
      values.push(val);
    };

    if (body.sport_id !== undefined) set("sport_id", body.sport_id);
    if (body.name !== undefined) set("name", body.name);
    if (body.slug !== undefined) set("slug", body.slug);
    if (body.booking_system !== undefined)
      set("booking_system", !body.booking_system ? null : body.booking_system);
    if (body.court22_venue_id !== undefined)
      set("court22_venue_id", body.court22_venue_id);
    if (body.court22_slug !== undefined) set("court22_slug", body.court22_slug);
    if (body.matchi_url !== undefined) set("matchi_url", body.matchi_url);
    if (body.matchi_facility_id !== undefined)
      set("matchi_facility_id", body.matchi_facility_id);
    if (body.address !== undefined) set("address", body.address);
    if (body.city !== undefined) set("city", body.city);
    if (body.default_court_duration_minutes !== undefined)
      set(
        "default_court_duration_minutes",
        body.default_court_duration_minutes,
      );
    if (body.default_capacity !== undefined)
      set("default_capacity", body.default_capacity);
    if (body.is_active !== undefined) set("is_active", body.is_active);
    if (body.notes !== undefined) set("notes", body.notes);

    if (fields.length === 0) {
      throw createError({
        statusCode: 400,
        message: "no fields to update",
      });
    }

    values.push(id);
    const result = await client.query(
      `UPDATE halls SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (result.rowCount === 0) {
      throw createError({ statusCode: 404, message: "hall not found" });
    }

    return { success: true, hall: result.rows[0] };
  } finally {
    client.release();
  }
});
