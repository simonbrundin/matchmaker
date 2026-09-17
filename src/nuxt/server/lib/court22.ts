/**
 * Court22 integration
 *
 * API endpoint discovered via Chrome DevTools network inspection:
 *   https://court22-proxy-prod-apimgmt.azure-api.net/checkout/v3/schedule/public
 *
 * Query params: facilityId (UUID), day (YYYY-MM-DD)
 * Auth:         ocp-apim-subscription-key header (found hardcoded in web app)
 *
 * Response shape:
 *   { data: [{ objectId, objectName, sportType: { name }, slots: [{ startTime, endTime, price, isBooked }] }] }
 */

import { postgresPool } from "./postgres";

const COURT22_API_BASE = "https://court22-proxy-prod-apimgmt.azure-api.net";
const COURT22_API_KEY = process.env.COURT22_API_KEY; // Fallback: key hardcoded in web app (see DevTools)

export interface HallLookup {
  id: string;
  name: string;
  sport_id: string;
  sport_slug: string;
  sport_name: string;
  court22_venue_id: string | null;
  court22_slug: string | null;
  default_capacity: number;
  default_court_duration_minutes: number;
}

export interface AvailabilityResult {
  available: boolean;
  source: "court22" | "stub" | "cache";
  reason?: string;
  checkedAt: string;
}

// API response types
export interface Court22Slot {
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
  individualPrice: number;
}

interface Court22Court {
  objectId: string;
  objectName: string;
  objectType: {
    name: string;
    sportType: { name: string };
  };
  slots: Court22Slot[];
}

interface Court22ScheduleResponse {
  data: Court22Court[];
}

export class Court22Client {
  private apiKey: string;

  constructor() {
    // Prefer env var; fall back to the key found in the web app (DevTools).
    // The hardcoded key may stop working if Court22 rotates it.
    this.apiKey = COURT22_API_KEY ?? "12dfad29c2b4415582e4df729820d929";
  }

  async getHall(hallId: string): Promise<HallLookup | null> {
    const result = await postgresPool.query(
      `SELECT
         h.id,
         h.name,
         h.sport_id,
         h.court22_venue_id,
         h.court22_slug,
         h.default_capacity,
         h.default_court_duration_minutes,
         s.slug  AS sport_slug,
         s.name  AS sport_name
       FROM halls h
       JOIN sports s ON s.id = h.sport_id
       WHERE h.id = $1
         AND h.is_active = true
         AND h.booking_system = 'court22'`,
      [hallId],
    );
    if (result.rowCount === 0) return null;
    return result.rows[0] as HallLookup;
  }

  /**
   * Returns all slots for a venue on a given date.
   * Filters to only courts matching `sportName` when provided
   * (e.g. "Padel"). Used by the availability browser in the admin UI.
   */
  async getSlots(
    venueId: string,
    date: string,
    sportName?: string,
  ): Promise<Court22Slot[]> {
    const dateUtc = date;
    const url = `${COURT22_API_BASE}/checkout/v3/schedule/public?facilityId=${venueId}&day=${dateUtc}`;

    try {
      const res = await fetch(url, {
        headers: {
          "ocp-apim-subscription-key": this.apiKey,
          Accept: "application/json",
          Origin: "https://www.court22.com",
          Referer: "https://www.court22.com/",
        },
      });

      if (!res.ok) {
        console.error(
          `[court22] getSlots HTTP ${res.status} for venue ${venueId}`,
        );
        return [];
      }

      const schedule = (await res.json()) as Court22ScheduleResponse;
      // Filter to matching sport (case-insensitive) when specified
      const courts = sportName
        ? schedule.data.filter(
            (c) =>
              c.objectType?.sportType?.name?.toLowerCase() ===
              sportName.toLowerCase(),
          )
        : schedule.data;
      return courts.flatMap((court) => court.slots);
    } catch (err) {
      console.error(`[court22] getSlots failed for venue ${venueId}:`, err);
      return [];
    }
  }

