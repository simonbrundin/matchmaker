-- Drop the original unique constraint (allows nulls)
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_phone_key;

-- Allow phone and elo to be NULL
ALTER TABLE players ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE players ALTER COLUMN elo DROP NOT NULL;