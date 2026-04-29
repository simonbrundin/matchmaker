-- Make day_of_week nullable for interval-based schedules
-- Kör denna fil i Supabase SQL Editor

ALTER TABLE weekly_times ALTER COLUMN day_of_week DROP NOT NULL;

-- Verifiera:
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'weekly_times' AND column_name = 'day_of_week';