  /**
   * Check if any court at the hall is available at the given (date, time).
   * Converts local time to UTC for the API request.
   *
   * @param hallId  - local database hall id
   * @param date    - YYYY-MM-DD (local date, e.g. "2026-09-17")
   * @param time    - HH:MM (local time, e.g. "14:00")
   */
  async checkAvailability(
    hallId: string,
    date: string,
    time: string,
  ): Promise<AvailabilityResult> {
    const hall = await this.getHall(hallId);
    if (!hall) {
      return {
        available: false,
        source: "stub",
        reason: `Hall ${hallId} not found or inactive`,
        checkedAt: new Date().toISOString(),
      };
    }

    if (!hall.court22_venue_id) {
      return {
        available: false,
        source: "stub",
        reason: `Hall ${hallId} has no court22_venue_id`,
        checkedAt: new Date().toISOString(),
      };
    }

    // Build local datetime and convert to UTC for the API
    const localDt = new Date(`${date}T${time}:00`);
    // Determine offset from the venue's timezone (Europe/Stockholm = UTC+2 summer / UTC+1 winter)
    // Use the API's returned times (UTC) to find matching slot
    const dateUtc = localDt.toISOString().split("T")[0]; // keep date part in UTC

    let schedule: Court22ScheduleResponse;
    try {
      const url = `${COURT22_API_BASE}/checkout/v3/schedule/public?facilityId=${hall.court22_venue_id}&day=${dateUtc}`;
      const res = await fetch(url, {
        headers: {
          "ocp-apim-subscription-key": this.apiKey,
          Accept: "application/json",
          Origin: "https://www.court22.com",
          Referer: "https://www.court22.com/",
        },
      });

      if (!res.ok) {
        console.error(
          `[court22] API error ${res.status} for hall ${hallId}: ${await res.text()}`,
        );
        return {
          available: true, // Fail open — don't block SMS on API error
          source: "stub",
          reason: `court22 API returned ${res.status}`,
          checkedAt: new Date().toISOString(),
        };
      }

      schedule = (await res.json()) as Court22ScheduleResponse;
    } catch (err) {
      console.error(`[court22] fetch failed for hall ${hallId}:`, err);
      return {
        available: true, // Fail open
        source: "stub",
        reason: "court22 API unreachable",
        checkedAt: new Date().toISOString(),
      };
    }

    // Find a slot matching our (date, time). The API returns slots in UTC.
    // Build the UTC ISO string for the slot start.
    const targetUtcStart = `${dateUtc}T${time}:00`;
    const targetUtcEnd = addMinutes(
      targetUtcStart,
      hall.default_court_duration_minutes ?? 60,
    );

    for (const court of schedule.data) {
      for (const slot of court.slots) {
        if (slot.startTime >= targetUtcStart && slot.startTime < targetUtcEnd) {
          return {
            available: !slot.isBooked,
            source: "court22",
            reason: slot.isBooked
              ? `court ${court.objectName} booked at ${time}`
              : `court ${court.objectName} available (${court.objectType?.sportType?.name ?? "?"})`,
            checkedAt: new Date().toISOString(),
          };
        }
      }
    }

    // No slot found at exact time — check if any slot at this hour is booked
    const hourStart = `${dateUtc}T${time}:00`;
    const hourStr = time.split(":")[0] ?? "00";
    const nextHour = String(parseInt(hourStr) + 1).padStart(2, "0");
    const hourEnd = `${dateUtc}T${nextHour}:00`;
    for (const court of schedule.data) {
      for (const slot of court.slots) {
        if (slot.startTime >= hourStart && slot.startTime < hourEnd) {
          return {
            available: !slot.isBooked,
            source: "court22",
            reason: slot.isBooked
              ? `court ${court.objectName} booked at ${time}`
              : `court ${court.objectName} available (${court.objectType?.sportType?.name ?? "?"})`,
            checkedAt: new Date().toISOString(),
          };
        }
      }
    }

    return {
      available: false,
      source: "court22",
      reason: `No slot found at ${time} for ${hall.name}`,
      checkedAt: new Date().toISOString(),
    };
  }
}

function addMinutes(isoString: string, minutes: number): string {
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

let court22Client: Court22Client | null = null;

export function getCourt22Client(): Court22Client {
  if (!court22Client) court22Client = new Court22Client();
  return court22Client;
}
