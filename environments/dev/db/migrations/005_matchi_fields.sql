-- 005_matchi_fields.sql
-- Add Matchi booking system fields to halls so we can support multiple
-- booking platforms per hall (Court22, Matchi, etc.).

ALTER TABLE halls
    ADD COLUMN IF NOT EXISTS matchi_url           TEXT,
    ADD COLUMN IF NOT EXISTS matchi_facility_id   TEXT,
    ADD COLUMN IF NOT EXISTS booking_system       TEXT;

-- Drop the strict unique on (sport_id, court22_venue_id) and replace with a
-- per-booking-system uniqueness rule (one matchi facility id per sport, etc.).
ALTER TABLE halls DROP CONSTRAINT IF EXISTS halls_matchi_facility_unique;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'halls_matchi_facility_unique'
    ) THEN
        ALTER TABLE halls
            ADD CONSTRAINT halls_matchi_facility_unique
            UNIQUE (sport_id, matchi_facility_id);
    END IF;
END$$;

-- Booking system discriminator. NULL means "no system linked yet" and the
-- availability check will simply allow the SMS through (same as before).
ALTER TABLE halls
    DROP CONSTRAINT IF EXISTS halls_booking_system_check;
ALTER TABLE halls
    ADD CONSTRAINT halls_booking_system_check
    CHECK (booking_system IS NULL OR booking_system IN ('court22', 'matchi'));

-- Helpful index when filtering halls by system.
CREATE INDEX IF NOT EXISTS idx_halls_booking_system
    ON halls(booking_system)
    WHERE booking_system IS NOT NULL;

-- Backfill: every hall that already has Court22 fields gets tagged as such.
UPDATE halls
   SET booking_system = 'court22'
 WHERE booking_system IS NULL
   AND (court22_venue_id IS NOT NULL OR court22_slug IS NOT NULL);
