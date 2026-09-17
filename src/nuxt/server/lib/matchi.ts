/**
 * Matchi (https://www.matchi.se) booking-system integration.
 *
 * Live endpoints (reverse-engineered via Chrome DevTools):
 *   Search venues:  POST /facilities/findFacilities
 *   List slots:     GET  /book/listSlots?facility={id}&date={YYYY-MM-DD}&sport={sportId}
 *
 * The slot-list endpoint returns HTML — see parseMatchiSlots() for the format.
 */

import { postgresPool } from "./postgres";

export interface MatchiHallLookup {
  id: string;
  name: string;
  sport_id: string;
  sport_slug: string;
  sport_name: string;
  matchi_url: string | null;
  matchi_facility_id: string | null;
  /** Matchi numeric sport ID (5=Padel, 1=Tennis, 2=Badminton, 3=Squash, ...) */
  matchi_sport_id: number;
  default_capacity: number;
  default_court_duration_minutes: number;
}

export interface AvailabilityResult {
  available: boolean;
  source: "matchi" | "stub" | "cache";
  reason?: string;
  checkedAt: string;
}

/** A single time block returned by Matchi's listSlots endpoint */
export interface MatchiTimeSlot {
  /** Formatted time, e.g. "13:00" */
  time: string;
  /** Unix ms timestamp embedded in data-target, e.g. 1789642800000 */
  startTime: number;
  /** Number of bookable courts available at this time */
  slotCount: number;
  /** Raw slot UUIDs — can be used for deeper booking integration later */
  slotIds: string[];
}

export interface MatchiAvailabilityResult {
  facilityId: string;
  date: string;
  slots: MatchiTimeSlot[];
  fetchedAt: string;
}

const STUB_NOTICE =
  "[matchi] No live integration configured — assuming the slot is available. " +
  "Replace checkAvailability() in server/lib/matchi.ts once Matchi credentials exist.";

let warnedAboutStub = false;

export class MatchiClient {
  async getHall(hallId: string): Promise<MatchiHallLookup | null> {
    const result = await postgresPool.query(
      `SELECT
         h.id,
         h.name,
         h.sport_id,
         h.matchi_url,
         h.matchi_facility_id,
         h.matchi_sport_id,
         h.default_capacity,
         h.default_court_duration_minutes,
         s.slug  AS sport_slug,
         s.name  AS sport_name
       FROM halls h
       JOIN sports s ON s.id = h.sport_id
       WHERE h.id = $1
         AND h.is_active = true
         AND h.booking_system = 'matchi'`,
      [hallId],
    );
    if (result.rowCount === 0) return null;
    return result.rows[0] as MatchiHallLookup;
  }

  /**
   * Returns true when at least one court in the Matchi-backed hall is
   * bookable for the given sport at (date, time).
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
        reason: `Hall ${hallId} not found, inactive, or not a Matchi hall`,
        checkedAt: new Date().toISOString(),
      };
    }

    if (!hall.matchi_facility_id) {
      if (!warnedAboutStub) {
        console.warn(STUB_NOTICE);
        warnedAboutStub = true;
      }
      return {
        available: true,
        source: "stub",
        reason: "stub: matchi_facility_id not set — assumed available",
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const availability = await this.getAvailability(
        hall.matchi_facility_id,
        date,
        String(hall.matchi_sport_id),
      );

      // Find the time block that matches the requested time
      const normalizedTime = time.trim().toLowerCase().replace(":", "");
      const slot = availability.slots.find((s) => {
        const slotTime = s.time.replace(":", "").trim();
        return slotTime === normalizedTime;
      });

      if (!slot) {
        return {
          available: false,
          source: "matchi",
          reason: `Ingen ledig tid för ${time} (inga slots returnerades)`,
          checkedAt: availability.fetchedAt,
        };
      }

      return {
        available: slot.slotCount > 0,
        source: "matchi",
        reason:
          slot.slotCount > 0
            ? `${slot.slotCount} ban${slot.slotCount === 1 ? "a" : "or"} tillgänglig${slot.slotCount === 1 ? "" : "a"} kl. ${slot.time}`
            : `Ingen ledig bana kl. ${slot.time}`,
        checkedAt: availability.fetchedAt,
      };
    } catch (err) {
      console.error(`[matchi] checkAvailability failed:`, err);
      // Fail-open so we don't block SMS sends on Matchi API errors
      return {
        available: true,
        source: "stub",
        reason: `Matchi API misslyckades: ${err instanceof Error ? err.message : String(err)} — antog ledig`,
        checkedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch and parse available slots for a Matchi facility on a given date.
   */
  async getAvailability(
    facilityId: string,
    date: string,
    sportId?: string,
  ): Promise<MatchiAvailabilityResult> {
    const html = await this.fetchSlotHtml(facilityId, date, sportId);
    return {
      facilityId,
      date,
      slots: parseMatchiSlots(html),
      fetchedAt: new Date().toISOString(),
    };
  }

