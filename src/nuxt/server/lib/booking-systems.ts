/**
 * Unified booking-system availability check.
 *
 * Dispatches to Court22 or Matchi based on the hall's `booking_system` column.
 * If the hall has no booking system linked, we allow the SMS through
 * (matches the original behaviour — no verification possible).
 */

import { postgresPool } from "./postgres";
import {
  getCourt22Client,
  type AvailabilityResult as Court22Result,
} from "./court22";
import {
  getMatchiClient,
  type AvailabilityResult as MatchiResult,
} from "./matchi";

export type BookingSystem = "court22" | "matchi";

export interface HallBookingInfo {
  id: string;
  name: string;
  booking_system: BookingSystem | null;
  sport_id: string;
  sport_name: string;
  sport_slug: string;
}

export type AvailabilityResult = (Court22Result | MatchiResult) & {
  system: BookingSystem | null;
};

let cachedCourt22Warning = false;
let cachedMatchiWarning = false;

/**
 * Resolve which booking system the hall uses and then run the matching
 * availability check. Returns `{ ok: true }` when the slot is bookable
 * or when the hall has no booking system linked (in which case no
 * verification is performed).
 */
export async function isHallAvailable(
  hallId: string | null,
  date: string,
  time: string,
): Promise<{ ok: boolean; reason?: string; system: BookingSystem | null }> {
  if (!hallId) {
    return {
      ok: true,
      reason: "no hall linked — availability not checked",
      system: null,
    };
  }

  const hall = await getHallBookingInfo(hallId);
  if (!hall) {
    return {
      ok: false,
      reason: `Hall ${hallId} not found or inactive`,
      system: null,
    };
  }

  if (!hall.booking_system) {
    return {
      ok: true,
      reason: `hall ${hall.name} has no booking_system linked — availability not checked`,
      system: null,
    };
  }

  let result: Court22Result | MatchiResult;
  if (hall.booking_system === "court22") {
    result = await getCourt22Client().checkAvailability(hallId, date, time);
    if (result.source === "stub" && !cachedCourt22Warning) {
      cachedCourt22Warning = true;
    }
  } else if (hall.booking_system === "matchi") {
    result = await getMatchiClient().checkAvailability(hallId, date, time);
    if (result.source === "stub" && !cachedMatchiWarning) {
      cachedMatchiWarning = true;
    }
  } else {
    return {
      ok: false,
      reason: `unknown booking system "${hall.booking_system}" on hall ${hall.name}`,
      system: null,
    };
  }

  return {
    ok: result.available,
    reason: result.reason,
    system: hall.booking_system,
  };
}

async function getHallBookingInfo(
  hallId: string,
): Promise<HallBookingInfo | null> {
  const result = await postgresPool.query(
    `SELECT
       h.id,
       h.name,
       h.booking_system,
       h.sport_id,
       s.name AS sport_name,
       s.slug AS sport_slug
     FROM halls h
     JOIN sports s ON s.id = h.sport_id
     WHERE h.id = $1 AND h.is_active = true`,
    [hallId],
  );
  if (result.rowCount === 0) return null;
  return result.rows[0] as HallBookingInfo;
}
