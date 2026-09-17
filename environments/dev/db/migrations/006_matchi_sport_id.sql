-- Add matchi_sport_id column to halls table
-- Matchi sport IDs: 5=Padel, 1=Tennis, 2=Badminton, 3=Squash, etc.
-- Defaults to 5 (Padel) since most matchmaker halls are padel venues.

ALTER TABLE halls ADD COLUMN matchi_sport_id INTEGER DEFAULT 5;
