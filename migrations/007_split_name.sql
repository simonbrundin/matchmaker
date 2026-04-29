-- Split name column into first_name and last_name
-- Kör denna fil i Supabase SQL Editor

-- Add new columns
ALTER TABLE players ADD COLUMN first_name TEXT;
ALTER TABLE players ADD COLUMN last_name TEXT;

-- Migrate existing data: copy 'name' to 'first_name'
UPDATE players SET first_name = name WHERE name IS NOT NULL;

-- Drop the old name column
ALTER TABLE players DROP COLUMN name;

-- Add NOT NULL constraint on first_name (after migration)
ALTER TABLE players ALTER COLUMN first_name SET NOT NULL;

-- Verifiera:
-- SELECT first_name, last_name FROM players LIMIT 10;