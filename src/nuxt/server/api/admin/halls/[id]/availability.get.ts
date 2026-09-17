/**
 * GET /api/admin/halls/:id/availability?date=YYYY-MM-DD
 *
 * Returns available time slots for a hall on a given date.
 * Supports both Court22 and Matchi-backed halls.
 *
 * Court22: uses the live court22-proxy-prod-apimgmt.azure-api.net API.
 * Matchi:  fetches /book/listSlots HTML and parses slot data.
 *
 * The response shape is deliberately aligned with the availability modal's
 * display needs.
 */
import { postgresPool } from "~~/server/lib/postgres";
import { Court22Client, type Court22Slot } from "~~/server/lib/court22";
import { MatchiClient, type MatchiTimeSlot } from "~~/server/lib/matchi";

/** Convert a UTC ISO datetime string to local HH:MM (Europe/Stockholm) */
function toLocalTime(utcIso: string): string {
  // Strip any sub-second precision for Date parsing
  const normalized = utcIso.replace(/(\.\d+)?Z$/, "Z");
  const d = new Date(normalized);
  return d.toLocaleTimeString("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default defineEventHandler(async (event) => {
  const hallId = getRouterParam(event, "id")!;
  const query = getQuery(event);
  const date =
    typeof query.date === "string"
      ? query.date
      : new Date().toISOString().slice(0, 10);

  // Fetch hall metadata
  const hallResult = await postgresPool.query(
    `SELECT
       h.id,
       h.name,
       h.booking_system,
       h.court22_venue_id,
       h.court22_slug,
       h.matchi_facility_id,
       h.matchi_sport_id,
       h.sport_id,
       s.name as sport_name
     FROM halls h
     JOIN sports s ON s.id = h.sport_id
     WHERE h.id = $1`,
    [hallId],
  );

  if (hallResult.rowCount === 0) {
    throw createError({ statusCode: 404, message: "Hall not found" });
  }

  const hall = hallResult.rows[0] as {
    id: string;
    name: string;
    booking_system: string | null;
    court22_venue_id: string | null;
    court22_slug: string | null;
    matchi_facility_id: string | null;
    matchi_sport_id: number;
    sport_id: string;
    sport_name: string;
  };

  if (hall.booking_system === "court22") {
    if (!hall.court22_venue_id) {
      return {
        hallId,
        hallName: hall.name,
        date,
        system: "court22",
        slots: [],
        error: "court22_venue_id saknas på hallen",
        fetchedAt: new Date().toISOString(),
      };
    }

    // Filter to only courts matching the hall's sport (e.g. "Padel")
    const client = new Court22Client();
    const rawSlots: Court22Slot[] = await client.getSlots(
      hall.court22_venue_id,
      date,
      hall.sport_name,
    );

    // Parse times that have at least one free court.
    // Court22 returns UTC ISO strings; convert to local (Europe/Stockholm) HH:MM.
    const slotMap = new Map<
      string,
      { time: string; courts: number; price: number }
    >();
    for (const slot of rawSlots) {
      if (slot.isBooked) continue;
      const localTime = toLocalTime(slot.startTime);
      const existing = slotMap.get(localTime);
      if (existing) {
        existing.courts += 1;
        existing.price = Math.min(existing.price, slot.price);
      } else {
        slotMap.set(localTime, {
          time: localTime,
          courts: 1,
          price: slot.price,
        });
      }
    }

    const slots = Array.from(slotMap.values()).sort((a, b) =>
      a.time.localeCompare(b.time),
    );

    return {
      hallId,
      hallName: hall.name,
      date,
      system: "court22",
      slots,
      fetchedAt: new Date().toISOString(),
    };
  }

  if (hall.booking_system === "matchi") {
    if (!hall.matchi_facility_id) {
      return {
        hallId,
        hallName: hall.name,
        date,
        system: "matchi",
        slots: [],
        error: "matchi_facility_id saknas på hallen",
        fetchedAt: new Date().toISOString(),
      };
    }

    // Pass the Matchi numeric sport ID (stored in halls.matchi_sport_id).
    // Defaults to 5 (Padel) if not set. Other known IDs: 1=Tennis, 2=Badminton, 3=Squash.
    const client = new MatchiClient();
    const result = await client.getAvailability(
      hall.matchi_facility_id,
      date,
      String(hall.matchi_sport_id ?? 5),
    );

    // Align Matchi slots to same shape as Court22 for the modal
    const slots = result.slots.map((s: MatchiTimeSlot) => ({
      time: s.time,
      courts: s.slotCount,
      // Matchi doesn't expose price in the listSlots endpoint, so we leave it as 0
      price: 0,
    }));

    return {
      hallId,
      hallName: hall.name,
      date,
      system: "matchi",
      slots,
      fetchedAt: result.fetchedAt,
    };
  }

  return {
    hallId,
    hallName: hall.name,
    date,
    system: null,
    slots: [],
    error: "Hall saknar bokningssystem",
    fetchedAt: new Date().toISOString(),
  };
});
