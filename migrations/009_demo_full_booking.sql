-- Demo: Full bokning med 4 spelare som svarat ja
-- Kör denna fil i Supabase SQL Editor

-- Skapa 4 nya spelare (OBS: first_name + last_name istället för name)
-- Use UUIDs som redan finns i databasen
INSERT INTO players (id, phone, first_name, last_name, elo, is_active) VALUES
  ('d1b2c3d4-0000-0000-0000-000000000010', '+46701234570', 'Erik', 'Eriksson', 1250, true)
ON CONFLICT DO NOTHING;

INSERT INTO players (id, phone, first_name, last_name, elo, is_active) VALUES
  ('d1b2c3d4-0000-0000-0000-000000000011', '+46701234571', 'Anna', 'Andersson', 1300, true)
ON CONFLICT DO NOTHING;

INSERT INTO players (id, phone, first_name, last_name, elo, is_active) VALUES
  ('d1b2c3d4-0000-0000-0000-000000000012', '+46701234572', 'Karl', 'Karlsson', 1150, true)
ON CONFLICT DO NOTHING;

INSERT INTO players (id, phone, first_name, last_name, elo, is_active) VALUES
  ('d1b2c3d4-0000-0000-0000-000000000013', '+46701234573', 'Maria', 'Martinsson', 1200, true)
ON CONFLICT DO NOTHING;

-- Skapa en fullbemannad bokning ( OBS: kolla om host_player_id behövs)
INSERT INTO bookings (id, scheduled_date, scheduled_time, status)
VALUES ('e1b2c3d4-0000-0000-0000-000000000001', '2026-05-10', '18:00:00', 'confirmed')
ON CONFLICT (id) DO NOTHING;

-- Lägg till host_confirmed för att markera att värden bekräftat
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_confirmed BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_player_id UUID REFERENCES players(id);

-- Uppdatera värden
UPDATE bookings SET host_confirmed = true, host_player_id = 'a1b2c3d4-0000-0000-0000-000000000001' WHERE id = 'e1b2c3d4-0000-0000-0000-000000000001';
UPDATE bookings SET host_confirmed = true, host_player_id = 'a1b2c3d4-0000-0000-0000-000000000001' WHERE id = 'e1b2c3d4-0000-0000-0000-000000000002';

