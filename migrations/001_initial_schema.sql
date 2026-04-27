-- Matchmaker Database Schema
-- Kör denna fil i Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PLAYERS
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    elo INTEGER NOT NULL DEFAULT 1200,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_matches_played INTEGER NOT NULL DEFAULT 0
);

-- 2. WISHLIST_TIMES
CREATE TABLE IF NOT EXISTS wishlist_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    preferred_day INTEGER NOT NULL CHECK (preferred_day >= 0 AND preferred_day <= 6),
    preferred_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wishlist_player ON wishlist_times(player_id);

-- 3. UNAVAILABILITIES
CREATE TABLE IF NOT EXISTS unavailabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    ai_parsed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_unavailabilities_player ON unavailabilities(player_id);
CREATE INDEX idx_unavailabilities_dates ON unavailabilities(start_date, end_date);

-- 4. WEEKLY_TIMES (stående tider)
CREATE TABLE IF NOT EXISTS weekly_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_weekly_times_player ON weekly_times(player_id);
CREATE INDEX idx_weekly_times_active ON weekly_times(player_id) WHERE is_active = true;

-- 5. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 6. BOOKED_PLAYERS
CREATE TABLE IF NOT EXISTS booked_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined', 'waitlist')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response TEXT CHECK (response IN ('ja', 'nej', 'kanske', null)),
    invite_number INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_booked_players_booking ON booked_players(booking_id);
CREATE INDEX idx_booked_players_player ON booked_players(player_id);
CREATE INDEX idx_booked_players_status ON booked_players(status);

-- 7. FRIENDS
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, friend_id)
);

CREATE INDEX idx_friends_player ON friends(player_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);

-- 8. MESSAGES
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

CREATE INDEX idx_messages_player ON messages(player_id);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_direction ON messages(direction);

-- 9. AI_RESPONSE_SUGGESTIONS
CREATE TABLE IF NOT EXISTS ai_response_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    incoming_message TEXT NOT NULL,
    ai_suggested_response TEXT NOT NULL,
    ai_confidence FLOAT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved BOOLEAN CHECK (approved IN (true, false, null)),
    telegram_message_id BIGINT
);

CREATE INDEX idx_ai_suggestions_player ON ai_response_suggestions(player_id);
CREATE INDEX idx_ai_suggestions_approved ON ai_response_suggestions(approved);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();