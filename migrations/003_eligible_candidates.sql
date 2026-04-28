-- Eligible Candidates RPC function
-- Kör denna fil i Supabase SQL Editor efter 002
-- CONFIG: Ändra denna konstant vid behov:
--   base_accept_probability = sannolikhet för spelare som aldrig svarat ja

CREATE OR REPLACE FUNCTION get_eligible_candidates(
    p_host_elo INTEGER,
    p_date DATE,
    p_lookback_days INTEGER DEFAULT 30,
    p_host_id UUID DEFAULT NULL
)
RETURNS TABLE (
    player_id UUID,
    phone TEXT,
    name TEXT,
    elo INTEGER,
    is_friend BOOLEAN,
    last_contacted_at TIMESTAMPTZ,
    accept_probability DOUBLE PRECISION
) AS $$
DECLARE
    base_accept_probability DOUBLE PRECISION := 0.2;
BEGIN
    RETURN QUERY
    WITH player_base AS (
        SELECT
            p.id,
            p.phone,
            p.name,
            p.elo,
            CASE
                WHEN EXISTS (SELECT 1 FROM friends f WHERE f.friend_id = p.id AND f.player_id = p_host_id)
                THEN true
                ELSE false
            END AS is_friend,
            (SELECT MAX(m.sent_at) FROM messages m WHERE m.player_id = p.id AND m.direction = 'outgoing') AS last_contacted_at
        FROM players p
        WHERE p.is_active = true
          AND p.elo BETWEEN p_host_elo - 200 AND p_host_elo + 200
    ),
    recent_stats AS (
        SELECT m.player_id,
            COUNT(*) FILTER (WHERE m.response = 'ja') AS yes_count,
            COUNT(*) AS total_count
        FROM messages m
        WHERE m.sent_at >= NOW() - (p_lookback_days || ' days')::INTERVAL
          AND m.response IS NOT NULL
        GROUP BY m.player_id
    )
    SELECT
        pb.id,
        pb.phone,
        pb.name,
        pb.elo,
        pb.is_friend,
        pb.last_contacted_at,
        CASE
            WHEN rs.yes_count IS NULL OR rs.yes_count = 0 THEN base_accept_probability
            ELSE rs.yes_count::DOUBLE PRECISION / rs.total_count
        END AS accept_probability
    FROM player_base pb
    LEFT JOIN unavailabilities u
        ON u.player_id = pb.id
        AND u.start_date <= p_date
        AND u.end_date >= p_date
    LEFT JOIN recent_stats rs ON rs.player_id = pb.id
    WHERE u.id IS NULL
    ORDER BY pb.is_friend DESC, pb.last_contacted_at ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testa funktionen:
-- SELECT * FROM get_eligible_candidates(1200, '2025-01-15', 30, NULL);

-- Logik:
--   0 ja-svar → base_accept_probability (t.ex. 0.3 = 30%)
--   ≥1 ja-svar → ja_rate (antal ja / totala svar)
