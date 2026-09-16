CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    elo INTEGER NOT NULL DEFAULT 1200,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_matches_played INTEGER NOT NULL DEFAULT 0,
    last_contacted_at TIMESTAMPTZ
);

CREATE TABLE wishlist_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    preferred_day INTEGER NOT NULL CHECK (preferred_day BETWEEN 0 AND 6),
    preferred_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE unavailabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    ai_parsed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unavailabilities_valid_range CHECK (end_date >= start_date)
);

CREATE TABLE weekly_times (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    week_parity TEXT NOT NULL DEFAULT 'all',
    interval_days INTEGER,
    start_date DATE,
    CONSTRAINT weekly_times_valid_parity CHECK (week_parity IN ('all', 'odd', 'even')),
    CONSTRAINT weekly_times_valid_schedule CHECK (
        (interval_days IS NULL AND day_of_week IS NOT NULL)
        OR (interval_days IS NOT NULL AND day_of_week IS NULL)
    ),
    CONSTRAINT weekly_times_valid_interval CHECK (interval_days IS NULL OR interval_days > 0)
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    host_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    host_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booked_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'confirmed', 'declined', 'waitlist')),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response TEXT CHECK (response IN ('ja', 'nej', 'kanske')),
    invite_number INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, friend_id),
    CONSTRAINT friends_not_self CHECK (player_id <> friend_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
    content TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_received_at TIMESTAMPTZ,
    response TEXT,
    invite_round INTEGER
);

CREATE TABLE ai_response_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    incoming_message TEXT NOT NULL,
    ai_suggested_response TEXT NOT NULL,
    ai_confidence DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved BOOLEAN,
    telegram_message_id BIGINT
);

CREATE INDEX idx_wishlist_player ON wishlist_times(player_id);
CREATE INDEX idx_unavailabilities_player ON unavailabilities(player_id);
CREATE INDEX idx_unavailabilities_dates ON unavailabilities(start_date, end_date);
CREATE INDEX idx_weekly_times_player ON weekly_times(player_id);
CREATE INDEX idx_weekly_times_active ON weekly_times(player_id) WHERE is_active = TRUE;
CREATE INDEX idx_bookings_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_booked_players_booking ON booked_players(booking_id);
CREATE INDEX idx_booked_players_player ON booked_players(player_id);
CREATE INDEX idx_booked_players_status ON booked_players(status);
CREATE INDEX idx_friends_player ON friends(player_id);
CREATE INDEX idx_friends_friend ON friends(friend_id);
CREATE INDEX idx_messages_player ON messages(player_id);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_direction ON messages(direction);
CREATE INDEX idx_ai_suggestions_player ON ai_response_suggestions(player_id);
CREATE INDEX idx_ai_suggestions_approved ON ai_response_suggestions(approved);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
