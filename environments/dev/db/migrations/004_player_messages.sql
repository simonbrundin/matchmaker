-- Player Messages: Store all SMS communications per player
-- This extends the messages table defined in init.sql to support
-- viewing all messages for a specific player

-- Ensure messages table exists (from init.sql, but idempotent)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_received_at TIMESTAMPTZ,
    response TEXT
);

-- Indexes for efficient querying by player
CREATE INDEX IF NOT EXISTS idx_messages_player_id ON messages(player_id);
CREATE INDEX IF NOT EXISTS idx_messages_player_direction ON messages(player_id, direction);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);

-- Index for booking-related messages (already exists but ensure it)
CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
