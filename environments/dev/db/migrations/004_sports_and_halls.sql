-- 004_sports_and_halls.sql
-- Sports and halls tables for Court22 integration
-- Adds sport_id and hall_id FKs to weekly_times

-- ============================================================
-- 13. SPORTS (e.g. padel, tennis)
-- ============================================================
CREATE TABLE IF NOT EXISTS sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,             -- 'Padel', 'Tennis'
    slug TEXT UNIQUE NOT NULL,             -- 'padel', 'tennis'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sports_slug ON sports(slug);

-- Seed initial sports
INSERT INTO sports (name, slug)
SELECT 'Padel', 'padel'
WHERE NOT EXISTS (SELECT 1 FROM sports WHERE slug = 'padel');

INSERT INTO sports (name, slug)
SELECT 'Tennis', 'tennis'
WHERE NOT EXISTS (SELECT 1 FROM sports WHERE slug = 'tennis');

DROP TRIGGER IF EXISTS update_sports_updated_at ON sports;
CREATE TRIGGER update_sports_updated_at
    BEFORE UPDATE ON sports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 14. HALLS (sport facilities)
-- ============================================================
CREATE TABLE IF NOT EXISTS halls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,                          -- 'Borlänge Padelcenter'
    slug TEXT,                                   -- 'borlange-padelcenter'
    court22_venue_id TEXT,                       -- identifier used by Court22 (filled when known)
    court22_slug TEXT,                           -- url slug on court22.com if known
    address TEXT,
    city TEXT,
    default_court_duration_minutes INTEGER NOT NULL DEFAULT 90,
    default_capacity INTEGER NOT NULL DEFAULT 4, -- players per booking
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_halls_sport ON halls(sport_id);
CREATE INDEX IF NOT EXISTS idx_halls_active ON halls(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_halls_sport_court22_venue
    ON halls(sport_id, court22_venue_id)
    WHERE court22_venue_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_halls_updated_at ON halls;
CREATE TRIGGER update_halls_updated_at
    BEFORE UPDATE ON halls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 15. WEEKLY_TIMES — link to sport and hall
-- ============================================================
-- Columns are nullable so existing rows keep working until the
-- admin re-saves them. New rows are required to set both.
ALTER TABLE weekly_times
    ADD COLUMN IF NOT EXISTS sport_id UUID REFERENCES sports(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS hall_id  UUID REFERENCES halls(id)  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_weekly_times_sport ON weekly_times(sport_id);
CREATE INDEX IF NOT EXISTS idx_weekly_times_hall  ON weekly_times(hall_id);
CREATE INDEX IF NOT EXISTS idx_weekly_times_hall_time
    ON weekly_times(hall_id, day_of_week, time)
    WHERE is_active = true;