  private async fetchSlotHtml(
    facilityId: string,
    date: string,
    sportId?: string,
  ): Promise<string> {
    // Matchi requires all these params even if empty
    const params = new URLSearchParams({
      wl: "",
      facility: facilityId,
      date,
      ...(sportId ? { sport: sportId } : {}),
      week: "",
      year: "",
    });

    const res = await fetch(
      `https://www.matchi.se/book/listSlots?${params.toString()}`,
      {
        headers: {
          Referer: "https://www.matchi.se/facilities/baldershallen",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
          Accept: "text/html",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Matchi /book/listSlots returned HTTP ${res.status}`);
    }

    return res.text();
  }
}

// ─── HTML parser ───────────────────────────────────────────────────────────

/**
 * Parse Matchi's listSlots HTML response into structured MatchiTimeSlot objects.
 *
 * The HTML contains buttons like:
 *   <button class="btn btn-slot collapse-trigger" ...
 *            data-target="#531_1789644600000"
 *            data-slots="[&quot;uuid1&quot;,&quot;uuid2&quot;,&quot;uuid3&quot;]">
 *     13
 *     <sup>30</sup>
 *   </button>
 *
 * We use one combined regex to extract data-target, data-slots, hour, and
 * minutes in a single pass.
 */
export function parseMatchiSlots(html: string): MatchiTimeSlot[] {
  const slots: MatchiTimeSlot[] = [];

  // Regex matches a slot button in one pass:
  // - group 1: facility ID (digits)
  // - group 2: Unix ms timestamp
  // - group 3: data-slots attribute value (everything up to the closing ")
  // - group 4: hour (digits before <sup>)
  // - group 5: minutes (digits inside <sup>)
  const btnRe =
    /data-target="#(\d+)_(\d+)"[^]*?data-slots="([^"]*)"[^]*?>\s*(\d+)\s*<sup>(\d+)<\/sup>/gi;
  let m: RegExpExecArray | null;
  while ((m = btnRe.exec(html)) !== null) {
    const rawSlots = m[3] ?? "";
    const unescaped = rawSlots.replace(/&quot;/g, '"');
    let slotIds: string[] = [];
    try {
      slotIds = JSON.parse(unescaped);
    } catch {
      /* skip malformed */
    }

    const hour = (m[4] ?? "00").padStart(2, "0");
    const minute = (m[5] ?? "00").padStart(2, "0");
    slots.push({
      time: `${hour}:${minute}`,
      startTime: parseInt(m[2] ?? "0", 10),
      slotCount: slotIds.length,
      slotIds,
    });
  }

  return slots;
}

let matchiClient: MatchiClient | null = null;

export function getMatchiClient(): MatchiClient {
  if (!matchiClient) matchiClient = new MatchiClient();
  return matchiClient;
}