-- Lägg till 4 bekräftade spelare
INSERT INTO booked_players (id, booking_id, player_id, status, response, responded_at, invite_number) VALUES
  ('f1b2c3d4-0000-0000-0000-000000000001', 'e1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'confirmed', 'ja', NOW() - INTERVAL '1 day', 1),
  ('f1b2c3d4-0000-0000-0000-000000000002', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000010', 'confirmed', 'ja', NOW() - INTERVAL '2 days', 1),
  ('f1b2c3d4-0000-0000-0000-000000000003', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000011', 'confirmed', 'ja', NOW() - INTERVAL '1 day', 2),
  ('f1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000012', 'confirmed', 'ja', NOW() - INTERVAL '3 days', 1)
ON CONFLICT (id) DO NOTHING;

-- Lägg till meddelanden för varje spelare
INSERT INTO messages (id, booking_id, player_id, direction, content, sent_at, response_received_at, response) VALUES
  -- Spelare 1 - Anna Svensson
  ('g1b2c3d4-0000-0000-0000-000000000001', 'e1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'outgoing', 'Hej Anna! Vill du spela padel lördag 18:00?', NOW() - INTERVAL '4 days', NULL, NULL),
  ('g1b2c3d4-0000-0000-0000-000000000002', 'e1b2c3d4-0000-0000-0000-000000000001', 'a1b2c3d4-0000-0000-0000-000000000001', 'incoming', 'Ja, absolut!', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 'ja'),
  -- Spelare 2 - Erik Eriksson
  ('g1b2c3d4-0000-0000-0000-000000000003', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000010', 'outgoing', 'Hej Erik! Vill du spela padel lördag 18:00?', NOW() - INTERVAL '3 days', NULL, NULL),
  ('g1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000010', 'incoming', 'Ja, det låter kul!', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'ja'),
  -- Spelare 3 - Anna Andersson
  ('g1b2c3d4-0000-0000-0000-000000000005', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000011', 'outgoing', 'Hej Anna! Vill du spela padel lördag 18:00?', NOW() - INTERVAL '2 days', NULL, NULL),
  ('g1b2c3d4-0000-0000-0000-000000000006', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000011', 'incoming', 'Ja, jag kommer!', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'ja'),
  -- Spelare 4 - Karl Karlsson
  ('g1b2c3d4-0000-0000-0000-000000000007', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000012', 'outgoing', 'Hej Karl! Vill du spela padel lördag 18:00?', NOW() - INTERVAL '4 days', NULL, NULL),
  ('g1b2c3d4-0000-0000-0000-000000000008', 'e1b2c3d4-0000-0000-0000-000000000001', 'd1b2c3d4-0000-0000-0000-000000000012', 'incoming', 'Ja, kör vi!', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'ja')
ON CONFLICT (id) DO NOTHING;

-- Skapa en halvfull bokning (2/4 confirmed)
INSERT INTO bookings (id, scheduled_date, scheduled_time, status)
VALUES ('e1b2c3d4-0000-0000-0000-000000000002', '2026-05-07', '19:00:00', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO booked_players (id, booking_id, player_id, status, response, responded_at, invite_number) VALUES
  ('f1b2c3d4-0000-0000-0000-000000000010', 'e1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'confirmed', 'ja', NOW() - INTERVAL '1 day', 1),
  ('f1b2c3d4-0000-0000-0000-000000000011', 'e1b2c3d4-0000-0000-0000-000000000002', 'd1b2c3d4-0000-0000-0000-000000000010', 'confirmed', 'ja', NOW() - INTERVAL '2 days', 1),
  ('f1b2c3d4-0000-0000-0000-000000000012', 'e1b2c3d4-0000-0000-0000-000000000002', 'd1b2c3d4-0000-0000-0000-000000000011', 'invited', NULL, NULL, 1),
  ('f1b2c3d4-0000-0000-0000-000000000013', 'e1b2c3d4-0000-0000-0000-000000000002', 'd1b2c3d4-0000-0000-0000-000000000012', 'invited', NULL, NULL, 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, booking_id, player_id, direction, content, sent_at, response_received_at, response) VALUES
  ('g1b2c3d4-0000-0000-0000-000000000020', 'e1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'outgoing', 'Hej Anna! Vill du spela onsdag 19:00?', NOW() - INTERVAL '2 days', NULL, NULL),
  ('g1b2c3d4-0000-0000-0000-000000000021', 'e1b2c3d4-0000-0000-0000-000000000002', 'a1b2c3d4-0000-0000-0000-000000000001', 'incoming', 'Ja, jag kan!', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'ja'),
  ('g1b2c3d4-0000-0000-0000-000000000022', 'e1b2c3d4-0000-0000-0000-000000000002', 'd1b2c3d4-0000-0000-0000-000000000010', 'outgoing', 'Hej Erik! Vill du spela onsdag 19:00?', NOW() - INTERVAL '3 days', NULL, NULL),
  ('g1b2c3d4-0000-0000-0000-000000000023', 'e1b2c3d4-0000-0000-0000-000000000002', 'd1b2c3d4-0000-0000-0000-000000000010', 'incoming', 'Ja, kör!', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'ja'),
  ('g1b2c3d4-0000-0000-0000-000000000024', 'e1b2c3d4-0000-0000-0000-000000000002', 'd1b2c3d4-0000-0000-0000-000000000011', 'outgoing', 'Hej Anna! Vill du spela onsdag 19:00?', NOW() - INTERVAL '1 day', NULL, NULL),
  ('g1b2c3d4-0000-0000-0000-000000000025', 'e1b2c3d4-0000-0000-0000-000000000002', 'd1b2c3d4-0000-0000-0000-000000000012', 'outgoing', 'Hej Karl! Vill du spela onsdag 19:00?', NOW() - INTERVAL '1 day', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

SELECT 'Demo data inserted!' AS result;