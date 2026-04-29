-- Weekly Times Schedule Update
-- Kör denna fil i Supabase SQL Editor

-- Lägg till nya kolumner för flexibelt schema
ALTER TABLE weekly_times 
ADD COLUMN weekday INTEGER CHECK (weekday >= 1 AND weekday <= 7),
ADD COLUMN week_parity TEXT CHECK (week_parity IN ('all', 'odd', 'even')) DEFAULT 'all',
ADD COLUMN interval_days INTEGER,
ADD COLUMN start_date DATE;

-- Migrera gammal data: dag 0->1, dag 1->2, etc (old: 0=söndag, new: 1=måndag)
UPDATE weekly_times 
SET weekday = day_of_week + 1
WHERE day_of_week IS NOT NULL;

-- Uppdatera befintliga rader med standardvärden
UPDATE weekly_times 
SET week_parity = 'all' 
WHERE week_parity IS NULL;

-- Index för de nya kolumnerna
DROP INDEX IF EXISTS idx_weekly_times_weekday;
DROP INDEX IF EXISTS idx_weekly_times_active;
DROP INDEX IF EXISTS idx_weekly_times_interval;

CREATE INDEX idx_weekly_times_weekday ON weekly_times(weekday) WHERE weekday IS NOT NULL;
CREATE INDEX idx_weekly_times_active ON weekly_times(is_active) WHERE is_active = true;
CREATE INDEX idx_weekly_times_interval ON weekly_times(interval_days) WHERE interval_days IS NOT NULL;

-- Testa:
-- SELECT * FROM weekly_times LIMIT 10;
-- SELECT COUNT(*) as active_players, SUM(CASE WHEN weekday IS NOT NULL THEN 1 ELSE 0 END) as weekly_schedules FROM weekly_times WHERE is_active = true;