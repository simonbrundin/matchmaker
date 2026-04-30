-- Add invite_round column to messages table
-- Run this in Supabase SQL Editor

ALTER TABLE messages ADD COLUMN IF NOT EXISTS invite_round INTEGER;